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
    
    researcher_id = get_nested_value(event, ["arguments", "researcher_id"])
    if researcher_id is None:
        researcher_id = get_nested_value(event, ["researcher_id"])
    
    cursor.execute("select rd.first_name, rd.last_name, rd.prime_faculty, pe.target_id, pe.shared_keywords from potential_edges pe join researcher_data rd on pe.target_id = rd.scopus_id where pe.source_id = '" +
        researcher_id + "' and array_length(pe.shared_keywords, 1) > 5"
    )
    
    result = cursor.fetchall();
    
    data_list = []
    
    for data in result:
        data_object = {
            "firstName" : data[0],
            "lastName" : data[1],
            "faculty" : data[2],
            "id" : data[3],
            "sharedKeywords" : data[4]
        }
        
        data_list.append(data_object)
    
    sorted_list = sorted(data_list, key=lambda x: len(x['sharedKeywords']), reverse=True)
    
    cursor.close() #This ends the connection
    connection.commit() #This one makes any changes you made with queries commited
    
    return sorted_list
    

class Researcher:
    def __init__(self, data):
        self.first_name = data[0]
        self.last_name = data[1]
        self.id = data[2]
        self.shared_keywords = data[3]
        
    