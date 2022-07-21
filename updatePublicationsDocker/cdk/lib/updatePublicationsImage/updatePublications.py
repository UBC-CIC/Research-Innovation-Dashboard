import requests
import json
import boto3
import psycopg2

print("Starting Update Publications")

ssm_client = boto3.client('ssm', region_name='ca-central-1')

#Will Need To Think About Where To Get Credentials From With CDK!!!!
def getCredentials():
    """Using AWS secrets manager the function returns the databases credentials"""
    credential = {}
    ssm_username = ssm_client.get_parameter(Name='/service/publicationDB/username', WithDecryption=True)
    ssm_password = ssm_client.get_parameter(Name='/service/publicationDB/password', WithDecryption=True)
    credential['username'] = ssm_username['Parameter']['Value']
    credential['password'] = ssm_password['Parameter']['Value']
    credential['host'] = 'vpripublicationdb.ct5odvmonthn.ca-central-1.rds.amazonaws.com'
    credential['db'] = 'myDatabase'
    return credential

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
    params = {'field': 'document-count', 'author_id': authorArray}
    response = requests.get(url, headers=headers, params=params)
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
            if(int(num_documents) > author_scopus_ids[i+k][1]):
                researchersToUpdateArray.append(author_scopus_ids[i+k][0])
    
    cursor.close()
    connection.commit()
    
    #Return list of researchers that need to be updated.
    return researchersToUpdateArray
  
def fetchMissingPublications(author_id, apikey, instoken, cursor):
    """
    author_id: The author ID to fetch missing publications for
    apikey: your scopus apikey
    instoken: your scopus institution token
    cursor: using psycopg2 we can create a cursor to access the postgresql database

    The function fetches the missing publications for the given author ID.
    The function then returns the list of missing functions.
    """

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
    
    totalResults = int(rjson['search-results']['opensearch:totalResults'])
    
    
    #Check if the researchers new publication has already been inserted into the database.
    if(StoredResults > totalResults):
        print("Throw An Error")
        return []
    if(StoredResults == totalResults):
        print("No Publications To Get")
        return []
    
    publications = rjson['search-results']['entry']
    
    #For each of the researchers 25 new publications check if it is already in the database.
    #If the publication is not in the database add the publication to the missing publications list.
    missingPublications = []
    for publication in publications:
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
                scopus_authors = publication['author']
                for author in scopus_authors:
                    author_ids.append(author['authid'])
                    author_names.append(author['authname'])
            missingPublications.append({'doi': doi, 'id': id, 'title': title, 
                    'keywords': keywords, 'journal': journal, 'cited_by': cited_by, 
                    'year_published': year_published, 'author_ids': author_ids, 
                    'author_names': author_names, 'link': link})
            StoredResults += 1
        #Once we have all the new publications break out of the function
        if(StoredResults == totalResults):
            break
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

def updateResearchers(researchersToUpdateArray):
    """
    researchersToUpdateArray: A list of researcher IDs to update.

    This function iterates through a list of researcher IDs.
    The function then updates the researchers num_documents and keywords field.
    The function then puts the publications into the database.
    """
    
    instoken = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/instoken', WithDecryption=True)
    apikey = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/key', WithDecryption=True)
        
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()

    #Loop through all researchers to update.
    while (len(researchersToUpdateArray) > 0):
        #Get the front of lists missing publications
        missingPublications = fetchMissingPublications(researchersToUpdateArray.pop(0), apikey, instoken, cursor)
        
        #For each author that contributed to these publications at UBC you need to update their num_documents!
        for publication in missingPublications:
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
    
    cursor.close()
    connection.commit()

#Create a list of researchers that need to be updated
researcherArray = createListOfResearchersToUpdate()
print(researcherArray)
researchersToUpdateArray = researcherArray
#Using the List of Researchers Put their new publications into the database
updateResearchers(researchersToUpdateArray)

print("Finished Updating Publication")
