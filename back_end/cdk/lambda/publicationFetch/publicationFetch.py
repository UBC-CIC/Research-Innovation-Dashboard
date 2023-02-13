import requests
import json
import boto3
import psycopg2
import os
import time
from datetime import datetime

ssm_client = boto3.client('ssm')
sm_client = boto3.client('secretsmanager')

'''
Fetches the rds database credentials from secrets manager
'''


def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(
        SecretId='vpri/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials


'''
Given an authors Scopus id, fetches all their publication data (if it exists)
and returns the publications as a list of dicts
'''


def fetch_publications(author_id):
    instoken = ssm_client.get_parameter(
        Name='/service/elsevier/api/user_name/instoken', WithDecryption=True)
    apikey = ssm_client.get_parameter(
        Name='/service/elsevier/api/user_name/key', WithDecryption=True)
    url = os.environ.get('SCOPUS_SEARCH_URL')
    results_per_page = int(os.environ.get('RESULTS_PER_PAGE'))

    headers = {'Accept': 'application/json',
        'X-ELS-APIKey': apikey['Parameter']['Value'], 'X-ELS-Insttoken': instoken['Parameter']['Value']}
    query = {'query': 'AU-ID(' + author_id + ')',
                             'view': 'COMPLETE', 'cursor': '*'}

    response = requests.get(url, headers=headers, params=query)
    if "error-response" in response.json():
        if "error-code" in response.json()["error-response"]:
            if response.json()["error-response"]["error-code"] == "TOO_MANY_REQUESTS":
                    dateTimeObject = datetime.fromtimestamp(
                        int(response.headers['X-RateLimit-Reset']))
                    raise Exception(
                        "API limit has been exceded! Please try the data pipeline again on " + str(dateTimeObject) + "UTC Time")
            
            if response.json()["error-response"]["error-code"] == "RATE_LIMIT_EXCEEDED":
                print(response.json()["error-response"])
                print("API Throttling, attempt to retry query after 7 seconds")
                time.sleep(7)
                response = requests.get(url, headers=headers, params=query)
                print(response.headers)

    rjson = response.json()
    stored_results = 0
    publications = []
    if 'search-results' not in rjson:
        return (publications)
    total_results = int(rjson['search-results']['opensearch:totalResults'])
   
    while(stored_results < total_results):
        if 'search-results' not in rjson:
            return (publications)
            
        results = rjson['search-results']['entry']
        for result in results:
            keys = result.keys()
            doi = ''
            id = ''
            title = ''
            keywords = []
            journal = ''
            cited_by = None
            year_published = ''
            link = ''
            # This will evaluate to false if the publication no longer exists
            if(list(keys).count('author-count')):
                author_ids = []
                author_names = []
                if(list(keys).count('prism:doi')):
                    doi = result['prism:doi']
                if(list(keys).count('dc:identifier')):
                    for c in result['dc:identifier']:
                        if c.isdigit():
                            id = id + c
                if(list(keys).count('dc:title')):
                    title = result['dc:title']
                if(list(keys).count('authkeywords')):
                    keywords_string = result['authkeywords']
                    keywords = keywords_string.split('|')
                    keywords = [keyword.strip() for keyword in keywords]
                if(list(keys).count('dc:description')):
                    description = result['dc:description']
                if (list(keys).count('prism:publicationName')):
                    journal = result['prism:publicationName']
                if (list(keys).count('citedby-count')):
                    cited_by = int(result['citedby-count'])
                if (list(keys).count('prism:coverDate')):
                    year_published = result['prism:coverDate'][0:4]
                if (list(keys).count('author')):
                    scopus_authors = result['author']
                    for author in scopus_authors:
                        author_ids.append(author['authid'])
                        author_names.append(author['authname'])
                if (list(keys).count('link')):
                    link = result['link'][2]['@href']
                publications.append({'doi': doi, 'id': id, 'title': title, 
                    'keywords': keywords, 'journal': journal, 'cited_by': cited_by, 
                    'year_published': year_published, 'author_ids': author_ids, 
                    'author_names': author_names, 'link': link})
            
            stored_results += 1
        if (stored_results >= total_results):
            break
        next_url = rjson['search-results']['link'][2]['@href']
        response = requests.get(next_url, headers=headers)
        rjson = response.json()
    return(publications)

'''
Given an array of publication data, stores the publications in the 
publication_data table of the database
'''
def store_publications(publications, credentials):
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    
    for publication in publications:
        time_string = str(time.time())
        # Format each field
        publication['id'] = publication['id']
        publication['title'] = publication['title'].replace('\'', "''")
        publication['author_ids'] = str(publication['author_ids']).replace('\'', '"').replace('[', '{').replace(']', '}')
        publication['author_names'] = str(publication['author_names'])[2:-2].replace(" '", " ").replace("',", ",").replace("'", "''")
        publication['keywords'] = str(publication['keywords'])[2:-2].replace(" '", " ").replace("',", ",").replace("'", "''")
        publication['journal'] = publication['journal'].replace("'", "''")
        publication['cited_by'] = str(publication['cited_by'])
        publication['year_published'] = publication['year_published']
        queryline1 = "INSERT INTO public.publication_data(id, doi, title, author_ids, author_names, keywords, journal, cited_by, year_published, link, last_updated) "
        queryline2 = "VALUES ('" + publication['id'] + "', '" + publication['doi'] + "', '" + publication['title'] + "', '" + publication['author_ids'] + "', '" + publication['author_names'] + "', '" + publication['keywords'] + "', '" + publication['journal'] + "', '" + publication['cited_by'] + "', '" + publication['year_published'] + "', '" + publication['link'] + "', '" + time_string + "')"
        queryline3 = "ON CONFLICT (id) DO UPDATE "
        queryline4 = "SET doi='" + publication['doi'] + "', title='" + publication['title'] + "', author_ids='" + publication['author_ids'] + "', author_names='" + publication['author_names'] + "', journal='" + publication['journal'] + "', year_published='" + publication['year_published'] + "', cited_by='" + publication['cited_by'] + "', keywords='" + publication['keywords'] + "', link='" + publication['link'] + "', last_updated='" + time_string + "'"
        cursor.execute(queryline1 + queryline2 + queryline3 + queryline4)
    
    cursor.close()
    connection.commit()

'''
Given an author's Scopus id and the authors publications, stores all keywords 
associated with a researcher as an unsorted list (contains duplicate keywords)
'''
def store_keywords(author_id, publications, credentials):
    pub_ids = []
    unsorted_keywords = []
    for publication in publications:
        pub_ids.append(publication['id'])
        for keyword in publication['keywords']:
            unsorted_keywords.append(keyword)
    pub_ids = str(pub_ids).replace("'", '"').replace('[', '{').replace(']', '}')
    keywords = unsorted_keywords
    
    for keyword in keywords:
        keyword = keyword.replace(',', '')
    # Get rid of all single quotes around each keyword
    keywords_string = str(keywords)[1:-1].replace('"', '').replace("'", "")
    
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    
    query = "UPDATE public.researcher_data SET keywords='" + keywords_string + "', pub_ids='" + pub_ids + "' WHERE scopus_id='" + author_id + "'"
    cursor.execute(query)
    
    cursor.close()
    connection.commit()

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
Fetches publication data from the Scopus API and stores that data
in the database. Takes an array of author ids as input.
'''
def lambda_handler(event, context):
    credentials = getCredentials()
    author_ids = event
    for author_id in author_ids:
        publications = fetch_publications(author_id[0])
        store_keywords(author_id[0], publications, credentials)
        store_publications(publications, credentials)
    storeLastUpdated('publication_data', credentials)
    