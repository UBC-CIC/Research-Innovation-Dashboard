import csv
import codecs
import boto3
import os

s3_client = boto3.client("s3")

'''
Fetches a .csv file of HR data from S3, removes all researchers with irrelevant ranks, then cleans 
the name data by setting all characters to lower case, removing all special characters. Returns a list
of start and end indices that is fed to the next step of the step function
Requires no input
'''
def lambda_handler(event, context):
    # Researchers with these ranks are kept
    ranks = ['Acting Assistant Professor (tenure-track)', 'Adjunct Professor', 'Affiliate Assistant Professor', 
         'Affiliate Associate Professor', 'Affiliate Instructor', 'Affiliate Professor', 'Affiliate Professor of Teaching', 
         'Affiliate Senior Instructor', 'Assistant Professor', 'Assistant Professor (grant tenure-track)', 
         'Assistant Professor (grant tenure)', 'Assistant Professor (part-time)', 'Assistant Professor (Partner)', 
         'Assistant Professor (tenure-track)', 'Assistant Professor (tenure)', 
         'Assistant Professor of Teaching', 'Assistant Professor of Teaching (grant tenure-track)', 
         'Assistant Professor of Teaching (part-time)', 'Assistant Professor of Teaching (tenure-track)', 
         'Associate Professor', 'Associate Professor (grant tenure)', 
         'Associate Professor (part-time)', 'Associate Professor (Partner)', 'Associate Professor (tenure-track)', 
         'Associate Professor (tenure)', 'Associate Professor of Teaching', 
         'Clinical Assistant Professor', 'Clinical Associate Professor', 'Clinical Professor', 'Lecturer', 
         'Postdoctoral Research Fellow', 'Postdoctoral Teaching Fellow', 'Professor', 'Professor (grant-tenure)', 
         'Professor (part-time)', 'Professor (Partner)', 'Professor (tenure-track)', 
         'Professor (tenure)', 'Professor Emeritus', 'Professor of Teaching', 'Professor without review', 
         'Professor, University Killam', 'Research Associate']
    for i in range (len(ranks)):
        ranks[i] = ranks[i].replace(' ', '')
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    key = 'researcher_data/institution_data.csv' 
    data = s3_client.get_object(Bucket=bucket_name, Key=key)
    table_rows = list(csv.DictReader(codecs.getreader("utf-8-sig")(data["Body"])))
    clean_rows_count = 0

    with open('/tmp/institution_clean.csv', mode='w', newline='', encoding='utf-8-sig') as institution_clean:
        writer = csv.writer(institution_clean, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        file_headers = list(table_rows[0].keys())[1:]
        file_headers.append('CLEANED_FIRST_NAME')
        file_headers.append('CLEANED_LAST_NAME')
        writer.writerow(file_headers)
        for row in table_rows:
            rank = row['PRIMARY_ACADEMIC_RANK'].replace(' ', '')
            if rank in ranks:
                del row['SNAPSHOT_DATE']
                first_name = row['PREFERRED_FIRST_NAME'].replace('-', ' ').split()[0]
                last_name = row['PREFERRED_LAST_NAME'].replace('-', ' ').split()[0]
                first_name_clean = "".join(c for c in first_name if c.isalpha())
                first_name_clean = first_name_clean.lower()
                last_name_clean = "".join(c for c in last_name if c.isalpha())
                last_name_clean = last_name_clean.lower()
                keys = list(row.keys())
                values = []
                for key in keys:
                    values.append(row[key])
                values.append(first_name_clean)
                values.append(last_name_clean)
                writer.writerow(values)
                clean_rows_count += 1
    
    #upload the data into s3
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket_name)
    key = 'researcher_data/institution_clean.csv'
    bucket.upload_file('/tmp/institution_clean.csv', key)
    
    #Prepare the input of the next state in the step function
    nextStateInput = []
    for i in range(int(clean_rows_count/100)):
        nextStateInput.append({'startIndex': i * 100, 'endIndex': i * 100 + 99})
        
    nextStateInput.append({'startIndex': clean_rows_count - clean_rows_count % 100, 'endIndex': clean_rows_count})
    
    return nextStateInput
