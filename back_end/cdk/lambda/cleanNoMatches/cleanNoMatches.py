import csv
import codecs
import requests
import boto3
from pyjarowinkler.distance import get_jaro_distance
import os

s3_client = boto3.client("s3")
ssm_client = boto3.client('ssm')
instoken = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/instoken', WithDecryption=True)
apikey = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/key', WithDecryption=True)
elsevier_headers = {'Accept' : 'application/json', 'X-ELS-APIKey' : apikey['Parameter']['Value'], 'X-ELS-Insttoken' : instoken['Parameter']['Value']}

'''
Given a list lst and a number n, splits lst into sections of size n and returns the sections in a list
'''
def split_array(lst, n):
    ret_arr = []
    for i in range(0, len(lst), n):
         ret_arr.append(lst[i:i + n])
    return ret_arr

'''
Fetches potential matches from the no_matches folder in S3 and compares their
department and faculty data to areas of interest on Scopus to determine if a match is certain.
Also compares the matches name to name variants found in Scopus. Matches that pass this comparison
are stored in the found_matches folders in .csv files and the matches that fail the comparison are
stored in the no_matches_cleaned folder in .csv files.
'''
def lambda_handler(event, context):
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    key = event['file_key']
    iteration_number = event['iteration_number']
    data = s3_client.get_object(Bucket=bucket_name, Key=key)
    rows = list(csv.DictReader(codecs.getreader("utf-8-sig")(data["Body"])))
    matches = []
    
    # Remove all potential matches with a jaro distance that is under MIN_JARO_DISTANCE
    for match in rows:
        if (float(match['JARO_DISTANCE']) > 0.9):
            matches.append(match)

    matches_split = split_array(matches, 25)
    found_matches = []
    no_matches = []
    for author_subset in matches_split:
        author_ids = []
        for author in author_subset:
            author_ids.append(author['CLOSEST_MATCH_ID'])
        url = 'https://api.elsevier.com/content/author'
        query = {'author_id' : author_ids}
        response = requests.get(url, headers=elsevier_headers, params=query)

        #Error handling for API limit hit
        if "error-response" in response.json():
            if "error-code" in response.json()["error-response"]:
                if response.json()["error-response"]["error-code"] == "TOO_MANY_REQUESTS":
                    dateTimeObject = datetime.fromtimestamp(int(response.headers['X-RateLimit-Reset']))
                    raise Exception("API limit has been exceded! Please try the data pipeline again on " + str(dateTimeObject) + "UTC Time")
        
        
        if (len(author_ids) == 1):
            results = response.json()['author-retrieval-response']
        else:
            results = response.json()['author-retrieval-response-list']['author-retrieval-response']
        for result in results:
            found_match = False
            data = result['coredata']
            subject_areas = result['subject-areas']['subject-area']
            for author in author_subset:
                if author['CLOSEST_MATCH_ID'] in data['dc:identifier']:
                    faculty = author['PRIMARY_FACULTY_AFFILIATION'].lower().replace('faculty of ', '').replace('ubco - ', '').replace('barber - ', '')
                    faculty = "".join(c for c in faculty if c.isalpha())
                    faculty = faculty.replace(' ', '')
                    department = author['PRIMARY_DEPARTMENT_AFFILIATION'].lower().replace(' ', '')
                    department = "".join(c for c in department if c.isalpha())
                    # Check subject areas against department and faculty data
                    for subject_area in subject_areas:
                        if (subject_area['@abbrev'] == 'MEDI'):
                            subject_area_clean = 'medicine'
                        else:
                            subject_area_name = subject_area['$']
                            subject_area_clean = subject_area_name.lower().replace(' ', '')
                            subject_area_clean = "".join(c for c in subject_area_clean if c.isalpha())
                        faculty_distance = get_jaro_distance(faculty, subject_area_clean, winkler=True, scaling=0.1)
                        department_distance = get_jaro_distance(department, subject_area_clean, winkler=True, scaling=0.1)
                        if (faculty_distance >= 0.95 or department_distance >= 0.95):
                            found_matches.append(author)
                            found_match = True
                            break
                    # Check name variants
                    author_profile = result['author-profile'] 
                    if 'name-variant' in author_profile.keys() and found_match == False:
                        if isinstance(author_profile['name-variant'], dict):
                            name = author_profile['name-variant']['given-name']
                            name = name.lower().replace(' ', '')
                            name = "".join(c for c in name if c.isalpha())
                            name_distance = get_jaro_distance(name, author['CLOSEST_MATCH_NAME_CLEANED'], winkler=True, scaling=0.1)
                            if (name_distance >= 0.95):
                                found_matches.append(author)
                                found_match = True
                        else:
                            for name_variant in author_profile['name-variant']:
                                name = name_variant['given-name']
                                name = name.lower().replace(' ', '')
                                name = "".join(c for c in name if c.isalpha())
                                name_distance = get_jaro_distance(name, author['CLOSEST_MATCH_NAME_CLEANED'], winkler=True, scaling=0.1)
                                if (name_distance >= 0.95):
                                    found_matches.append(author)
                                    found_match = True
                                    break
                    if (found_match):
                        break
                    else:
                        no_matches.append(author)
                        break
    
    # Store the newly found matches
    with open('/tmp/found_matches.csv', mode='w', newline='', encoding='utf-8-sig') as no_matches_file:
        writer = csv.writer(no_matches_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        file_headers = ['PREFERRED_FIRST_NAME', 'PREFERRED_LAST_NAME', 'PREFERRED_FULL_NAME', 'UBC_EMPLOYEE_ID', 
                    'EMAIL_ADDRESS', 'PRIMARY_DEPARTMENT_AFFILIATION', 'SECONDARY_DEPARTMENT_AFFILIATION', 
                    'PRIMARY_FACULTY_AFFILIATION', 'SECONDARY_FACULTY_AFFILIATION', 'PRIMARY_CAMPUS_LOCATION', 
                    'PRIMARY_ACADEMIC_RANK', 'PRIMARY_ACADEMIC_TRACK_TYPE', 'SCOPUS_ID', 'EXTRA_IDS', 'JARO_DISTANCE', 'CLOSEST_MATCH_NAME']
        writer.writerow(file_headers)
        for match in found_matches:
            writer.writerow([match['PREFERRED_FIRST_NAME'], match['PREFERRED_LAST_NAME'], match['PREFERRED_FULL_NAME'], 
                             match['UBC_EMPLOYEE_ID'], match['EMAIL_ADDRESS'], match['PRIMARY_DEPARTMENT_AFFILIATION'], 
                             match['SECONDARY_DEPARTMENT_AFFILIATION'], match['PRIMARY_FACULTY_AFFILIATION'], 
                             match['SECONDARY_FACULTY_AFFILIATION'], match['PRIMARY_CAMPUS_LOCATION'], 
                             match['PRIMARY_ACADEMIC_RANK'], match['PRIMARY_ACADEMIC_TRACK_TYPE'], match['CLOSEST_MATCH_ID'], [], 
                             match['JARO_DISTANCE'], match['CLOSEST_MATCH_NAME']])
    
    #upload the data into s3
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket_name)
    key = 'researcher_data/found_matches/found_matches' + str(iteration_number) + '.csv'
    bucket.upload_file('/tmp/found_matches.csv', key)
    
    # Store the missing matches
    with open('/tmp/no_matches_cleaned.csv', mode='w', newline='', encoding='utf-8-sig') as matches:
        writer = csv.writer(matches, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        file_headers = ['PREFERRED_FIRST_NAME', 'PREFERRED_LAST_NAME', 'PREFERRED_FULL_NAME', 'UBC_EMPLOYEE_ID', 
                    'EMAIL_ADDRESS', 'PRIMARY_DEPARTMENT_AFFILIATION', 'SECONDARY_DEPARTMENT_AFFILIATION', 
                    'PRIMARY_FACULTY_AFFILIATION', 'SECONDARY_FACULTY_AFFILIATION', 'PRIMARY_CAMPUS_LOCATION', 
                    'PRIMARY_ACADEMIC_RANK', 'PRIMARY_ACADEMIC_TRACK_TYPE', 'JARO_DISTANCE', 
                    'CLOSEST_MATCH_NAME', 'CLOSEST_MATCH_ID', 'CLOSEST_MATCH_NAME_CLEANED']
        writer.writerow(file_headers)
        for match in no_matches:
            writer.writerow([match['PREFERRED_FIRST_NAME'], match['PREFERRED_LAST_NAME'], match['PREFERRED_FULL_NAME'],
                             match['UBC_EMPLOYEE_ID'], match['EMAIL_ADDRESS'], match['PRIMARY_DEPARTMENT_AFFILIATION'], 
                             match['SECONDARY_DEPARTMENT_AFFILIATION'], match['PRIMARY_FACULTY_AFFILIATION'], 
                             match['SECONDARY_FACULTY_AFFILIATION'], match['PRIMARY_CAMPUS_LOCATION'], 
                             match['PRIMARY_ACADEMIC_RANK'], match['PRIMARY_ACADEMIC_TRACK_TYPE'], match['JARO_DISTANCE'],
                             match['CLOSEST_MATCH_NAME'], match['CLOSEST_MATCH_ID'], match['CLOSEST_MATCH_NAME_CLEANED']])
    
    #upload the missing matches into s3
    key = 'researcher_data/no_matches_cleaned/no_matches_cleaned' + str(iteration_number) + '.csv'
    bucket.upload_file('/tmp/no_matches_cleaned.csv', key)

    # Set up the input to identifyDuplicates
    key = 'researcher_data/duplicates/duplicates' + str(iteration_number) + '.csv'
    return {'file_key_duplicates': key, 'iteration_number': iteration_number}
