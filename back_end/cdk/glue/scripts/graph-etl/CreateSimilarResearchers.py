import boto3
import psycopg2
import json


sm_client = boto3.client('secretsmanager')

def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId='expertiseDashboard/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials

query0 = "TRUNCATE TABLE potential_edges"

query = '''
INSERT INTO potential_edges (source_id, target_id, shared_keywords)
SELECT DISTINCT r1.scopus_id AS source_id, r2.scopus_id AS target_id, 
       array_agg(DISTINCT LOWER(trim(k1))) AS shared_keywords
FROM researcher_data r1
JOIN researcher_data r2 ON r1.scopus_id < r2.scopus_id
JOIN regexp_split_to_table(r2.keywords, E',') k2 ON trim(k2) != '' 
JOIN regexp_split_to_table(r1.keywords, E',') k1 ON trim(k1) != '' AND LOWER(trim(k1)) = LOWER(trim(k2))
WHERE NOT EXISTS (
    SELECT 1 FROM edges_full 
    WHERE (source_id = r1.scopus_id AND target_id = r2.scopus_id) 
       OR (source_id = r2.scopus_id AND target_id = r1.scopus_id)
  )
GROUP BY r1.scopus_id, r2.scopus_id
'''

query2 = "insert into potential_edges (source_id, target_id, shared_keywords) select target_id, source_id, shared_keywords from potential_edges"

credentials = getCredentials()
connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
cursor = connection.cursor()

cursor.execute(query0)
cursor.execute(query)
cursor.execute(query2)

cursor.close()
connection.commit()