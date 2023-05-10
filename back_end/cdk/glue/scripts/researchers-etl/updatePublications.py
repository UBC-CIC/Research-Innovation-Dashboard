import requests
import json
import boto3
import psycopg2
import os
import math
import time
import sys
from awsglue.utils import getResolvedOptions

args = getResolvedOptions(sys.argv, ["DB_SECRET_NAME", "DMS_TASK_ARN"])
DB_SECRET_NAME = args["DB_SECRET_NAME"]

ssm_client = boto3.client('ssm')
sm_client = boto3.client('secretsmanager')
dms_client = boto3.client('dms')
glue_client = boto3.client('glue')

logging = True

def log(input):
    if logging == True:
        print(input)

#Will Need To Think About Where To Get Credentials From With CDK!!!!
def getCredentials():
    """Using AWS secrets manager the function returns the databases credentials"""
    credentials = {}
    response = sm_client.get_secret_value(SecretId=DB_SECRET_NAME)
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials

#This function takes an array of up to 25 reseracher IDs.
# The function returns an array of the same lenght with their number of documents. 
def getResearcherNumDocuments(authorArray, instoken, apikey):
    """
    authorArray: A list of up to 25 author ID strings.
    instoken: The Scopus institution token.
    apikey: Scopus Api Key

    The function gets the number of documents for each researcher ID in the input and returns a list of the same length containing the researchers' number of documents.
    """
    url = 'https://api.elsevier.com/content/author'
    headers = {'Accept': 'application/json', 'X-ELS-APIKey': apikey['Parameter']['Value'], 'X-ELS-Insttoken': instoken['Parameter']['Value']}
    params = {'field': 'dc:identifier,document-count,h-index', 'author_id': authorArray}

    max_retries = 1
    backoff_factor = 0
    retry_count = 0

    while retry_count < max_retries:
        try:
            response = requests.get(url, headers=headers, params=params)
            if response.status_code == 200:
                authorDataArray = response.json()['author-retrieval-response-list']['author-retrieval-response']
                return authorDataArray
            elif response.status_code == 429:  # Rate limit exceeded
                wait_time = backoff_factor * (2 ** retry_count)
                time.sleep(wait_time)
                retry_count += 1
            else:
                response.raise_for_status()
        except requests.exceptions.RequestException as e:
            log(f"Error fetching data from Scopus API: {e}")
            retry_count += 1

    log(f"Failed to fetch data after {max_retries} retries.")
    return []

def createListOfResearchersToUpdate():
    """
    The function queries the database and creates a list of researchers that need to be updated.
    """
    researchers_to_update = []
    
    # Get database credentials and login
    credentials = getCredentials()
    try:
        connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
        cursor = connection.cursor()
    except Exception as e:
        log(f"Error connecting to the database: {e}")
        return researchers_to_update
    
    instoken = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/instoken', WithDecryption=True)
    apikey = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/key', WithDecryption=True)

    # Fetch researcher data from the database
    local_database_data = fetch_researcher_data(cursor)
    
    # Process researcher data and update h-index
    researchers_to_update = process_researcher_data(cursor, local_database_data, instoken, apikey)
    
    # Close cursor and connection
    cursor.close()
    connection.close()

    return researchers_to_update

def fetch_researcher_data(cursor):
    query = "SELECT id, num_documents FROM public.elsevier_data"
    try:
        cursor.execute(query)
        author_scopus_ids = cursor.fetchall()
        return author_scopus_ids
    except Exception as e:
        log(f"Error fetching researcher data: {e}")
        return []

def process_researcher_data(cursor, local_database_data, instoken, apikey):
    researchers_to_update = []
    
    batch_size = 25
    first_items_batches = [[entry[0] for entry in local_database_data[i:i + batch_size]] for i in range(0, len(local_database_data), batch_size)]
    
    for author_batch in first_items_batches:
        author_data_array = []

        try:
            author_data_array = getResearcherNumDocuments(author_batch, instoken, apikey)
        except Exception as e:
            log(f"Error fetching data from Scopus API: {e}")
            continue
        
        print(author_data_array)

        for index, author_data in enumerate(author_data_array):
            if author_data['@status'] == 'not_found':
                log("Add Researcher To List Of Issue Researchers")
            else:
                researcher_id, num_documents_scopus, h_index = extract_researcher_info(author_data)
                log(researcher_id)
                log(num_documents_scopus)
                log(h_index)
                update_h_index(cursor, researcher_id, h_index)

                local_database_data_num_documents = local_database_data[index + index][1]
                
                if num_documents_scopus > local_database_data_num_documents:
                    researchers_to_update.append(researcher_id)

    return researchers_to_update

def extract_researcher_info(author_data):
    researcher_id = author_data['coredata']['dc:identifier'].split(':')[1]
    num_documents = 0
    h_index = 0
    if author_data['coredata']['document-count'] != None:
        num_documents = int(author_data['coredata']['document-count'])
    if author_data['h-index'] != None:
        h_index = int(author_data['h-index'])
        
    return researcher_id, num_documents, h_index

def update_h_index(cursor, researcher_id, h_index):
    query = f"UPDATE public.elsevier_data SET h_index={h_index} WHERE id='{researcher_id}'"
    try:
        cursor.execute(query)
    except Exception as e:
        log(f"Error updating h-index: {e}")
  
def makeInitialPublicationsRequest(author_id, apikey, instoken):
    url = 'https://api.elsevier.com/content/search/scopus'
    headers = {'Accept' : 'application/json', 'X-ELS-APIKey' : apikey['Parameter']['Value'], 'X-ELS-Insttoken' : instoken['Parameter']['Value']}
    query = {'query': 'AU-ID(' + author_id + ')', 'view' : 'COMPLETE', 'cursor': '*'}

    max_retries = 1
    backoff_factor = 0
    retry_count = 0

    while retry_count < max_retries:
        try: 
            response = requests.get(url, headers=headers, params=query)
            if response.status_code == 200:
                return response
            elif response.status_code == 429:  # Rate limit exceeded
                wait_time = backoff_factor * (2 ** retry_count)
                time.sleep(wait_time)
                retry_count += 1
            else:
                response.raise_for_status()
        except requests.exceptions.RequestException as e:
            log(f"Error fetching data from Scopus API: {e}")
            retry_count += 1

    log(f"Failed to fetch data after {max_retries} retries.")
    return []

def requestNextScopusPublicationPage(rjson, apikey, instoken):
    headers = {'Accept' : 'application/json', 'X-ELS-APIKey' : apikey['Parameter']['Value'], 'X-ELS-Insttoken' : instoken['Parameter']['Value']}
    
    max_retries = 1
    backoff_factor = 0
    retry_count = 0

    try: 
        next_url = rjson['search-results']['link'][2]['@href']
    except Exception as e:
        log(f"Error occurred while getting next url: {e}")
        return []

    while retry_count < max_retries:
        try: 
            response = requests.get(next_url, headers=headers)
            if response.status_code == 200:
                return response
            elif response.status_code == 429:  # Rate limit exceeded
                wait_time = backoff_factor * (2 ** retry_count)
                time.sleep(wait_time)
                retry_count += 1
            else:
                response.raise_for_status()
        except requests.exceptions.RequestException as e:
            log(f"Error fetching data from Scopus API: {e}")
            retry_count += 1

    log(f"Failed to fetch data after {max_retries} retries.")
    return []

def checkIfPublicationIsInDatabase(publication, cursor):
    try:
        keys = publication.keys()
        id = ''

        if(list(keys).count('dc:identifier')):
            for c in publication['dc:identifier']:
                if c.isdigit():
                    id = id + c

        query = "SELECT COUNT(*) FROM publication_data WHERE id='"+id+"'"
        cursor.execute(query)
        results = cursor.fetchone()

        #Return False if not in the database
        if(results[0] == 0):
            return False
        
        #Return True if it is in the database
        return True

    except Exception as e:
        log(f"Error occurred while updating publications: {e}")
        return None

def handlePublicationInDatabase(publication, author_id, cursor, connection):
    try: 
        keys = publication.keys()
        if(int(publication['author-count']['@total']) > 100):
            #If the publication is above 100 check if the current researcher is in it
            query = "SELECT COUNT(*) FROM publication_data WHERE id='"+id+"' AND ('"+author_id+"' = ANY(author_ids))"
            cursor.execute(query)
            authorInPublicationResult = cursor.fetchone()
            #If author is not in publication add them to it
            if(authorInPublicationResult[0] == 0):
                query = "SELECT author_ids FROM publication_data WHERE id='"+id+"'"
                cursor.execute(query)
                pubToAddAuthorToResult = cursor.fetchone()
                #Add researcher to author id array
                authorIdArray = pubToAddAuthorToResult[0]
                authorIdArray.append(author_id)
                authorIdArray = str(authorIdArray.replace('\'', '"').replace('[', '{').replace(']', '}'))
                query = "UPDATE publication_data SET author_ids='"+authorIdArray+"' WHERE id='"+id+"' "
                cursor.execute(query)
                #Update Author Keywords
                publicationToUpdate = []
                #Get Keywords to Update
                if(list(keys).count('authkeywords')):
                    keywords_string = publication['authkeywords']
                    keywords = keywords_string.split('|')
                    keywords = [keyword.strip() for keyword in keywords]
                publicationToUpdate.append({'keywords': keywords})
                #Store new keywords
                store_keywords(author_id, publicationToUpdate, cursor)
                #Commit Changes to database
                connection.commit()
    except Exception as e:
        log(f"Error occurred checking publication already storred: {e}")

def handlePublicationNotInDatabase(publication, author_id):
    try:
        log(publication)
        author_ids = []
        author_names = []

        title = publication['dc:title']
        doi = publication['prism:doi']
        journal = publication['prism:publicationName']
        cited_by = int(publication['citedby-count'])
        year_published = publication['prism:coverDate'][0:4]
        link = publication['link'][2]['@href']

        keywords_string = publication['authkeywords']
        keywords = keywords_string.split('|')
        keywords = [keyword.strip() for keyword in keywords]

        scopus_authors = publication['author']
        #This flag is used to see if the specfic author is added to the publication
        authorInList = False
        for author in scopus_authors:
            if(author['authid'] == author_id):
                authorInList = True
            author_ids.append(author['authid'])
            author_names.append(author['authname'])
        
        if(authorInList == False):
            #Add Author to ids and names because they were not added yet
            author_ids.append(author_id)

        #Return the publication to add to missing publications
        return True, {'doi': doi, 'id': id, 'title': title, 
                            'keywords': keywords, 'journal': journal, 'cited_by': cited_by, 
                            'year_published': year_published, 'author_ids': author_ids, 
                            'author_names': author_names, 'link': link}

    except Exception as e:
        log(f"Error occurred building publication to store it: {e}")
        return False, {}

def fetchMissingPublications(author_id, apikey, instoken, cursor, connection):
    """
    author_id: The author ID to fetch missing publications for
    apikey: your scopus apikey
    instoken: your scopus institution token
    cursor: using psycopg2 we can create a cursor to access the postgresql database

    The function fetches the missing publications for the given author ID.
    The function then returns the list of missing functions.
    """

    #Try to get number of documents for the researcher
    #If it errors out return an empty array
    try: 
        query = "SELECT num_documents FROM public.elsevier_data WHERE id='"+author_id+"'"
        cursor.execute(query)
        results = cursor.fetchone()
        StoredResults = results[0]
    except Exception as e:
        log(f"Error occurred while updating publications: {e}")
        return []
    

    response = makeInitialPublicationsRequest(author_id, apikey, instoken)
    try:
        rjson = response.json()
        keys = rjson.keys()
    except Exception as e:
        log(f"Error occured with publications fetch: {e}")
        return []

    if(list(keys).count('search-results') == 0):
        log("Scopus Search Limit Hit Update Publications will run again next week")
        return []
    
    try: 
        totalResults = int(rjson['search-results']['opensearch:totalResults'])
    except Exception as e:
        log(f"Error with scopus response formatting: {e}")
        return []
    totalNumberOfPages = math.ceil(totalResults/25)
    
    
    #Check if the researchers new publication has already been inserted into the database.
    if(StoredResults > totalResults):
        log("ERROR! TOO MANY PUBS FOR RESEARCHER!")
        return []
    if(StoredResults == totalResults):
        log("Have all researchers publications")
        return []
    
    #For each of the researchers 25 new publications check if it is already in the database.
    #If the publication is not in the database add the publication to the missing publications list.
    missingPublications = []
    currentPage = 0
    for currentPage in range(totalNumberOfPages):
        publications = rjson['search-results']['entry']
        for publication in publications:
            
            publicationInDatabase = checkIfPublicationIsInDatabase(publication, cursor)

            if(publicationInDatabase == None):
                #NEED TO DOUBLE CHECK THIS BUT continue should go to the next publication 
                continue

            if(publicationInDatabase == True):
                #Handle true logic (publication in database)
                handlePublicationInDatabase(publication, author_id, cursor, connection)
            else:
                #Handle false logic (publication not in database)
                success, publication = handlePublicationNotInDatabase(publication, author_id)
                if(success):
                    missingPublications.append(publication)
                    StoredResults += 1

        #Check if we got all the new publications
        if(StoredResults == totalResults):
            break

        # If there are more pages to fetch, get the next page of publications
        response = requestNextScopusPublicationPage(rjson, apikey, instoken)

        # This means the code was unable to fetch the next page
        if response == []:
            break
        
        rjson = response.json()

    return missingPublications

def getResearcherCurrentNumDocuments(author_id, cursor):
    try:
        query = "SELECT num_documents FROM public.elsevier_data WHERE id=%s"
        cursor.execute(query, (author_id,))
        results = cursor.fetchone()
        StoredResults = results[0]
        return StoredResults
    except Exception as e:
        log(f"Error in getResearcherCurrentNumDocuments: {e}")
        return -1

def updateResearcherInformation(author_id, num_documents, cursor):
    """
    author_id: An author ID
    num_documents: The number of documents that the author has
    cursor: Used to query the postgresql database

    This function sets an authors number of documents in the database.
    """
    
    try:
        query = "UPDATE public.elsevier_data SET num_documents = %s WHERE id=%s"
        cursor.execute(query, (num_documents, author_id))
    except Exception as e:
        log(f"Error in updateResearcherInformation: {e}")

def store_publications(publications, cursor):
    """
    publications: List of publications to add to the database.
    cursor: used to access the database.
    This function stores a list of new publications in the database.
    """
    
    for publication in publications:
        try:
            # Format each field
            publication['id'] = publication['id']
            publication['title'] = publication['title'].replace('\'', "''")
            publication['author_ids'] = str(publication['author_ids']).replace('\'', '"').replace('[', '{').replace(']', '}')
            publication['author_names'] = str(publication['author_names'])[2:-2].replace(" '", " ").replace("',", ",").replace("'", "''")
            publication['keywords'] = str(publication['keywords'])[2:-2].replace(" '", " ").replace("',", ",").replace("'", "''")
            publication['journal'] = publication['journal'].replace("'", "''")
            publication['cited_by'] = str(publication['cited_by'])
            publication['year_published'] = publication['year_published']


            query = (f"INSERT INTO public.publication_data(id, doi, title, author_ids, author_names, keywords, journal, cited_by, year_published, link) "
                     f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
                     f"ON CONFLICT (id) DO UPDATE "
                     f"SET doi=%s, title=%s, author_ids=%s, author_names=%s, journal=%s, year_published=%s, cited_by=%s, keywords=%s, link=%s")

            cursor.execute(query, (publication['id'], publication['doi'], publication['title'], publication['author_ids'],
                                   publication['author_names'], publication['keywords'], publication['journal'], publication['cited_by'],
                                   publication['year_published'], publication['link'], publication['doi'], publication['title'],
                                   publication['author_ids'], publication['author_names'], publication['journal'], publication['year_published'],
                                   publication['cited_by'], publication['keywords'], publication['link']))

        except Exception as e:
            log(f"Error in store_publications: {e}")

def store_keywords(author_id, publications, cursor):
    """
    author_id: Researchers ID to add keywords to
    publications: List of publications that have keywords to be added to the researcher
    cursor: Used to connect to the database

    The function adds the publications keywords to the reserachers keywords list
    """
    try: 
        unsorted_keywords = []
        for publication in publications:
            for keyword in publication['keywords']:
                unsorted_keywords.append(keyword)

        
        keywords = unsorted_keywords
        
        #Get rid of all the commas, single quotes and double quotes from keywords
        for keyword in keywords:
            keyword = keyword.replace(',', '')
        # Get rid of all single quotes around each keyword
        keywords_string = str(keywords)[1:-1].replace('"', '').replace("'", "")

        query = "SELECT keywords FROM researcher_data WHERE scopus_id='" + author_id + "'"
        cursor.execute(query)
        results = cursor.fetchone()

        keywords_string = results[0] + ", " + keywords_string
    except Exception as e:
        log(f"Error in processing of store_keywords: {e}")
    
    try:
        query = "UPDATE public.researcher_data SET keywords=%s WHERE scopus_id=%s"
        cursor.execute(query, (keywords_string, author_id))
    except Exception as e:
        log(f"Error in store_keywords: {e}")
        log(author_id)
        log(keywords_string)

def updateResearchers(researchersToUpdateArray, instoken, apikey, connection, cursor):
    """
    researchersToUpdateArray: A list of researcher IDs to update.

    This function iterates through a list of researcher IDs.
    The function then updates the researchers num_documents and keywords field.
    The function then puts the publications into the database.
    """

    total_publications_updated = 0

    #Loop through all researchers to update.
    while (len(researchersToUpdateArray) > 0):
        #This fetches all publications missing for a researcher
        missingPublications = fetchMissingPublications(researchersToUpdateArray.pop(0), apikey, instoken, cursor, connection)
        
        for publication in missingPublications:
            total_publications_updated += 1
            for author_id in publication['author_ids']:
                query = "SELECT COUNT(*) FROM elsevier_data WHERE id=%s"
                cursor.execute(query, (author_id,))
                results = cursor.fetchone()
                if(results[0] == 1):
                    current_num_documents = getResearcherCurrentNumDocuments(author_id, cursor)
                    #If it is -1 there was an error with the fetch
                    if current_num_documents != -1:
                        updateResearcherInformation(author_id, current_num_documents + 1, cursor)
                        store_keywords(author_id, missingPublications, cursor)

        store_publications(missingPublications, cursor)
        connection.commit()

    return total_publications_updated

def main():

    log("Starting Update Publications")

    instoken = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/instoken', WithDecryption=True)
    apikey = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/key', WithDecryption=True)

    credentials = getCredentials()

    try:
        with psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db']) as connection:
            with connection.cursor() as cursor:
                researcherArray = createListOfResearchersToUpdate()
                log(f"Finished Creating List Of Researchers To Update. List of researchers is: {researcherArray}")

                NumberOfPublicationsUpdate = updateResearchers(researcherArray, instoken, apikey, connection, cursor)
                log("Finished Updating Researchers")

                query = "INSERT INTO update_publications_logs(date_updated, number_of_publications_updated) VALUES (%s, %s)"
                cursor.execute(query, (time.time(), NumberOfPublicationsUpdate))

                log(f"Number of Publications Added: {NumberOfPublicationsUpdate}")
                connection.commit()

    except Exception as e:
        log(f"Error occurred while updating publications: {e}")

    log("Finished Updating Publication")

    # Start the Glue job which starts dms replication
    job_name = "expertiseDashboard-startDmsReplicationTask-updatePublications"
    response = glue_client.start_job_run(JobName=job_name)

    # Print the job run ID
    log(f"DMS Glue Job started with Run ID: "+str(response['JobRunId']))

main()

# instoken = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/instoken', WithDecryption=True)
# apikey = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/key', WithDecryption=True)
    
# authorArray = ["55765887300"]
    
# url = 'https://api.elsevier.com/content/author'
# headers = {'Accept': 'application/json', 'X-ELS-APIKey': apikey['Parameter']['Value'], 'X-ELS-Insttoken': instoken['Parameter']['Value']}
# params = {'field': 'document-count,h-index', 'author_id': authorArray}

# response = requests.get(url, headers=headers, params=params)
# log(response)