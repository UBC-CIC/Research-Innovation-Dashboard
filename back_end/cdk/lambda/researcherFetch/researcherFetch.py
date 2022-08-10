import json
import boto3
import psycopg2
import csv
import codecs
from datetime import datetime
import pytz

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

def standardizeDepartment(department):
    return department.replace('&', 'and').replace('Department of ', '').replace(' ', '').replace('-', '')

def standardizeFaculty(faculty):
    return faculty.replace('&', 'and').replace('Faculty of ', '').replace('School of', '').replace(' ', '').replace('-', '').replace('SocialSciences', 'Sciences')

def getResearcher(scopus_row):
    bucket_name = 'vpriprofiledata'
    key = 'researcher_data/ubc_data.csv'
    data = s3_client.get_object(Bucket=bucket_name, Key=key)
    rows = []
    ret_row = None

    for row in csv.DictReader(codecs.getreader("utf-8")(data["Body"])):
        preferred_first_name = scopus_row['First Name'] + ' ' + scopus_row['Other Name']
        if (row['PREFERRED_LAST_NAME'] == scopus_row['Last Name'] and (row['PREFERRED_FIRST_NAME'] == preferred_first_name.strip() or
            row['PREFERRED_FIRST_NAME'] == scopus_row['First Name'])):
            rows.append(row)
    
    if (len(rows) > 1):
        for row in rows:
            if ((standardizeDepartment(row['PRIMARY_DEPARTMENT_AFFILIATION']) in standardizeDepartment(scopus_row['Department'])) or 
                (standardizeDepartment(scopus_row['Department']) in standardizeDepartment(row['PRIMARY_DEPARTMENT_AFFILIATION'])) or
                (standardizeFaculty(row['PRIMARY_FACULTY_AFFILIATION']) in standardizeFaculty(scopus_row['Faculty'])) or 
                (standardizeFaculty(scopus_row['Faculty']) in standardizeFaculty(row['PRIMARY_FACULTY_AFFILIATION']))):
                ret_row = row
            else:
                print(scopus_row['First Name'] + ' ' + scopus_row['Last Name'] + ' ' + standardizeDepartment(row['PRIMARY_DEPARTMENT_AFFILIATION']) + ' ' + standardizeDepartment(scopus_row['Department']) + ' ' + standardizeFaculty(row['PRIMARY_FACULTY_AFFILIATION']) + ' ' + standardizeFaculty(scopus_row['Faculty']))
    elif (len(rows) == 1):
        ret_row = rows[0]
    else:
        print("ERROR NO ROWS for " + scopus_row['First Name'] + ' ' + scopus_row['Last Name'])
    
    return ret_row
    
def storeResearcher(researcher, scopus_id, credentials):
    now = datetime.now(pytz.timezone("Canada/Pacific"))
    dt_string = now.strftime("%d/%m/%Y %H:%M:%S") + " PST"
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    
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
    queryline1 = "INSERT INTO public.researcher_data(employee_id, first_name, preferred_name, last_name, email, rank, job_stream, prime_department, second_department, prime_faculty, second_faculty, campus, scopus_id, keywords, last_updated) "
    queryline2 = "VALUES ('" + employee_id + "', '" + first_name + "', '" + preferred_name + "', '" + last_name + "', '" + email + "', '" + rank + "', '" + job_stream + "', '" + prime_department + "', '" + second_department + "', '" + prime_faculty + "', '" + second_faculty + "', '" + campus + "', '" + scopus_id + "', '', '" + dt_string + "')"
    queryline3 = "ON CONFLICT (employee_id) DO UPDATE "
    queryline4 = "SET first_name='" + first_name + "', preferred_name='" + preferred_name + "', last_name='" + last_name + "', email='" + email + "', rank='" + rank + "', job_stream='" + job_stream + "', prime_department='" + prime_department + "', second_department='" + second_department + "', prime_faculty='" + prime_faculty + "', second_faculty='" + second_faculty + "', campus='" + campus + "', scopus_id='" + scopus_id + "', last_updated='" + dt_string + "'"
    cursor.execute(queryline1 + queryline2 + queryline3 + queryline4)
    cursor.close()
    connection.commit()

'''
Stores the current time in the update_data table
'''
def storeLastUpdated(updatedTable, credentials):
    now = datetime.now(pytz.timezone("Canada/Pacific"))
    dt_string = now.strftime("%d/%m/%Y %H:%M:%S") + " PST"
    connection = psycopg2.connect(user=credentials['username'], password=credentials['password'], host=credentials['host'], database=credentials['db'])
    cursor = connection.cursor()
    queryline1 = "INSERT INTO public.update_data(table_name, last_updated) "
    queryline2 = "VALUES ('" + updatedTable + "', " + dt_string + "')"
    queryline3 = "ON CONFLICT (table_name) DO UPDATE "
    queryline4 = "SET last_updated='" + dt_string + "'"
    cursor.execute(queryline1 + queryline2 + queryline3 + queryline4)
    cursor.close()
    connection.commit()
    return

def lambda_handler(event, context):
    credentials = getCredentials()
    bucket_name = 'vpriprofiledata'
    key = 'researcher_data/ScopusIDs_2018.csv'
    data = s3_client.get_object(Bucket=bucket_name, Key=key)
    rows = list(csv.DictReader(codecs.getreader("utf-8")(data["Body"])))
    
    for i in range(event['start_index'], event['end_index']):
        if (rows[i]['Scopus ID'] != '#N/A'):
            researcher = getResearcher(rows[i])
            if (researcher != None):
                storeResearcher(researcher, rows[i]['Scopus ID'], credentials)
    
    storeLastUpdated('researcher_data', credentials)
