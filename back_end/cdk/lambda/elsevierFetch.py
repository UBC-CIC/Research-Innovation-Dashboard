import json
import requests
import boto3
import psycopg2
import csv
import codecs
import math
import os

ssm_client = boto3.client('ssm')
sm_client = boto3.client('secretmanager')
s3_client = boto3.client("s3")
instoken = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/instoken', WithDecryption=True)
apikey = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/key', WithDecryption=True)
elsevier_headers = {'Accept' : 'application/json', 'X-ELS-APIKey' : apikey['Parameter']['Value'], 'X-ELS-Insttoken' : instoken['Parameter']['Value']}

'''
Fetches the rds database credentials from secrets manager
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
Given an array of authors, stores the authors attached information in the 
elsevier_data table of the database
'''
def storeAuthors(authors):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    for author in authors:
        if 'num_citations' not in author.keys():
            author['num_citations'] = 0
        if 'num_documents' not in author.keys():
            author['num_documents'] = 0
        if 'h_index' not in author.keys():
            author['h_index'] = 0
        if 'orcid_id' not in author.keys():
            author['orcid_id'] = '0'
        queryline1 = "INSERT INTO public.elsevier_data(id, num_citations, num_documents, h_index, orcid_id) "
        queryline2 = "VALUES ('" + str(author['scopus_id']) + "', " + str(author['num_citations']) + ", " + str(author['num_documents']) + ", " + str(author['h_index']) + ", '" + author['orcid_id'] + "')"
        queryline3 = "ON CONFLICT (id) DO UPDATE "
        queryline4 = "SET num_citations='" + str(author['num_citations']) + "', num_documents='" + str(author['num_documents']) + "', h_index='" + str(author['h_index']) + "', orcid_id='" + author['orcid_id'] + "'"
        cursor.execute(queryline1 + queryline2 + queryline3 + queryline4)
    cursor.close()
    connection.commit()

'''
Returns an array of Scopus id's in the researcher_data table of the database
'''
def getAuthorIds():
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    query = "SELECT scopus_id FROM public.researcher_data"
    cursor.execute(query)
    results = cursor.fetchall()
    cursor.close()
    connection.commit()
    return results

'''
Given an array, splits the array into chunks of size n
'''
def split_array(lst, n):
    ret_arr = []
    for i in range(0, len(lst), n):
         ret_arr.append(lst[i:i + n])
    return ret_arr

'''
Given an array of authors, fetches the 5 year h-index from the Scival API 
for each author and appends it to the authors info. Fetches data for 100 
authors on each API call
'''
def sciValFetch(authors):
    url = os.environ.get('SCIVAL_URL')
    max_authors = int(os.environ.get('SCIVAL_MAX_AUTHORS'))
    authors_split = split_array(authors, max_authors)
    for author_subset in authors_split:
        author_ids = []
        for author in author_subset:
            author_ids.append(int(author['scopus_id']))
        query = {'authors' : str(author_ids).replace('[','').replace(']',''),
        'metricTypes' : 'HIndices',
        'yearRange': '5yrs',
        'byYear' : 'false'
        }
        response = requests.get(url, headers=elsevier_headers, params=query)
        results = response.json()['results']
        for result in results:
            for author in author_subset:
                if (int(author['scopus_id']) == result['author']['id']):
                    if(list(result['metrics'][0].keys()).count('value')):
                        author['h_index'] = result['metrics'][0]['value']

'''
Given an array of authors, fetches the authors total number of documents, 
total number of citations, and the authors Orcid id if available from the 
Scopus API for each author and appends it to the authors info. Fetches data for 
25 authors on each API call
'''        
def scopus_fetch(authors):
    url = os.environ.get('SCOPUS_URL')
    max_authors = int(os.environ.get('SCOPUS_MAX_AUTHORS'))
    authors_split = split_array(authors, max_authors)
    for author_subset in authors_split:
        author_ids = []
        for author in author_subset:
            author_ids.append(author['scopus_id'])
        
        query = {'author_id' : author_ids}
        response = requests.get(url, headers=elsevier_headers, params=query)
        if (len(author_ids) == 1):
            results = response.json()['author-retrieval-response']
        else:
            results = response.json()['author-retrieval-response-list']['author-retrieval-response']
        for result in results:
            data = result['coredata']
            print(data)
            for author in author_subset:
                if author['scopus_id'] in data['dc:identifier']:
                    if 'orcid' in data.keys():
                        author['orcid_id'] = data['orcid']
                    if 'document-count' in data.keys():
                        author['num_documents'] = data['document-count']
                    if 'cited-by-count' in data.keys():
                        author['num_citations'] = data['cited-by-count']

'''
Fetches researcher data from the Scopus and Scival API's and stores that data
in the database. Requires no input.
'''
def lambda_handler(event, context):
    authors = []
    author_scopus_ids = getAuthorIds()
    for i in range(len(author_scopus_ids)):
        authors.append({'scopus_id': author_scopus_ids[i][0]})
    scopus_fetch(authors)
    sciValFetch(authors)
    storeAuthors(authors)
    max_authors = int(os.environ.get('SCOPUS_MAX_AUTHORS'))
    return split_array(author_scopus_ids, max_authors)
