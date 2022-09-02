import csv
import codecs
import boto3
import os

s3_client = boto3.client("s3")

'''
Fetches a .csv file of Scopus data from S3 then cleans the name data by setting 
all characters to lower case, removing all special characters. 
Requires no input
'''
def lambda_handler(event, context):
    
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    key = 'researcher_data/scopus_ids.csv'
    data = s3_client.get_object(Bucket=bucket_name, Key=key)
    csv_file = codecs.getreader("utf-8-sig")(data["Body"])
    for i in range (9):
        next(csv_file)
    csv_reader = csv.DictReader(csv_file)
    scopus_id_rows = list(csv_reader)
    del scopus_id_rows[-1]
    del scopus_id_rows[-1]

    with open('/tmp/scopus_clean.csv', mode='w', newline='', encoding='utf-8-sig') as scopus_clean:
        writer = csv.writer(scopus_clean, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        file_headers = ['NAME', 'SCOPUS_ID', 'CLEANED_FIRST_NAME', 'CLEANED_LAST_NAME']
        writer.writerow(file_headers)
        for row in scopus_id_rows:
            name_arr = row['Name'].split(',')
            last_name = name_arr[0].replace('-', ' ').split()[0]
            first_name_arr = name_arr[1].replace('-', ' ').split()
            if first_name_arr:
                first_name = first_name_arr[0]
            else:
                first_name = ''

            first_name_clean = "".join(c for c in first_name if c.isalpha())
            first_name_clean = first_name_clean.lower()
            last_name_clean = "".join(c for c in last_name if c.isalpha())
            last_name_clean = last_name_clean.lower()
            writer.writerow([row['Name'], row['Scopus author ID'], first_name_clean, last_name_clean])

    #upload the data into s3
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket_name)
    key = 'researcher_data/scopus_clean.csv'
    bucket.upload_file('/tmp/scopus_clean.csv', key)

    return event
