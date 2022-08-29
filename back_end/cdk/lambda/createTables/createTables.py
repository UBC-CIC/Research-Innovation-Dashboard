import boto3
import psycopg2
import json

sm_client = boto3.client('secretsmanager')

def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId='vpri/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials

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

def lambda_handler(event, context):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    
    # Create Researcher Data Table
    columns = []
    columns.append(createColumn('employee_id', 'character varying', 'NOT NULL PRIMARY KEY', False))
    columns.append(createColumn('first_name', 'character varying', '', False))
    columns.append(createColumn('last_name', 'character varying', '', False))
    columns.append(createColumn('preferred_name', 'character varying', '', False))
    columns.append(createColumn('email', 'character varying', '', False))
    columns.append(createColumn('rank', 'character varying', '', False))
    columns.append(createColumn('job_stream', 'character varying', '', False))
    columns.append(createColumn('prime_department', 'character varying', '', False))
    columns.append(createColumn('second_department', 'character varying', '', False))
    columns.append(createColumn('prime_faculty', 'character varying', '', False))
    columns.append(createColumn('second_faculty', 'character varying', '', False))
    columns.append(createColumn('campus', 'character varying', '', False))
    columns.append(createColumn('scopus_id', 'character varying', '', False))
    columns.append(createColumn('keywords', 'character varying', '(1000000)', False))
    columns.append(createColumn('last_updated', 'character varying', '', True))
    query = createQuery('researcher_data', columns)
    cursor.execute(query)
    
    # Create Elsevier Data Table
    columns = []
    columns.append(createColumn('id', 'character varying', 'NOT NULL PRIMARY KEY', False))
    columns.append(createColumn('num_citations', 'integer', '', False))
    columns.append(createColumn('num_documents', 'integer', '', False))
    columns.append(createColumn('h_index', 'double precision', '', False))
    columns.append(createColumn('orcid_id', 'character varying', '', False))
    columns.append(createColumn('last_updated', 'character varying', '', True))
    query = createQuery('elsevier_data', columns)
    cursor.execute(query)
    
    # Create Orcid Data Table
    columns = []
    columns.append(createColumn('id', 'character varying', 'NOT NULL PRIMARY KEY', False))
    columns.append(createColumn('num_patents_filed', 'integer', '', False))
    columns.append(createColumn('last_updated', 'character varying', '', True))
    query = createQuery('orcid_data', columns)
    cursor.execute(query)
    
    # Create Publication Data Table
    columns = []
    columns.append(createColumn('id', 'character varying', 'NOT NULL PRIMARY KEY', False))
    columns.append(createColumn('title', 'character varying', '', False))
    columns.append(createColumn('journal', 'character varying', '', False))
    columns.append(createColumn('cited_by', 'integer', '', False))
    columns.append(createColumn('year_published', 'character varying', '', False))
    columns.append(createColumn('author_ids', 'character varying[]', '', False))
    columns.append(createColumn('author_names', 'character varying', '', False))
    columns.append(createColumn('keywords', 'character varying', '', False))
    columns.append(createColumn('doi', 'character varying', '', False))
    columns.append(createColumn('link', 'character varying', '', False))
    columns.append(createColumn('last_updated', 'character varying', '', True))
    query = createQuery('publication_data', columns)
    cursor.execute(query)
    
    # Create Update Logs Table
    columns = []
    columns.append(createColumn('table_name', 'character varying', 'NOT NULL PRIMARY KEY', False))
    columns.append(createColumn('last_updated', 'character varying', '', True))
    query = createQuery('data_update_logs', columns)
    cursor.execute(query)
    
    # Create Update Publications Logs Table
    columns = []
    columns.append(createColumn('date_updated', 'character varying', 'NOT NULL PRIMARY KEY', False))
    columns.append(createColumn('number_of_publications_updated', 'character varying', '', True))
    query = createQuery('update_publications_logs', columns)
    cursor.execute(query)
    
    cursor.close()
    connection.commit()
