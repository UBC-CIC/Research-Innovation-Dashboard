import json
import boto3
import psycopg2
import csv
import codecs
import time
import os
from botocore.errorfactory import ClientError

ssm_client = boto3.client('ssm')
sm_client = boto3.client('secretsmanager')
s3_client = boto3.client("s3")

'''
Fetches the rds database credentials from secrets manager
'''
def getCredentials():
    credentials = {}

    response = sm_client.get_secret_value(SecretId='expertiseDashboard/credentials/dbCredentials')
    secrets = json.loads(response['SecretString'])
    credentials['username'] = secrets['username']
    credentials['password'] = secrets['password']
    credentials['host'] = secrets['host']
    credentials['db'] = secrets['dbname']
    return credentials

'''
Given an S3 bucket and an S3 object key for a .csv file, returns the rows of the .csv file as a list
'''
def getFile(bucket_name, key):
    data = s3_client.get_object(Bucket=bucket_name, Key=key)
    rows = list(csv.DictReader(codecs.getreader("utf-8-sig")(data["Body"])))
    return rows

'''
Given a dict of researcher info and a scopus_id, stores the researchers data in the researcher_data table
'''
def storeResearcher(researcher, scopus_id, credentials):
    credentials = getCredentials()
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    
    time_string = str(time.time())
    institution_user_id = researcher['INSTITUTION_USER_ID']
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
    extra_ids = '{}'
    if "EXTRA_IDS" in researcher:
        extra_ids = str(researcher['EXTRA_IDS']).replace("'", '"').replace('[', '{').replace(']', '}')
    queryline1 = "INSERT INTO public.researcher_data(institution_user_id, first_name, preferred_name, last_name, email, rank, job_stream, prime_department, second_department, prime_faculty, second_faculty, campus, scopus_id, extra_ids, last_updated) "
    queryline2 = "VALUES ('" + institution_user_id + "', '" + first_name + "', '" + preferred_name + "', '" + last_name + "', '" + email + "', '" + rank + "', '" + job_stream + "', '" + prime_department + "', '" + second_department + "', '" + prime_faculty + "', '" + second_faculty + "', '" + campus + "', '" + scopus_id + "', '" + extra_ids + "', '" + time_string + "')"
    queryline3 = "ON CONFLICT (institution_user_id) DO UPDATE "
    queryline4 = "SET first_name='" + first_name + "', preferred_name='" + preferred_name + "', last_name='" + last_name + "', email='" + email + "', rank='" + rank + "', job_stream='" + job_stream + "', prime_department='" + prime_department + "', second_department='" + second_department + "', prime_faculty='" + prime_faculty + "', second_faculty='" + second_faculty + "', campus='" + campus + "', scopus_id='" + scopus_id + "', last_updated='" + time_string + "'"
    cursor.execute(queryline1 + queryline2 + queryline3 + queryline4)
    cursor.close()
    connection.commit()

'''
Stores the current time in the 'data_update_logs' table
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
Fetches the matches that were found in compareNames, identifyDuplicates, and cleanNoMatches and stores them in the database.
Also stores any matches stored in the manual_matches.csv file if it is present
Requires no input
'''
def lambda_handler(event, context):
    credentials = getCredentials()
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    
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

    # Fetch data from the solved_duplicates folder
    folder = 'researcher_data/duplicates/solved_duplicates'
    paginator = s3_client.get_paginator('list_objects')
    pages = paginator.paginate(Bucket=bucket_name, Prefix=folder)
    
    for page in pages:
        for obj in page['Contents']:
            rows = getFile(bucket_name, obj['Key'])
            for researcher in rows:
                researcher['EXTRA_IDS'] = []
                storeResearcher(researcher, researcher['SCOPUS_ID'], credentials)
                
    # Fetch data from the unsolved_duplicates folder
    folder = 'researcher_data/duplicates/unsolved_duplicates'
    paginator = s3_client.get_paginator('list_objects')
    pages = paginator.paginate(Bucket=bucket_name, Prefix=folder)
    
    for page in pages:
        for obj in page['Contents']:
            rows = getFile(bucket_name, obj['Key'])
            for researcher in rows:
                storeResearcher(researcher, researcher['SCOPUS_ID'], credentials)
           
    # Fetch the manually created matches
    try:
        key = 'researcher_data/manual_matches.csv'
        data = s3_client.get_object(Bucket=bucket_name, Key=key)
        rows = list(csv.DictReader(codecs.getreader("utf-8-sig")(data["Body"])))
        for researcher in rows:
            storeResearcher(researcher, researcher['SCOPUS_ID'], credentials)
    except ClientError:
        # Manual matches could not be found
        pass

    storeLastUpdated('researcher_data', credentials)

    return {}
