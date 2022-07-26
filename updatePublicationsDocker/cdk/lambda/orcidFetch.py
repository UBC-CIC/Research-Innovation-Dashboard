import requests
import csv
import boto3
import psycopg2
import csv
import codecs
import os

ssm_client = boto3.client('ssm')
s3_client = boto3.client("s3")

BASE_HEADERS = {'Accept':'application/orcid+json'}

'''
Fetches Scopus/Scival API credentials (API key nad insitution key) and also
fetches the rds database credentials from secrets manager
'''
def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId='vpri/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials

'''
Returns an array of Orcid id's in the elsevier_data table of the database
'''
def getAuthorIds():
    credentials = getCredentials()
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
def storeAuthors(authors):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    for author in authors:
        queryline1 = "INSERT INTO public.orcid_data(id, num_patents_filed) VALUES ('" + str(author['orcid_id']) + "', " + str(author['num_patents']) + ")"
        queryline2 = "ON CONFLICT (id) DO UPDATE "
        queryline3 = "SET num_patents_filed='" + str(author['num_patents']) + "'"
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
Fetches researcher data from the Orcid API and stores that data
in the database. Passes it's input directly to the next step.
'''
def lambda_handler(event, context):
    authors = []
    author_ids = getAuthorIds()
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
    
    storeAuthors(authors)
    return event
