import requests
import boto3
import psycopg2
import json
import os
import time

ssm_client = boto3.client('ssm')
sm_client = boto3.client('secretsmanager')
s3_client = boto3.client("s3")

BASE_HEADERS = {'Accept':'application/orcid+json'}

'''
Fetches Scopus/Scival API credentials (API key nad insitution key) and also
fetches the rds database credentials from secrets manager
'''
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
Returns an array of Orcid id's in the elsevier_data table of the database
'''
def getAuthorIds(credentials):
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    query = "SELECT orcid_id FROM public.elsevier_data"
    cursor.execute(query)
    results = cursor.fetchall()
    cursor.close()
    connection.commit()
    return results

'''
Given an array of authors, stores the authors attached information in the 
orcid_data table of the database
'''
def storeAuthors(authors, credentials):
    time_string = str(time.time())
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    for author in authors:
        queryline1 = "INSERT INTO public.orcid_data(id, num_patents_filed, last_updated) VALUES ('" + str(author['orcid_id']) + "', " + str(author['num_patents']) + ", '" + time_string + "')"
        queryline2 = "ON CONFLICT (id) DO UPDATE "
        queryline3 = "SET num_patents_filed='" + str(author['num_patents']) + "', last_updated='" + time_string + "'"
        cursor.execute(queryline1 + queryline2 + queryline3)
    cursor.close()
    connection.commit()

'''
Given "works" data from Orcid, parses the data to isolate and count the number
patents
'''
def orcidParseWorks(activities):
    works = activities['works']['group']
    patent_count = 0
    if (len(works) == 0):
        return 0
    
    for work in works:
        work_summary = work['work-summary'][0]
        work_type = work_summary['type']
        #work_title = work_summary['title']['title']['value']
        
        if (work_type == 'patent'):
            patent_count += 1
    
    return patent_count

'''
Stores the current time in the data_update_logs table
'''
def storeLastUpdated(updatedTable, credentials):
    time_string = str(time.time())
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    queryline1 = "INSERT INTO public.data_update_logs(table_name, last_updated) "
    queryline2 = "VALUES ('" + updatedTable + "', '" + time_string + "')"
    queryline3 = "ON CONFLICT (table_name) DO UPDATE "
    queryline4 = "SET last_updated='" + time_string + "'"
    cursor.execute(queryline1 + queryline2 + queryline3 + queryline4)
    cursor.close()
    connection.commit()
    return

'''
Fetches researcher data from the Orcid API and stores that data
in the database. Passes it's input directly to the next step.
'''
def lambda_handler(event, context):
    credentials = getCredentials()
    authors = []
    author_ids = getAuthorIds(credentials)
    url = os.environ.get('ORCID_URL')

    for author_id in author_ids:
        authors.append({'orcid_id': author_id[0]})
    
    for author in authors:
        if (author['orcid_id'] != '0'):
            response = requests.get(url + author['orcid_id'], headers=BASE_HEADERS)
            activities = response.json()['activities-summary']
            author['num_patents'] = orcidParseWorks(activities)
        else:
            author['num_patents'] = 0
    
    storeAuthors(authors, credentials)
    storeLastUpdated('orcid_data', credentials)
    return event
