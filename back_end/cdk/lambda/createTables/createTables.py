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

'''
Given a table name and a list of columns created using createColumn, returns a postgres query to create a table called table_name
with columns as defined in the columns list
'''
def createQuery(table_name, columns):
    query = 'CREATE TABLE IF NOT EXISTS public.' + table_name + ' ('
    for column in columns:
        query = query + column
    query = query + ');'
    return query

'''
Given a column_name, data type, constraints(eg. NOT NULL), and a boolean detailing whether the column is the last one to be added,
Returns a column section of a postgres create table query which can be fed into createQuery
'''        
def createColumn(column_name, columnType, constraints, final_column):
    column = column_name + ' ' + columnType + ' ' + constraints
    if not final_column:
        column = column + ', '
    return column

def lambda_handler(event, context):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()

    #Add extension to create UUID Fields
    query = 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'
    cursor.execute(query)

    # Create Researcher Data Table
    columns = []
    #Added our controlled uuid to database table creation
    columns.append(createColumn('researcher_id', 'uuid', 'DEFAULT uuid_generate_v4() PRIMARY KEY', False))
    columns.append(createColumn('institution_user_id', 'character varying', 'NOT NULL UNIQUE', False))
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
    columns.append(createColumn('extra_ids', 'character varying[]', '', False))
    columns.append(createColumn('pub_ids', 'character varying[]', '', False))
    columns.append(createColumn('keywords', 'character varying', '(10000000)', False))
    columns.append(createColumn('merged_keywords', 'character varying', '(10000000)', False))
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

    # Create Grant Data Table
    columns = []
    columns.append(createColumn('grant_id', 'uuid', 'DEFAULT uuid_generate_v4() PRIMARY KEY', False))
    columns.append(createColumn('assigned_id', 'character varying', 'NOT NULL', False))
    columns.append(createColumn('name', 'character varying', '', False))
    columns.append(createColumn('department', 'character varying', '', False))
    columns.append(createColumn('agency', 'character varying', '', False))
    columns.append(createColumn('grant_program', 'character varying', '', False))
    columns.append(createColumn('amount', 'int', '', False))
    columns.append(createColumn('project_title', 'character varying', '', False))
    columns.append(createColumn('keywords', 'character varying', '(1000000)', False))
    columns.append(createColumn('year', 'character varying', '', False))
    columns.append(createColumn('start_date', 'character varying', '', False))
    columns.append(createColumn('end_date', 'character varying', '', True))
    query = createQuery('grant_data', columns)
    cursor.execute(query)

    # Create Patent Data Table
    columns = []
    columns.append(createColumn('patent_id', 'uuid', 'DEFAULT uuid_generate_v4() PRIMARY KEY', False))
    columns.append(createColumn('patent_number', 'varchar', '',  False))
    columns.append(createColumn('patent_country_code', 'varchar', '', False))
    columns.append(createColumn('patent_kind_code', 'varchar', '', False))
    columns.append(createColumn('patent_title', 'varchar', '', False))
    columns.append(createColumn('patent_inventors', 'varchar', '', False))
    columns.append(createColumn('patent_sponsors', 'varchar', '', False))
    columns.append(createColumn('patent_family_number', 'varchar', '', False))
    columns.append(createColumn('patent_classification', 'varchar', '', False))
    columns.append(createColumn('patent_publication_date', 'varchar', '', False))
    columns.append(createColumn('inventors_assigned_ids', 'varchar', '', False))
    columns.append(createColumn('matched_inventors_names', 'varchar', '', True))
    query = createQuery('patent_data', columns)
    cursor.execute(query)

    cursor.close()
    connection.commit()
