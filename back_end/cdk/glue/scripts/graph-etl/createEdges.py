import psycopg2
import json
import boto3

scopus_id_list = []
SHADOW_TABLE = 'shadow_edges_full'
researcher_columns_no_keywords = 'first_name, last_name, email, rank, prime_department, prime_faculty, scopus_id'

sm_client = boto3.client('secretsmanager')
glue_client = boto3.client('glue')
s3_client = boto3.client('s3')

def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId='expertiseDashboard/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials

def createEdges():
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()

    createShadowTable(cursor)
    
    scopus_id_db = perform_query(connection, 'SELECT scopus_id FROM researcher_data')
    global scopus_id_list
    scopus_id_list = [ item[0] for item in scopus_id_db ]

    adjacency_list = {} # dict: scopus_id -> dict: scopus_id -> set: publication_ids
    edge_counts = {} # dict: scopus_id -> int

    all_publications = fetch_all_publications(connection, 'id, author_ids')

    for row in all_publications:
        pub_id = row[0]
        author_ids = row[1]

        valid_ids = []
        for id in author_ids:
            results = fetch_researcher_with_scopus_id(connection, 'scopus_id', id)
            if len(results) == 0:
                continue
            valid_ids.append(results[0][0])
        
        for i in range(len(valid_ids) - 1):
            for j in range(i + 1, len(valid_ids)):
                author_a_id = valid_ids[i]
                author_b_id = valid_ids[j]

                if author_a_id == author_b_id:
                    continue
                elif author_a_id > author_b_id:
                    # swap
                    temp = author_a_id
                    author_a_id = author_b_id
                    author_b_id = temp
                add_a_to_b_edge(adjacency_list, edge_counts, author_a_id, author_b_id, pub_id)
    
    for source_id in adjacency_list:
        targets_map = adjacency_list[source_id]
        for target_id in targets_map:
            shared_pubs = targets_map[target_id]
            insert_edge(connection.cursor(), source_id, target_id, shared_pubs)
            
    # Swapping the shadow table and edges_full
    cursor.execute(f"ALTER TABLE edges_full RENAME TO tmp_table")
    cursor.execute(f"ALTER TABLE {SHADOW_TABLE} RENAME TO edges_full")
    cursor.execute(f"ALTER TABLE tmp_table RENAME TO {SHADOW_TABLE}")
    cursor.execute(f"TRUNCATE TABLE {SHADOW_TABLE}")
    cursor.close()
    connection.commit()

    edges_S3 = parse_for_S3(adjacency_list)
    upload_to_s3(edges_S3)

def add_a_to_b_edge(adj_list, edge_counts, a_id, b_id, publication_id):
    if a_id not in adj_list:
        adj_list[a_id] = {}
    
    a_adj_dict = adj_list[a_id]
    if b_id not in a_adj_dict:
        a_adj_dict[b_id] = set()
    
    if publication_id not in a_adj_dict[b_id]:
        a_adj_dict[b_id].add(publication_id)
        increment_edge_count_for_researcher(edge_counts, a_id)
        increment_edge_count_for_researcher(edge_counts, b_id)
    
def increment_edge_count_for_researcher(edge_counts, scopus_id):
    if scopus_id not in edge_counts:
        edge_counts[scopus_id] = 0
    edge_counts[scopus_id] += 1

def perform_query(db_connection, query):
    cursor = db_connection.cursor()
    cursor.execute(query)
    results = cursor.fetchall()
    return results
    
def perform_query_no_results(cursor, query):
    cursor.execute(query)

def fetch_publications_of_researcher_with_id(db_connection, fields, scopus_id):
    query = f'''SELECT {fields} 
                FROM publication_data
                WHERE \'{scopus_id}\' = ANY(author_ids);'''
    return perform_query(db_connection, query)

def fetch_researcher_with_scopus_id(db_connection, fields, scopus_id):
    if scopus_id in scopus_id_list:
        return [[scopus_id]]
    else:
        return []

def fetch_all_researchers(db_connection, fields):
    query = f'''SELECT {fields} 
                FROM researcher_data ;'''
    return perform_query(db_connection, query)

def fetch_researchers_from_faculty(db_connection, fields, faculty, limit_rows):
    query = f'''SELECT {fields} 
                FROM researcher_data 
                WHERE prime_faculty = \'{faculty}\' LIMIT {limit_rows};'''
    return perform_query(db_connection, query)

def fetch_all_publications(db_connection, fields, limit_rows=None):
    query = f'''SELECT {fields} 
                FROM publication_data'''
    
    if limit_rows is None:
        query = query + ';'
    else:
        query = query + f' LIMIT {limit_rows};'
    
    return perform_query(db_connection, query)

def write_to_json_file(json_object, path):
    with open(path, 'w') as outfile:
        outfile.write(json_object)

def clearEdges(cursor):
    perform_query_no_results(cursor, "DELETE FROM edges_full")

def insert_edge(cursor, source_id, target_id, publications):
    query = f'''INSERT INTO {SHADOW_TABLE}
                (source_id, target_id, publication_ids, num_publications)
                VALUES (
                    {source_id},
                    {target_id},
                    {publication_list_to_sql_str(publications)},
                    {len(publications)}
                );
    '''
    perform_query_no_results(cursor, query)

# Functions for shadow table - a replica to write to while updating data

def createQuery(table_name, columns):
    query = 'CREATE TABLE IF NOT EXISTS public.' + table_name + ' ('
    for column in columns:
        query = query + column
    query = query + ');'
    return query

def createColumn(column_name, columnType, constraints, final_column):
    column = column_name + ' ' + columnType + ' ' + constraints
    if not final_column:
        column = column + ', '
    return column

def createShadowTable(cursor):
    columns = []
    columns.append(createColumn('source_id', 'character varying', '', False))
    columns.append(createColumn('target_id', 'character varying', '', False))
    columns.append(createColumn('publication_ids', 'text ARRAY', '', False))
    columns.append(createColumn('num_publications', 'integer', '', False))
    columns.append(createColumn('last_updated', 'character varying', '', True))
    query = createQuery(SHADOW_TABLE, columns)
    cursor.execute(query)

def publication_list_to_sql_str(pub_list):
    return 'ARRAY' + '[' + ', '.join(f'\'{pub}\'' for pub in pub_list) + ']'


def parse_for_S3(adjacency_list):
    # Convert to a list of edges to be returned to the frontend
    edge_list = []
    for source_id in adjacency_list:
        for target_id in adjacency_list[source_id]:
            edge_object = {
                'key': f"{source_id}&&{target_id}",
                'source': source_id,
                'target': target_id,
                'undirected': True,
                'attributes': {
                    'size': 3 - 10/(len(adjacency_list[source_id][target_id])+4),
                    'color': '#EDEBE9'
                } 
            }
            edge_list.append(edge_object)
    return edge_list

def upload_to_s3(edges):
    out_file = open("/tmp/edges.json", "w") 
    json.dump(edges, out_file)
    out_file.close()
    # TODO Change S3 bucket name to environment variable (also in cdk + add s3 write permissions)
    s3_client.upload_file('/tmp/edges.json', 'aayushtestbucketxy', 'edges.json')

# Create new edges into SHADOW_TABLE, so that the lock to edges_full is not held up
createEdges()

# Trigger downstream glue job 
# glue_client.start_job_run(JobName="expertiseDashboard-CreateSimilarResearchers")