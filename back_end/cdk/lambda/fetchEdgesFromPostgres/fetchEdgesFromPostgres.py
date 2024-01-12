import json
import boto3
import psycopg2

sm_client = boto3.client('secretsmanager')

#This function gets the credentials for the databae
def getCredentials():
    credentials = {}
    response = sm_client.get_secret_value(SecretId='expertiseDashboard/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials
    
#Helper function to get a nested value from a dictionary.
def get_nested_value(data, keys):
    for key in keys:
        if key in data:
            data = data[key]
        else:
            return None
    return data
    
def createKeywordsString(keywordList):
    queryString = ""
    keywordsToAdd = []
    for index, keyword in enumerate(keywordList):
        if index != len(keywordList) - 1:
            queryString = queryString + " keywords LIKE %s AND "
        else:
            queryString = queryString + " keywords LIKE %s "
        keywordsToAdd.append("%"+keyword+"%")
    
    return queryString, keywordsToAdd

def lambda_handler(event, context):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    
    result = []
    
    facultiesToFilterOn = get_nested_value(event, ["arguments", "facultiesToFilterOn"])
    if facultiesToFilterOn is None:
        facultiesToFilterOn = get_nested_value(event, ["facultiesToFilterOn"])
        
    keyword = get_nested_value(event, ["arguments", "keyword"])
    if keyword is None:
        keyword = get_nested_value(event, ["keyword"])
    
    if len(facultiesToFilterOn) > 0 and len(keyword) > 0:
        queryData = []
        
        keywordQueryString, keywordsToAdd = createKeywordsString(keyword.split(", "))
        
        queryData.append(facultiesToFilterOn)
        
        for keyword in keywordsToAdd:
            queryData.append(keyword)
        
        queryData.append(facultiesToFilterOn)
        
        for keyword in keywordsToAdd:
            queryData.append(keyword)
        
        query = "SELECT * FROM public.edges_full WHERE source_id=ANY(SELECT scopus_id FROM researcher_data WHERE prime_faculty=ANY(%s) AND ("
        
        #Add keywords
        query = query + keywordQueryString
        
        query = query + "))"
        
        query = query + "AND target_id=ANY(SELECT scopus_id FROM researcher_data WHERE prime_faculty=ANY(%s) AND ("
        
        #Add keywords
        query = query + keywordQueryString
        
        query = query + "))"

        cursor.execute(query, (queryData))
    elif len(facultiesToFilterOn) > 0: 
        cursor.execute("SELECT * FROM public.edges_full WHERE source_id=ANY(SELECT scopus_id FROM researcher_data WHERE prime_faculty=ANY(%s)) AND target_id=ANY(SELECT scopus_id FROM researcher_data WHERE prime_faculty=ANY(%s))", (facultiesToFilterOn, facultiesToFilterOn,))
    elif len(keyword) > 0:
        queryData = []
        query = ""
        
        keywordQueryString, keywordsToAdd = createKeywordsString(keyword.split(", "))
        
        #add keywords twice
        for keyword in keywordsToAdd:
            queryData.append(keyword)
        for keyword in keywordsToAdd:
            queryData.append(keyword)
        
        query = query + "SELECT * FROM public.edges_full WHERE source_id=ANY(SELECT scopus_id FROM researcher_data WHERE ("
        
        #add keywords
        query = query + keywordQueryString
        
        query = query + ")) "
        
        query = query + "AND target_id=ANY(SELECT scopus_id FROM researcher_data WHERE ("
        
        #add keywords
        query = query + keywordQueryString
        
        query = query + ")) AND source_id<>target_id"
        
        cursor.execute(query, (queryData))
    else:
        cursor.execute("SELECT * FROM public.edges_full")
    
    result = cursor.fetchall() #This command gets all the data you can fetch one as well
    
    edgesList = []
    
    for edge in result:
        # weight = min(3,edge[3])
        weight = 3 - 10/(edge[3]+4)
        edgeObject = {
            "key": edge[0]+"&&"+edge[1],
            "source": edge[0],
            "target": edge[1],
            "undirected": True,
            "attributes": {
                "size": weight, #"1", #"edge[3]",
                "color": "#EDEBE9", # super grey
                # "color": "#A5A5A5", # mid grey
                # "color": "#5C5C5C", # darker grey
                #"sharedPublications": edge[2],
            },
        }
        edgesList.append(edgeObject)
    
    cursor.close() #This ends the connection
    connection.commit() #This one makes any changes you made with queries commited
    
    return edgesList