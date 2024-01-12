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

def lambda_handler(event, context):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    
    id = get_nested_value(event, ["arguments", "id"])
    if id is None:
        id = get_nested_value(event, ["id"])
    
    query = "SELECT * FROM researcher_data WHERE scopus_id = '" + id + "'" #SQL Query
    cursor.execute(query) #This runs the query
    result = cursor.fetchone() #This command gets all the data you can fetch one as well
    
    returnedResult = {
        "id": result[13],
        "firstName": result[2],
        "lastName": result[3],
        "email": result[5],
        "rank": result[6],
        "department": result[8],
        "faculty": result[10],
        "keywords": result[16],
    }

    cursor.close() #This ends the connection
    connection.commit() #This one makes any changes you made with queries commited

    return returnedResult