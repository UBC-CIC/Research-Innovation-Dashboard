import json
import requests
import boto3
import csv
import codecs
import os
from pyjarowinkler.distance import get_jaro_distance
from datetime import datetime
import time

s3_client = boto3.client("s3")
ssm_client = boto3.client('ssm')
instoken = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/instoken', WithDecryption=True)
apikey = ssm_client.get_parameter(Name='/service/elsevier/api/user_name/key', WithDecryption=True)
elsevier_headers = {'Accept' : 'application/json', 'X-ELS-APIKey' : apikey['Parameter']['Value'], 'X-ELS-Insttoken' : instoken['Parameter']['Value']}

'''
Given a list of potential matches, returns a list containing the match with the highest Jaro-Winkler distance.
If multiple matches share the highest Jaro-Winkler Distance then they are returned in the list as well
'''
def PruneMatches(matches):
    pruned_matches = []
    max_jaro_distance = 0
    for match in matches:
        match_distance = float(match['JARO_DISTANCE'])
        if (match_distance > max_jaro_distance):
            max_jaro_distance = match_distance
    for match in matches:
        if (match_distance >= max_jaro_distance):
            pruned_matches.append(match)
    return pruned_matches

'''
Given a list lst and a number n, splits lst into sections of size n and returns the sections in a list
'''
def splitArray(lst, n):
    ret_arr = []
    for i in range(0, len(lst), n):
         ret_arr.append(lst[i:i + n])
    return ret_arr

'''
Given a set of duplicate matches, checks for similarity between the matches department and faculty data
and the areas of interest associated with the Scopus id. Returns a list of matches who have similarity
between their department/faculty and the areas of interest of their Scopus id.
'''
def confirmMatches(duplicates_split):
    found_matches = []
    no_matches = []
    for author_subset in duplicates_split:
        author_ids = []
        for author in author_subset:
            author_ids.append(author['SCOPUS_ID'])
        url = 'https://api.elsevier.com/content/author'
        query = {'author_id' : author_ids}
        response = requests.get(url, headers=elsevier_headers, params=query)
        print(response.headers)
        
        #Error handling for API limit hit
        #In future add a line to add to database to show error on website
        if "error-response" in response.json():
            if "error-code" in response.json()["error-response"]:
                if response.json()["error-response"]["error-code"] == "TOO_MANY_REQUESTS":
                    dateTimeObject = datetime.fromtimestamp(int(response.headers['X-RateLimit-Reset']))
                    raise Exception("API limit has been exceded! Please try the data pipeline again on " + str(dateTimeObject) + "UTC Time")
            
                if response.json()["error-response"]["error-code"] == "RATE_LIMIT_EXCEEDED":
                    print(response.json()["error-response"])
                    print("API Throttling, attempt to retry query after 7 seconds")
                    time.sleep(7)
                    response = requests.get(url, headers=elsevier_headers, params=query)
                    print(response.headers)
                    # raise Exception(json.dumps(response.json()["error-response"]))
            
        if (len(author_ids) == 1):
            results = response.json()['author-retrieval-response']
        elif 'author-retrieval-response-list' not in response.json():
            results = response.json()['author-retrieval-response']
        elif 'author-retrieval-response' not in response.json():
            results = response.json()['author-retrieval-response-list']['author-retrieval-response']
                
        for result in results:
            found_match = False
            data = result['coredata']
            # There is a bug in elseviers responses where for certain ids they'll
            # return no subject areas
            subject_areas = []
            
            if "subject-areas" in result:
                if (result['subject-areas'] == None):
                    subject_areas = []
                else:
                    if "subject-area" in result['subject-areas']:
                        subject_areas = result['subject-areas']['subject-area']
                    
            for author in author_subset:
                if author['SCOPUS_ID'] in data['dc:identifier']:
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
    return(found_matches)

'''
Given an array of authors, fetches the 5 year h-index from the Scival API 
for each author and appends it to the authors info. Fetches data for 100 
authors on each API call
'''
def sciValFetch(authors):
    try:
        url = os.environ['SCIVAL_URL']
        max_authors = int(os.environ['SCIVAL_MAX_AUTHORS'])
    except KeyError as e:
        print(f"Error: Missing environment variable {e}")
        return
    except ValueError as e:
        print(f"Error: Invalid environment variable value {e}")
        return

    authors_split = splitArray(authors, max_authors)

    for author_subset in authors_split:
        author_ids = []
        for author in author_subset:
            author_ids.append(int(author['SCOPUS_ID']))

        query = {'authors': ','.join(map(str, author_ids)),
                 'metricTypes': 'HIndices',
                 'yearRange': '5yrs',
                 'byYear': 'false'
                 }

        max_retries = 5
        retries = 0
        backoff_factor = 2

        while retries <= max_retries:
            try:
                response = requests.get(url, headers=elsevier_headers, params=query)
                response.raise_for_status()
                break
            except requests.exceptions.RequestException as e:
                if response.status_code == 429 or isinstance(e, requests.exceptions.Timeout):
                    # API rate limit hit or timeout occurred, apply exponential backoff
                    sleep_time = backoff_factor ** retries
                    print(f"API rate limit hit or request timed out. Retrying in {sleep_time} seconds...")
                    time.sleep(sleep_time)
                    retries += 1
                else:
                    # Other request exceptions
                    print(f"Error: API request failed - {e}")
                    return
            if retries > max_retries:
                print("Error: Maximum retries reached. Giving up.")
                return

        try:
            results = response.json()['results']
        except KeyError as e:
            print(f"Error: Unexpected JSON structure in API response - {e}")
            return

        for result in results:
            for author in author_subset:
                if int(author['SCOPUS_ID']) == result['author']['id']:
                    if 'value' in result['metrics'][0]:
                        author['h_index'] = result['metrics'][0]['value']

'''
Fetches a .csv file of duplicate matches from S3 and identifies the best matching Scopus id. If no definite match can be found then the Scopus id with
te highest h-index is set as the primary Scopus id
'''
def lambda_handler(event, context):
    iteration_number = event['iteration_number']
    # Fetch the correct file from s3
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    key = event['file_key_duplicates']
    data = s3_client.get_object(Bucket=bucket_name, Key=key)
    rows = list(csv.DictReader(codecs.getreader("utf-8-sig")(data["Body"])))
    
    # Identify the similar profiles
    matches = []
    i = 0
    while(i < len(rows)):
        duplicates = []
        for row in rows:
            if (row['INSTITUTION_USER_ID'] == rows[i]['INSTITUTION_USER_ID']):
                duplicates.append(row)
        matches.append(duplicates)
        i += len(duplicates)
    
    solved_duplicates = []
    unsolved_duplicates = []
    for duplicates in matches:
        duplicates_split = splitArray(duplicates, 25)
        confirmed_matches = confirmMatches(duplicates_split)
        if(len(confirmed_matches) == 1):
            solved_duplicates.append(confirmed_matches[0])
        elif(len(confirmed_matches) > 1):
            unsolved_duplicates.append(confirmed_matches)
    
    with open('/tmp/solved_duplicates.csv', mode='w', newline='', encoding='utf-8-sig') as solved_duplicates_file:
        writer = csv.writer(solved_duplicates_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        file_headers = ['PREFERRED_FIRST_NAME', 'PREFERRED_LAST_NAME', 'PREFERRED_FULL_NAME', 'INSTITUTION_USER_ID', 
                    'EMAIL_ADDRESS', 'PRIMARY_DEPARTMENT_AFFILIATION', 'SECONDARY_DEPARTMENT_AFFILIATION', 
                    'PRIMARY_FACULTY_AFFILIATION', 'SECONDARY_FACULTY_AFFILIATION', 'PRIMARY_CAMPUS_LOCATION', 
                    'PRIMARY_ACADEMIC_RANK', 'PRIMARY_ACADEMIC_TRACK_TYPE', 'SCOPUS_ID', 'EXTRA_IDS', 'CLOSEST_MATCH_NAME']
        writer.writerow(file_headers)
        for match in solved_duplicates:
            writer.writerow([match['PREFERRED_FIRST_NAME'], match['PREFERRED_LAST_NAME'], match['PREFERRED_FULL_NAME'], 
                             match['INSTITUTION_USER_ID'], match['EMAIL_ADDRESS'], match['PRIMARY_DEPARTMENT_AFFILIATION'], 
                             match['SECONDARY_DEPARTMENT_AFFILIATION'], match['PRIMARY_FACULTY_AFFILIATION'], 
                             match['SECONDARY_FACULTY_AFFILIATION'], match['PRIMARY_CAMPUS_LOCATION'], 
                             match['PRIMARY_ACADEMIC_RANK'], match['PRIMARY_ACADEMIC_TRACK_TYPE'], match['SCOPUS_ID'], [], 
                             match['CLOSEST_MATCH_NAME']])
    
    # Upload the solved duplicates to s3
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket_name)
    key = 'researcher_data/duplicates/solved_duplicates/solved_duplicates' + str(iteration_number) + '.csv'
    bucket.upload_file('/tmp/solved_duplicates.csv', key)
    
    # Identify which Scopus id has the highest 5-year h_index
    extra_id_authors = []
    for author_subset in unsolved_duplicates:
        sciValFetch(author_subset)
        highest_h_index = 0
        primary_scopus_id = ''
        for author in author_subset:
            if ('h_index' in author.keys()):
                if(author['h_index'] > highest_h_index):
                    highest_h_index = author['h_index']
                    primary_scopus_id = author['SCOPUS_ID']
        for author in author_subset:
            if(author['SCOPUS_ID'] == primary_scopus_id):
                extra_ids = []
                for secondary_profile in author_subset:
                    if(secondary_profile['SCOPUS_ID'] != primary_scopus_id):
                        extra_ids.append(secondary_profile['SCOPUS_ID'])
                author['EXTRA_IDS'] = str(extra_ids)
                extra_id_authors.append(author)
    
    # Write the unsolved duplicates to a csv file
    with open('/tmp/unsolved_duplicates.csv', mode='w', newline='', encoding='utf-8-sig') as unsolved_duplicates_file:
        writer = csv.writer(unsolved_duplicates_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        file_headers = ['PREFERRED_FIRST_NAME', 'PREFERRED_LAST_NAME', 'PREFERRED_FULL_NAME', 'INSTITUTION_USER_ID', 
                    'EMAIL_ADDRESS', 'PRIMARY_DEPARTMENT_AFFILIATION', 'SECONDARY_DEPARTMENT_AFFILIATION', 
                    'PRIMARY_FACULTY_AFFILIATION', 'SECONDARY_FACULTY_AFFILIATION', 'PRIMARY_CAMPUS_LOCATION', 
                    'PRIMARY_ACADEMIC_RANK', 'PRIMARY_ACADEMIC_TRACK_TYPE', 'SCOPUS_ID', 'EXTRA_IDS']
        writer.writerow(file_headers)
        for match in extra_id_authors:
            writer.writerow([match['PREFERRED_FIRST_NAME'], match['PREFERRED_LAST_NAME'], match['PREFERRED_FULL_NAME'], 
                             match['INSTITUTION_USER_ID'], match['EMAIL_ADDRESS'], match['PRIMARY_DEPARTMENT_AFFILIATION'], 
                             match['SECONDARY_DEPARTMENT_AFFILIATION'], match['PRIMARY_FACULTY_AFFILIATION'], 
                             match['SECONDARY_FACULTY_AFFILIATION'], match['PRIMARY_CAMPUS_LOCATION'], 
                             match['PRIMARY_ACADEMIC_RANK'], match['PRIMARY_ACADEMIC_TRACK_TYPE'], match['SCOPUS_ID'], 
                             match['EXTRA_IDS']])
    
    # Upload the unsolved duplicates to s3
    key = 'researcher_data/duplicates/unsolved_duplicates/unsolved_duplicates' + str(iteration_number) + '.csv'
    bucket.upload_file('/tmp/unsolved_duplicates.csv', key)
    
    return
