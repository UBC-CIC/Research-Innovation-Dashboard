import sys
from pyjarowinkler.distance import get_jaro_distance
import psycopg2
import json
import boto3

ssm_client = boto3.client('ssm')
sm_client = boto3.client('secretsmanager')

def createHashMap(text):
   # split text into tokens by white space
    token = text.split(", ")
   
    hashMap = {}

    for word in token:
        value = hashMap.get(word)

        if value:
            hashMap[word] = value+1
        else:
            hashMap[word] = 1
    
    hashMap = dict(sorted(hashMap.items(), key=lambda item: item[1], reverse=True))
    return hashMap
    
def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId='expertiseDashboard/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials


def mergeKeywords():
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    
    cursor.execute("SELECT researcher_id, keywords FROM researcher_data")
    result = cursor.fetchall()
    
    for researcher in result:
        researcher_id = researcher[0]
        keywords = researcher[1]
        hashMap = createHashMap(keywords)
        keyArray = []

        for keyword in list(hashMap.keys()):
            keyArray.append(keyword)
        
        for i in range((len(keyArray))-1):
            j = i+1
            while j < len(keyArray):
                if keyArray[i] is not None and keyArray[j] is not None:
                    if keyArray[i] != "" and keyArray[j] != "":
                        if(get_jaro_distance(keyArray[i], keyArray[j]) >= 0.95):
                            if hashMap.get(keyArray[i]) and hashMap.get(keyArray[j]):
                                hashMap[keyArray[i]] = hashMap.get(keyArray[i]) + hashMap.pop(keyArray[j])
                j = j + 1
        
        keyWordHashMap = dict(sorted(hashMap.items(), key=lambda item: item[1], reverse=True))
        
        mergedKeywordsList = ""
        
        for keyword in keyWordHashMap:
            value = keyWordHashMap.get(keyword)

            for k in range(value):
                mergedKeywordsList = mergedKeywordsList + keyword + ", "
        
        mergedKeywordsList = mergedKeywordsList[:-2]
        
        query = "UPDATE public.researcher_data SET merged_keywords=%s WHERE researcher_id=%s"
        data = (str(mergedKeywordsList), str(researcher_id))
        cursor.execute(query, data)
    
    cursor.close()
    connection.commit()

mergeKeywords()
