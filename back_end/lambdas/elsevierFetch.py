import json
import requests
import boto3
import psycopg2
import csv
import codecs
import math

ssm_client = boto3.client('ssm')
s3_client = boto3.client("s3")
    
def getCredentials():
    credential = {}
    
    ssm_username = ssm_client.get_parameter(Name='/service/publicationDB/username', WithDecryption=True)
    ssm_password = ssm_client.get_parameter(Name='/service/publicationDB/password', WithDecryption=True)
    credential['username'] = ssm_username['Parameter']['Value']
    credential['password'] = ssm_password['Parameter']['Value']
    credential['host'] = 'vpripublicationdb.ct5odvmonthn.ca-central-1.rds.amazonaws.com'
    credential['db'] = 'myDatabase'
    return credential 

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
        queryline1 = "INSERT INTO public.elsevier_data(id, num_citations, num_documents, h_index) "
        queryline2 = "VALUES ('" + str(author['scopus_id']) + "'::text, " + str(author['num_citations']) + "::integer, " + str(author['num_documents']) + "::integer, " + str(author['h_index']) +"::double precision) "
        queryline3 = "ON CONFLICT (id) DO UPDATE "
        queryline4 = "SET num_citations='" + str(author['num_citations']) + "', num_documents='" + str(author['num_documents']) + "', h_index='" + str(author['h_index']) + "'"
        cursor.execute(queryline1 + queryline2 + queryline3 + queryline4)
    cursor.close()
    connection.commit()
    
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

# Given an array, splits the array into chunks of size n
def split_array(lst, n):
    ret_arr = []
    for i in range(0, len(lst), n):
         ret_arr.append(lst[i:i + n])
    return ret_arr 

def lambda_handler(event, context):
    
    instoken = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/instoken', WithDecryption=True)
    apikey = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/key', WithDecryption=True)
    elsevier_headers = {'Accept' : 'application/json', 'X-ELS-APIKey' : apikey['Parameter']['Value'], 'X-ELS-Insttoken' : instoken['Parameter']['Value']}
    url = 'https://api.elsevier.com/analytics/scival/author/metrics'
    
    authors = []
    author_scopus_ids = getAuthorIds()
    for i in range(len(author_scopus_ids)):
        authors.append({'scopus_id': int(author_scopus_ids[i][0])})
    
    # TODO: Make 100 an environment variable
    for i in range(int(math.ceil(len(authors) / 100))):
        # Create an array with 100 author_ids
        if (100 + i * 100 > len(authors)):
            author_ids = [None] * (len(authors) - i * 100)
        else:
            author_ids = [None] * 100
        for j in range(100):
            if (j >= len(authors) - i * 100):
                break
            index = j + i * 100
            author_ids[j] = int(authors[index]['scopus_id'])

        # Query the SciVal API
        query = {'authors' : str(author_ids).replace('[','').replace(']',''), 
        'metricTypes' : 'ScholarlyOutput, CitationCount, HIndices',
        'yearRange': '10yrs',
        'byYear' : 'false'
        }
        response = requests.get(url, headers=elsevier_headers, params=query)
        rjson = response.json()
        results = response.json()['results']
        # TODO: Make the 0, 1, and 2 environment variables
        j = 0
        for result in results:
            for author in authors:
                if(author['scopus_id'] == result['author']['id']):
                    if(list(result['metrics'][0].keys()).count('value')):
                        author['num_documents'] = result['metrics'][0]['value']
                    else:
                        author['num_documents'] = 0
                    if(list(result['metrics'][1].keys()).count('value')):
                        author['num_citations'] = result['metrics'][1]['value']
                    else:
                        author['num_citations'] = 0
                    if(list(result['metrics'][2].keys()).count('value')):
                        author['h_index'] = result['metrics'][2]['value']
                    else:
                        author['h_index'] = 0
                    j += 1
                    break
    
    storeAuthors(authors)
    return split_array(author_scopus_ids, 25)
    
    

