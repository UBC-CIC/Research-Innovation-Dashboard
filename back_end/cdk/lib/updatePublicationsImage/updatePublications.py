import requests
import json
import boto3
import psycopg2
import os
import math
import time

print("Starting Update Publications")

ssm_client = boto3.client('ssm', region_name='ca-central-1')
sm_client = boto3.client('secretsmanager')
dms_client = boto3.client('dms')

#Will Need To Think About Where To Get Credentials From With CDK!!!!
def getCredentials():
    """Using AWS secrets manager the function returns the databases credentials"""
    credentials = {}
    DB_CREDENTIALS_PATH = os.environ['DB_CREDENTIALS_PATH']
    response = sm_client.get_secret_value(SecretId=DB_CREDENTIALS_PATH)
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
    authorArray: A list of upto 25 author ID strings. 
    instoken: The Scopus institution token. 
    apikey: Scopus Api Key

    The function gets the number of documents for each researcher ID in the input and returns a list of the same length containing the reserachers number of documents.
    """
    url = 'https://api.elsevier.com/content/author'
    headers = {'Accept' : 'application/json', 'X-ELS-APIKey' : apikey['Parameter']['Value'], 'X-ELS-Insttoken' : instoken['Parameter']['Value']}
    params = {'field': 'document-count,h-index', 'author_id': authorArray}
    response = requests.get(url, headers=headers, params=params)
    print(response)
    authorDataArray = response.json()['author-retrieval-response-list']['author-retrieval-response']
    return authorDataArray

def createListOfResearchersToUpdate():
    """
    The function queries the database and creates a list of researchers that need to be updated.
    """
    
    researchersToUpdateArray = []
    
    #Get database credentials and login
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    
    instoken = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/instoken', WithDecryption=True)
    apikey = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/key', WithDecryption=True)
    
    #Get the ID and number of documents for each researcher in our database
    query = "SELECT id, num_documents FROM public.elsevier_data"
    cursor.execute(query)
    author_scopus_ids = cursor.fetchall()
    
    #For each researcher query scopus to see if they have new publications.
    #If the researcher has new publications add their ID to the list.
    for i in range(0,len(author_scopus_ids),25):
        authorArray = []
        for j in range(i, i+25):
            if(j == len(author_scopus_ids)):
                break
            authorArray.append(author_scopus_ids[j][0])
        authorDataArray = getResearcherNumDocuments(authorArray, instoken, apikey)
        for k in range(len(authorDataArray)):
            num_documents = authorDataArray[k]['coredata']['document-count']
            h_index = 0
            if(authorDataArray[k]['h-index']):
                h_index = authorDataArray[k]['h-index']
            #Update everyones h-index everytime updatePublications is ran
            query = "UPDATE public.elsevier_data SET h_index="+str(h_index)+" WHERE id='"+author_scopus_ids[i+k][0]+"'"
            #Add researcher to list if they are missing publications
            if(int(num_documents) > author_scopus_ids[i+k][1]):
                researchersToUpdateArray.append(author_scopus_ids[i+k][0])
    connection.commit()
    
    #Return list of researchers that need to be updated.
    return researchersToUpdateArray
  
def fetchMissingPublications(author_id, apikey, instoken, cursor, connection):
    """
    author_id: The author ID to fetch missing publications for
    apikey: your scopus apikey
    instoken: your scopus institution token
    cursor: using psycopg2 we can create a cursor to access the postgresql database

    The function fetches the missing publications for the given author ID.
    The function then returns the list of missing functions.
    """

    global NumberOfPublicationsUpdate

    #Fetch author first and last name here

    #This function will be run for every researcher that needs to be updated.
    #But some reseracher might publish with other ubc reserachers.
    #To avoid duplication of publications we check the number of documents on each fetch.
    query = "SELECT num_documents FROM public.elsevier_data WHERE id='"+author_id+"'"
    cursor.execute(query)
    results = cursor.fetchone()
    StoredResults = results[0]
    
    url = 'https://api.elsevier.com/content/search/scopus'
    headers = {'Accept' : 'application/json', 'X-ELS-APIKey' : apikey['Parameter']['Value'], 'X-ELS-Insttoken' : instoken['Parameter']['Value']}
    query = {'query': 'AU-ID(' + author_id + ')', 'view' : 'COMPLETE', 'cursor': '*'}
    
    response = requests.get(url, headers=headers, params=query)
    rjson = response.json()

    keys = rjson.keys()

    if(list(keys).count('search-results') == 0):
        print("Scopus Search Limit Hit Update Publications will run again next week")
        return []
    
    totalResults = int(rjson['search-results']['opensearch:totalResults'])
    totalNumberOfPages = math.ceil(totalResults/25)
    
    
    #Check if the researchers new publication has already been inserted into the database.
    if(StoredResults > totalResults):
        print("ERROR! TOO MANY PUBS FOR RESEARCHER!")
        return []
    if(StoredResults == totalResults):
        print("Have all researchers publications")
        return []
    
    #For each of the researchers 25 new publications check if it is already in the database.
    #If the publication is not in the database add the publication to the missing publications list.
    missingPublications = []
    currentPage = 0
    while(currentPage<totalNumberOfPages):
        publications = rjson['search-results']['entry']
        for publication in publications:
            print(publication)
            keys = publication.keys()
            id = ''
            doi = ''
            title = ''
            keywords = []
            journal = ''
            cited_by = None
            year_published = ''
            link = ''
            if(list(keys).count('dc:identifier')):
                for c in publication['dc:identifier']:
                    if c.isdigit():
                        id = id + c
                        
            #Check if the publication is already in the database
            query = "SELECT COUNT(*) FROM publication_data WHERE id='"+id+"'"
            cursor.execute(query)
            results = cursor.fetchone()
            #If publication not in the database we need to put into the db
            if(results[0] == 0):
                author_ids = []
                author_names = []
                if(list(keys).count('dc:title')):
                    title = publication['dc:title']
                if(list(keys).count('prism:doi')):
                    doi = publication['prism:doi']
                if(list(keys).count('authkeywords')):
                    keywords_string = publication['authkeywords']
                    keywords = keywords_string.split('|')
                    keywords = [keyword.strip() for keyword in keywords]
                if (list(keys).count('prism:publicationName')):
                    journal = publication['prism:publicationName']
                if (list(keys).count('citedby-count')):
                    cited_by = int(publication['citedby-count'])
                if (list(keys).count('prism:coverDate')):
                    year_published = publication['prism:coverDate'][0:4]
                if (list(keys).count('link')):
                    link = publication['link'][2]['@href']
                if (list(keys).count('author')):
                    print("Got in here for publication with ID: "+str(id))
                    scopus_authors = publication['author']
                    #This flag is used to see if the specfic author is added to the publication
                    flag = 0
                    for author in scopus_authors:
                        print("printing author: "+str(author))
                        if(author['authid'] == author_id):
                            flag = 1
                        author_ids.append(author['authid'])
                        author_names.append(author['authname'])
                    if(int(publication['author-count']['@total']) > 100 and flag == 0):
                        #Add Author to ids and names because they were not added yet
                        author_ids.append(author_id)
                        #Find out how to add author name
                    #Add the publication to the list of missing publications
                    missingPublications.append({'doi': doi, 'id': id, 'title': title, 
                        'keywords': keywords, 'journal': journal, 'cited_by': cited_by, 
                        'year_published': year_published, 'author_ids': author_ids, 
                        'author_names': author_names, 'link': link})
                    StoredResults += 1
                connection.commit()
            else:
                keys = publication.keys()
                if(list(keys).count('author-count')):
                    if(int(publication['author-count']['@total']) > 100):
                        #If the publication is above 100 check if the current researcher is in it
                        query = "SELECT COUNT(*) FROM publication_data WHERE id='"+id+"' AND ('"+author_id+"' = ANY(author_ids))"
                        cursor.execute(query)
                        authorInPublicationResult = cursor.fetchone()
                        #If author is not in publication add them to it
                        if(authorInPublicationResult[0] == 0):
                            NumberOfPublicationsUpdate = NumberOfPublicationsUpdate + 1
                            query = "SELECT * FROM publication_data WHERE id='"+id+"'"
                            cursor.execute(query)
                            pubToAddAuthorToResult = cursor.fetchone()
                            #Add researcher to author id array
                            authorIdArray = pubToAddAuthorToResult[5]
                            authorIdArray.append(author_id)
                            authorIdArray = str(authorIdArray).replace('\'', '"').replace('[', '{').replace(']', '}')
                            print("Author ID Array is: "+ str(authorIdArray))
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

                            #If the publication is in the database but the researcher is not attached we should add them
                            #Increase their document count and add to their keywords
                            #Don't add it to missing documents

        #Check if we got all the new publications
        if(StoredResults == totalResults):
            print("Got all the results")
            break
        #Increment current page counter and get the next page of publications if we do not have them all yet
        currentPage += 1
        if(currentPage>=totalNumberOfPages):
            break
        next_url = rjson['search-results']['link'][2]['@href']
        response = requests.get(next_url, headers=headers)
        rjson = response.json()
        print("Next Page: "+ str(rjson))
    print("Missing Publications: " +str(missingPublications))
    return missingPublications

def getResearcherCurrentNumDocuments(author_id, cursor):
    """
    author_id: The author id to get number of publications for
    cursor: This is used to query the db.
    
    This function gets an ID's total number of publications from the postgresql database.
    """
    
    query = "SELECT num_documents FROM public.elsevier_data WHERE id='"+author_id+"'"
    cursor.execute(query)
    results = cursor.fetchone()
    StoredResults = results[0]
    return StoredResults

def updateResearcherInformation(author_id, num_documents, cursor):
    """
    author_id: An author ID
    num_documents: The number of documents that the author has
    cursor: Used to query the postgresql database

    This function sets an authors number of documents in the database.
    """
    
    query = "UPDATE public.elsevier_data SET num_documents = "+num_documents+" WHERE id='"+author_id+"'"
    cursor.execute(query)

def store_publications(publications, cursor):
    """
    publications: List of publications to add to the database.
    cursor: used to access the database.
    This function stores a list of new publications in the database.
    """
    
    for publication in publications:
        # Format each field
        publication['id'] = publication['id']
        publication['title'] = publication['title'].replace('\'', "''")
        publication['author_ids'] = str(publication['author_ids']).replace('\'', '"').replace('[', '{').replace(']', '}')
        publication['author_names'] = str(publication['author_names'])[2:-2].replace(" '", " ").replace("',", ",").replace("'", "''")
        publication['keywords'] = str(publication['keywords'])[2:-2].replace(" '", " ").replace("',", ",").replace("'", "''")
        publication['journal'] = publication['journal'].replace("'", "''")
        publication['cited_by'] = str(publication['cited_by'])
        publication['year_published'] = publication['year_published']
        queryline1 = "INSERT INTO public.publication_data(id, doi, title, author_ids, author_names, keywords, journal, cited_by, year_published, link) "
        queryline2 = "VALUES ('" + publication['id'] + "', '" + publication['doi'] + "', '" + publication['title'] + "', '" + publication['author_ids'] + "', '" + publication['author_names'] + "', '" + publication['keywords'] + "', '" + publication['journal'] + "', '" + publication['cited_by'] + "', '" + publication['year_published'] + "', '" + publication['link'] + "')"
        queryline3 = "ON CONFLICT (id) DO UPDATE "
        queryline4 = "SET doi='" + publication['doi'] + "', title='" + publication['title'] + "', author_ids='" + publication['author_ids'] + "', author_names='" + publication['author_names'] + "', journal='" + publication['journal'] + "', year_published='" + publication['year_published'] + "', cited_by='" + publication['cited_by'] + "', keywords='" + publication['keywords'] + "', link='" + publication['link'] + "'"
        cursor.execute(queryline1 + queryline2 + queryline3 + queryline4)

def store_keywords(author_id, publications, cursor):
    """
    author_id: Researchers ID to add keywords to
    publications: List of publications that have keywords to be added to the researcher
    cursor: Used to connect to the database

    The function adds the publications keywords to the reserachers keywords list
    """
    
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
    
    query = "UPDATE public.researcher_data SET keywords='" + keywords_string + "' WHERE scopus_id='" + author_id + "'"
    cursor.execute(query)

def updateResearchers(researchersToUpdateArray, instoken, apikey, connection, cursor):
    """
    researchersToUpdateArray: A list of researcher IDs to update.

    This function iterates through a list of researcher IDs.
    The function then updates the researchers num_documents and keywords field.
    The function then puts the publications into the database.
    """

    global NumberOfPublicationsUpdate

    #Loop through all researchers to update.
    while (len(researchersToUpdateArray) > 0):
        #Get the front of lists missing publications
        missingPublications = fetchMissingPublications(researchersToUpdateArray.pop(0), apikey, instoken, cursor, connection)
        
        #For each author that contributed to these publications at UBC you need to update their num_documents!
        for publication in missingPublications:
            NumberOfPublicationsUpdate = NumberOfPublicationsUpdate + 1
            for author_id in publication['author_ids']:
                #Check if the author is in the UBC database
                query = "SELECT COUNT(*) FROM elsevier_data WHERE id='"+author_id+"'"
                cursor.execute(query)
                results = cursor.fetchone()
                #If the author is part of the UBC database increase their num_documents by one
                #And add the publications keywords to the researcheres keywords
                if(results[0] == 1):
                    updateResearcherInformation(author_id, str(getResearcherCurrentNumDocuments(author_id, cursor)+1), cursor)
                    store_keywords(author_id, missingPublications, cursor)
    
        #Add the Publications
        store_publications(missingPublications, cursor)
        #Commit changes to database after every researcher
        connection.commit()

#Update all researchers number of publications
#We might never need this because it should be correct at all times 
#and removing a researcher does not decrease your publications
def updateAllResearchersNumDocuments(cursor, connection):
    #UPDATE H_INDEX AS WELL!
    time_string = str(time.time())
    query = "SELECT * FROM researcher_data"
    cursor.execute(query)
    results = cursor.fetchall()
    #For each researcher get their number of documents in the database and update it to be correct
    for i in range(0, len(results)):
        query = "SELECT COUNT(*) FROM publication_data WHERE '"+str(results[i][12])+"' = ANY(author_ids)"
        cursor.execute(query)
        countResult = cursor.fetchone()
        query = "UPDATE elsevier_data SET num_documents = "+str(countResult[0])+" WHERE id = '"+str(results[i][12])+"'"
        cursor.execute(query)
        #Update last updated column in researcher_data
        query = "UPDATE researcher_data SET last_updated = '"+time_string+"' WHERE scopus_id = '"+str(results[i][12])+"' "
        cursor.execute(query)
    connection.commit()

    #Change the last updated value

def removePublicationsWithNoUbcResearcher(cursor, connection):
    global NumberOfPublicationsUpdate
    query = "SELECT * FROM publication_data WHERE NOT EXISTS (SELECT * FROM researcher_data WHERE researcher_data.scopus_id = ANY(publication_data.author_ids))"
    cursor.execute(query)
    results = cursor.fetchall()
    #Delete all publications that do not have current UBC researcher
    for i in range(0, len(results)):
        query = "DELETE FROM publication_data WHERE id='"+str(results[i][0])+"'"
        cursor.execute(query)
        NumberOfPublicationsUpdate = NumberOfPublicationsUpdate + 1
    connection.commit()

instoken = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/instoken', WithDecryption=True)
apikey = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/key', WithDecryption=True)
        
credentials = getCredentials()
connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
cursor = connection.cursor()

NumberOfPublicationsUpdate = 0

time_string = str(time.time())

#Remove all publications with no ubc researcher
removePublicationsWithNoUbcResearcher(cursor, connection)
print("Finished Removing Publications")

#Set researchers number of documents to be what we have in the database
updateAllResearchersNumDocuments(cursor, connection)
print("Finished Updating Num Documents")

#Create a list of researchers that need to be updated
researcherArray = createListOfResearchersToUpdate()
print("Finished Creating List Of Researchers To Update. List of researchers is:" + str(researcherArray))
#Using the List of Researchers Put their new publications into the database
updateResearchers(researcherArray, instoken, apikey, connection, cursor)
print("Finished Updating Researchers")
#Add to the updating table
query = "INSERT INTO update_publications_logs(date_updated, number_of_publications_updated) VALUES ('"+str(time.time())+"', '"+str(NumberOfPublicationsUpdate)+"')"
cursor.execute(query)

print("Number of Publications Added: "+str(NumberOfPublicationsUpdate))
connection.commit()
cursor.close()

print("Finished Updating Publication")

response = dms_client.start_replication_task(
    ReplicationTaskArn= os.environ['Replication_Task_Arn'],
    StartReplicationTaskType='reload-target')
