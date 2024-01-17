import psycopg2
import json
import boto3

researcher_columns_no_keywords = 'first_name, last_name, email, rank, prime_department, prime_faculty, scopus_id'

sm_client = boto3.client('secretsmanager')
glue_client = boto3.client('glue')

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
    
    clearEdges(connection.cursor())

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
            
    cursor.close()
    connection.commit()

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
    query = f'''SELECT {fields} 
                FROM researcher_data
                WHERE scopus_id = \'{scopus_id}\';'''
    return perform_query(db_connection, query)

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
    query = f'''INSERT INTO edges_full
                (source_id, target_id, publication_ids, num_publications)
                VALUES (
                    {source_id},
                    {target_id},
                    {publication_list_to_sql_str(publications)},
                    {len(publications)}
                );
    '''
    print(query)
    perform_query_no_results(cursor, query)

def publication_list_to_sql_str(pub_list):
    return 'ARRAY' + '[' + ', '.join(f'\'{pub}\'' for pub in pub_list) + ']'

# Clear existing edges, create new edges from scratch
createEdges()

# Trigger downstream glue job 
glue_client.start_job_run(JobName="expertiseDashboard-CreateSimilarResearchers")