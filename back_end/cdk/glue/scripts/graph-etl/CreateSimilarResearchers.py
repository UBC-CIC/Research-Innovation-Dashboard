import boto3
import psycopg2
import json


sm_client = boto3.client('secretsmanager')
SHADOW_TABLE = 'shadow_potential_edges'

def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId='expertiseDashboard/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials

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
    columns.append(createColumn('source_id', 'text', '', False))
    columns.append(createColumn('target_id', 'text', '', False))
    columns.append(createColumn('shared_keywords', 'text ARRAY', '', False))
    columns.append(createColumn('last_updated', 'character varying', '', True))
    query = createQuery(SHADOW_TABLE, columns)
    cursor.execute(query)

def sanitizeResponse(researchers):
    responseDict = {}
    for item in researchers:
        keywords = []
        if(len(item[1]) > 0):
            keywords = item[1].split(', ')
        responseDict[item[0]] = keywords
        
    return responseDict

def keyword_list_to_sql_str(keyword_list):
    return 'ARRAY' + '[' + ', '.join(f'\'{keyword}\'' for keyword in keyword_list) + ']'

def get_adjacency_list(edges):
    adjaceny_list = {}
    for edge in edges:
        source = edge[0]
        target = edge[1]
        if not source in adjaceny_list:
            adjaceny_list[source] = [target]
        else:
            adjaceny_list[source].append(target)
        if not target in adjaceny_list:
            adjaceny_list[target] = [source]
        else: adjaceny_list[target].append(source)
    return adjaceny_list

def common_elements(list1, list2):
    return list(set(list1) & set(list2))

credentials = getCredentials()
connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
cursor = connection.cursor()

cursor.execute('SELECT scopus_id, keywords FROM researcher_data')
researchers = cursor.fetchall()

cursor.execute('SELECT source_id, target_id from edges_full')
edges = cursor.fetchall()
 
adjaceny_list = get_adjacency_list(edges)
responseDict = sanitizeResponse(researchers)

rows_potential_edges = []

for source in responseDict.keys():
    for target in responseDict.keys():
        if source != target and (source not in adjaceny_list or target not in adjaceny_list[source]):
            common = common_elements(responseDict[source], responseDict[target])
            if len(common) > 0:
                rows_potential_edges.append([source, target, common])

createShadowTable(cursor)
for row in rows_potential_edges:
    query = f"INSERT INTO {SHADOW_TABLE} (source_id, target_id, shared_keywords) VALUES ({row[0]}, {row[1]}, {keyword_list_to_sql_str(row[2])})"
    cursor.execute(query)

# Swapping the shadow table and potential_edges
cursor.execute(f"ALTER TABLE potential_edges RENAME TO tmp_table")
cursor.execute(f"ALTER TABLE {SHADOW_TABLE} RENAME TO potential_edges")
cursor.execute(f"ALTER TABLE tmp_table RENAME TO {SHADOW_TABLE}")
cursor.execute(f"TRUNCATE TABLE {SHADOW_TABLE}")

cursor.close()
connection.commit()