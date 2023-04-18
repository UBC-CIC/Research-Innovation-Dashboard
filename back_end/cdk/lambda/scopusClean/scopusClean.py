import csv
import codecs
import boto3
import os

s3_client = boto3.client("s3")

'''
The function cleanName takes in one variable name.
name is a string that contains the full name of a researcher.
The function cleans the name by removing the middle name and returns two strings the first and last name of the researcher.
The name comes in the format of Last Name, First name Middle name.

The last name can have multiple spaces
'''
def cleanName(name):
    #Split the name on comma.
    nameParts = name.split(", ")

    #If the name is not in the correct format return None
    if len(nameParts) < 2:
        return None, None

    #If the name is in the correct format return the first and last name
    last = nameParts[0]
    first = nameParts[1]

    return first, last

'''
Fetches a .csv file of Scopus data from S3 then cleans the name data by setting 
all characters to lower case, removing all special characters. 
Requires no input
'''
def lambda_handler(event, context):
    
    #Get the bucket name from the environment variables
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    
    key = 'researcher_data/scopus_ids.csv'
    
    #Get the data from s3
    data = s3_client.get_object(Bucket=bucket_name, Key=key)

    #Read the data from s3
    csv_file = codecs.getreader("utf-8-sig")(data["Body"])

    #Skip the first 9 rows of the csv file
    for i in range (9):
        next(csv_file)

    #Read the csv file into a list of dictionaries
    csv_reader = csv.DictReader(csv_file)
    scopus_id_rows = list(csv_reader)

    #Remove the last two rows of the csv file
    del scopus_id_rows[-1]
    del scopus_id_rows[-1]

    #Clean the name data and write it to a new csv file
    with open('/tmp/scopus_clean.csv', mode='w', newline='', encoding='utf-8-sig') as scopus_clean:
        writer = csv.writer(scopus_clean, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        #Write the headers to the csv file
        file_headers = ['NAME', 'SCOPUS_ID', 'CLEANED_FIRST_NAME', 'CLEANED_LAST_NAME']
        writer.writerow(file_headers)
        
        #Clean the name data and write it to the csv file
        for row in scopus_id_rows:
            firstNameClean, lastNameClean = cleanName(row['Name'])
            
            writer.writerow([row['Name'], row['Scopus author ID'], firstNameClean, lastNameClean])

    #upload the data into s3
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket_name)
    key = 'researcher_data/scopus_clean.csv'
    bucket.upload_file('/tmp/scopus_clean.csv', key)

    return event