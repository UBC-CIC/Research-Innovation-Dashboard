import json
import boto3
import psycopg2
import csv
import codecs
import time

ssm_client = boto3.client('ssm')
sm_client = boto3.client('secretsmanager')
s3_client = boto3.client("s3")

def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId='vpri/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials

def getFile(bucket_name, key):
    data = s3_client.get_object(Bucket=bucket_name, Key=key)
    rows = list(csv.DictReader(codecs.getreader("utf-8-sig")(data["Body"])))
    return rows

def storeResearcher(researcher, scopus_id, credentials):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    
    time_string = str(time.time())
    employee_id = researcher['UBC_EMPLOYEE_ID']
    first_name = researcher['PREFERRED_FIRST_NAME'].replace("'", "''")
    preferred_name = researcher['PREFERRED_FULL_NAME'].replace("'", "''")
    last_name = researcher['PREFERRED_LAST_NAME'].replace("'", "''")
    email = researcher['EMAIL_ADDRESS'].replace("'", "''")
    rank = researcher['PRIMARY_ACADEMIC_RANK'].replace("'", "''")
    job_stream = researcher['PRIMARY_ACADEMIC_TRACK_TYPE'].replace("'", "''")
    prime_department = researcher['PRIMARY_DEPARTMENT_AFFILIATION'].replace("'", "''")
    second_department = researcher['SECONDARY_DEPARTMENT_AFFILIATION'].replace("'", "''")
    prime_faculty = researcher['PRIMARY_FACULTY_AFFILIATION'].replace("'", "''")
    second_faculty = researcher['SECONDARY_FACULTY_AFFILIATION'].replace("'", "''")
    campus = researcher['PRIMARY_CAMPUS_LOCATION'].replace("'", "''")
    queryline1 = "INSERT INTO public.researcher_data(employee_id, first_name, preferred_name, last_name, email, rank, job_stream, prime_department, second_department, prime_faculty, second_faculty, campus, scopus_id, last_updated) "
    queryline2 = "VALUES ('" + employee_id + "', '" + first_name + "', '" + preferred_name + "', '" + last_name + "', '" + email + "', '" + rank + "', '" + job_stream + "', '" + prime_department + "', '" + second_department + "', '" + prime_faculty + "', '" + second_faculty + "', '" + campus + "', '" + scopus_id + "', '" + time_string + "')"
    queryline3 = "ON CONFLICT (employee_id) DO UPDATE "
    queryline4 = "SET first_name='" + first_name + "', preferred_name='" + preferred_name + "', last_name='" + last_name + "', email='" + email + "', rank='" + rank + "', job_stream='" + job_stream + "', prime_department='" + prime_department + "', second_department='" + second_department + "', prime_faculty='" + prime_faculty + "', second_faculty='" + second_faculty + "', campus='" + campus + "', scopus_id='" + scopus_id + "', last_updated='" + time_string + "'"
    cursor.execute(queryline1 + queryline2 + queryline3 + queryline4)
    cursor.close()
    connection.commit()

'''
Stores the current time in the 'update_data' table
'''
def storeLastUpdated(updatedTable, credentials):
    time_string = str(time.time())
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    queryline1 = "INSERT INTO public.update_data(table_name, last_updated) "
    queryline2 = "VALUES ('" + updatedTable + "', '" + time_string + "')"
    queryline3 = "ON CONFLICT (table_name) DO UPDATE "
    queryline4 = "SET last_updated='" + time_string + "'"
    cursor.execute(queryline1 + queryline2 + queryline3 + queryline4)
    cursor.close()
    connection.commit()
    return

def lambda_handler(event, context):
    credentials = getCredentials()
    bucket_name = 'vpri-innovation-dashboard'
    
    # Fetch data from the matches folder
    folder = 'researcher_data/matches/'
    paginator = s3_client.get_paginator('list_objects')
    pages = paginator.paginate(Bucket=bucket_name, Prefix=folder)
    
    for page in pages:
        for obj in page['Contents']:
            rows = getFile(bucket_name, obj['Key'])
            for researcher in rows:
                storeResearcher(researcher, researcher['SCOPUS_ID'], credentials)
    
    # Fetch data from the found_matches folder
    folder = 'researcher_data/matches/'
    paginator = s3_client.get_paginator('list_objects')
    pages = paginator.paginate(Bucket=bucket_name, Prefix=folder)
    
    for page in pages:
        for obj in page['Contents']:
            rows = getFile(bucket_name, obj['Key'])
            for researcher in rows:
                storeResearcher(researcher, researcher['SCOPUS_ID'], credentials)

    storeLastUpdated('researcher_data', credentials)

    return {}
