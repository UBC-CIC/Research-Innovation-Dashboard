import csv
import codecs
import boto3
import numpy
from pyjarowinkler.distance import get_jaro_distance
import os

s3_client = boto3.client("s3")

'''
Compares the given institution_name to the last name in each scopus_id_row. Returns all matches that have
a Jaro-Winkler distance greater than or equal to 0.95
'''
def SearchIdsLastName(institution_name, scopus_id_rows):
    matches = []
    max_jaro_distance = 0
    matched_name = ''
    for row in scopus_id_rows:
        scopus_name = row['CLEANED_LAST_NAME']
        jaro_distance = get_jaro_distance(scopus_name, institution_name, winkler=True, scaling=0.1)
        if (jaro_distance >= max_jaro_distance):
            max_jaro_distance = jaro_distance
            matched_name = row['NAME']
            matched_name_last = row['CLEANED_LAST_NAME']
            matched_name_first = row['CLEANED_FIRST_NAME']
            matched_id = row['SCOPUS_ID']
        if (jaro_distance >= 0.95):
            matches.append({'SCOPUS_NAME': row['NAME'], 'SCOPUS_CLEANED_LAST_NAME': scopus_name, 'SCOPUS_CLEANED_FIRST_NAME': row['CLEANED_FIRST_NAME'], 'SCOPUS_ID': row['SCOPUS_ID'], 'JARO_DISTANCE': jaro_distance})
    if (len(matches) == 0):
        matches.append({'SCOPUS_NAME': matched_name, 'SCOPUS_CLEANED_LAST_NAME': matched_name_last, 'SCOPUS_CLEANED_FIRST_NAME': matched_name_first, 'SCOPUS_ID': matched_id, 'JARO_DISTANCE': max_jaro_distance})
        return (False, matches)
    elif (len(matches) > 1):
        return(True, PruneMatches(matches))
    else:
        return(True, matches)

'''
Compares the given institution_name to the first name in each scopus_id_row. Returns all matches that have
a Jaro-Winkler distance greater than or equal to 0.95
'''
def SearchIdsFirstName(institution_name, scopus_id_rows, email):
    matches = []
    max_jaro_distance = 0
    matched_name = ''
    for row in scopus_id_rows:
        scopus_name = row['SCOPUS_CLEANED_FIRST_NAME']
        if (scopus_name):
            jaro_distance = get_jaro_distance(scopus_name, institution_name, winkler=True, scaling=0.1)
        else:
            jaro_distance = 0
        if (jaro_distance >= max_jaro_distance):
            max_jaro_distance = jaro_distance
            matched_name = row['SCOPUS_NAME']
            matched_name_last = row['SCOPUS_CLEANED_LAST_NAME']
            matched_name_first = row['SCOPUS_CLEANED_FIRST_NAME']
            matched_id = row['SCOPUS_ID']
        if (jaro_distance >= 0.95):
            matches.append({'SCOPUS_NAME': row['SCOPUS_NAME'], 'SCOPUS_CLEANED_LAST_NAME': row['SCOPUS_CLEANED_LAST_NAME'], 'SCOPUS_CLEANED_FIRST_NAME': scopus_name, 'SCOPUS_ID': row['SCOPUS_ID'], 'JARO_DISTANCE': jaro_distance})
    if (len(matches) == 0):
        matches.append({'SCOPUS_NAME': matched_name, 'SCOPUS_CLEANED_LAST_NAME': matched_name_last, 'SCOPUS_CLEANED_FIRST_NAME': matched_name_first, 'SCOPUS_ID': matched_id, 'JARO_DISTANCE': max_jaro_distance})
        return (False, matches)
    elif (len(matches) > 1):
        return(True, PruneMatches(matches))
    else:
        return(True, matches)

'''
Given a list of potential matches, returns a list containing the match with the highest Jaro-Winkler distance.
If multiple matches share the highest Jaro-Winkler Distance then they are returned in the list as well
'''
def PruneMatches(matches):
    pruned_matches = []
    max_jaro_distance = 0
    for match in matches:
        if (match['JARO_DISTANCE'] > max_jaro_distance):
            max_jaro_distance = match['JARO_DISTANCE']
    for match in matches:
        if (match['JARO_DISTANCE'] >= max_jaro_distance):
            pruned_matches.append(match)
    return pruned_matches

'''
Compares name data present in the HR data file against the name data 
present in the Scopus id file. Stores matches that have a Jaro-Winkler 
distance greater than or equal to 0.95 in the matches folder as part of 
a .csv file. Stores the matches with a Jaro-Winkler distance less than 0.95
in te no_matches folder as part of a .csv file. Stores the matches with multiple
associated Scopus ids in the duplicates folder as part of a .csv file.

'''
def lambda_handler(event, context):
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    key = 'researcher_data/institution_clean.csv'
    data = s3_client.get_object(Bucket=bucket_name, Key=key)
    table_rows = list(csv.DictReader(codecs.getreader("utf-8-sig")(data["Body"])))
    key = 'researcher_data/scopus_clean.csv'
    data = s3_client.get_object(Bucket=bucket_name, Key=key)
    scopus_id_rows = list(csv.DictReader(codecs.getreader("utf-8-sig")(data["Body"])))
    found_matches = []
    no_matches = []
    duplicates = []
    for i in range(event['startIndex'], event['endIndex']):
        row = table_rows[i]
        first_name = row['CLEANED_FIRST_NAME']
        last_name = row['CLEANED_LAST_NAME']
        results = SearchIdsLastName(last_name, scopus_id_rows)
        results = SearchIdsFirstName(first_name, results[1], row['EMAIL_ADDRESS'])
        found_match = results[0]
        matches = results[1]
        for i in range(len(matches)):
            matches[i].update(row)
        if not found_match:
            no_matches = numpy.concatenate((no_matches, matches))
        else:
            if len(matches) > 1:
                duplicates = numpy.concatenate((duplicates, matches))
            elif len(matches) == 1:
                found_matches = numpy.concatenate((found_matches, matches))
    
    # TODO: change 100 to environment variable
    file_number = int(event['startIndex'] / 100)
    
    # Write matches to csv file
    with open('/tmp/matches.csv', mode='w', newline='', encoding='utf-8-sig') as matches_file:
        writer = csv.writer(matches_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL) 
        file_headers = ['PREFERRED_FIRST_NAME', 'PREFERRED_LAST_NAME', 'PREFERRED_FULL_NAME', 'INSTITUTION_USER_ID', 
                    'EMAIL_ADDRESS', 'PRIMARY_DEPARTMENT_AFFILIATION', 'SECONDARY_DEPARTMENT_AFFILIATION', 
                    'PRIMARY_FACULTY_AFFILIATION', 'SECONDARY_FACULTY_AFFILIATION', 'PRIMARY_CAMPUS_LOCATION', 
                    'PRIMARY_ACADEMIC_RANK', 'PRIMARY_ACADEMIC_TRACK_TYPE', 'SCOPUS_ID', 'EXTRA_IDS', 'JARO_DISTANCE', 'CLOSEST_MATCH_NAME']
        writer.writerow(file_headers)
        for match in found_matches:
            writer.writerow([match['PREFERRED_FIRST_NAME'], match['PREFERRED_LAST_NAME'], match['PREFERRED_FULL_NAME'], 
                             match['INSTITUTION_USER_ID'], match['EMAIL_ADDRESS'], match['PRIMARY_DEPARTMENT_AFFILIATION'], 
                             match['SECONDARY_DEPARTMENT_AFFILIATION'], match['PRIMARY_FACULTY_AFFILIATION'], 
                             match['SECONDARY_FACULTY_AFFILIATION'], match['PRIMARY_CAMPUS_LOCATION'], 
                             match['PRIMARY_ACADEMIC_RANK'], match['PRIMARY_ACADEMIC_TRACK_TYPE'], match['SCOPUS_ID'], [],
                             match['JARO_DISTANCE'], match['SCOPUS_NAME']])
    
    # Upload the data into s3
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket_name)
    key = 'researcher_data/matches/matches' + str(file_number) + '.csv'
    bucket.upload_file('/tmp/matches.csv', key)
    
    # Write the duplicates to a csv file
    with open('/tmp/duplicates.csv', mode='w', newline='', encoding='utf-8-sig') as duplicates_file:
        writer = csv.writer(duplicates_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        file_headers = ['PREFERRED_FIRST_NAME', 'PREFERRED_LAST_NAME', 'PREFERRED_FULL_NAME', 'INSTITUTION_USER_ID', 
                    'EMAIL_ADDRESS', 'PRIMARY_DEPARTMENT_AFFILIATION', 'SECONDARY_DEPARTMENT_AFFILIATION', 
                    'PRIMARY_FACULTY_AFFILIATION', 'SECONDARY_FACULTY_AFFILIATION', 'PRIMARY_CAMPUS_LOCATION', 
                    'PRIMARY_ACADEMIC_RANK', 'PRIMARY_ACADEMIC_TRACK_TYPE', 'SCOPUS_ID', 'JARO_DISTANCE', 'CLOSEST_MATCH_NAME']
        writer.writerow(file_headers)
        for match in duplicates:
            writer.writerow([match['PREFERRED_FIRST_NAME'], match['PREFERRED_LAST_NAME'], match['PREFERRED_FULL_NAME'], 
                             match['INSTITUTION_USER_ID'], match['EMAIL_ADDRESS'], match['PRIMARY_DEPARTMENT_AFFILIATION'], 
                             match['SECONDARY_DEPARTMENT_AFFILIATION'], match['PRIMARY_FACULTY_AFFILIATION'], 
                             match['SECONDARY_FACULTY_AFFILIATION'], match['PRIMARY_CAMPUS_LOCATION'], 
                             match['PRIMARY_ACADEMIC_RANK'], match['PRIMARY_ACADEMIC_TRACK_TYPE'], match['SCOPUS_ID'], 
                             match['JARO_DISTANCE'], match['SCOPUS_NAME']])
    
    # Upload the data into s3
    key = 'researcher_data/duplicates/duplicates' + str(file_number) + '.csv'
    bucket.upload_file('/tmp/duplicates.csv', key)
    
    # Write missing matches to csv file
    with open('/tmp/no_matches.csv', mode='w', newline='', encoding='utf-8-sig') as no_matches_file:
        writer = csv.writer(no_matches_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        file_headers = ['PREFERRED_FIRST_NAME', 'PREFERRED_LAST_NAME', 'PREFERRED_FULL_NAME', 'CLEANED_NAME', 'INSTITUTION_USER_ID', 
                    'EMAIL_ADDRESS', 'PRIMARY_DEPARTMENT_AFFILIATION', 'SECONDARY_DEPARTMENT_AFFILIATION', 
                    'PRIMARY_FACULTY_AFFILIATION', 'SECONDARY_FACULTY_AFFILIATION', 'PRIMARY_CAMPUS_LOCATION', 
                    'PRIMARY_ACADEMIC_RANK', 'PRIMARY_ACADEMIC_TRACK_TYPE', 'JARO_DISTANCE', 
                    'CLOSEST_MATCH_NAME', 'CLOSEST_MATCH_ID', 'CLOSEST_MATCH_NAME_CLEANED']
        writer.writerow(file_headers)
        for match in no_matches:
            writer.writerow([match['PREFERRED_FIRST_NAME'], match['PREFERRED_LAST_NAME'], match['PREFERRED_FULL_NAME'], '',
                             match['INSTITUTION_USER_ID'], match['EMAIL_ADDRESS'], match['PRIMARY_DEPARTMENT_AFFILIATION'], 
                             match['SECONDARY_DEPARTMENT_AFFILIATION'], match['PRIMARY_FACULTY_AFFILIATION'], 
                             match['SECONDARY_FACULTY_AFFILIATION'], match['PRIMARY_CAMPUS_LOCATION'], 
                             match['PRIMARY_ACADEMIC_RANK'], match['PRIMARY_ACADEMIC_TRACK_TYPE'], match['JARO_DISTANCE'],
                             match['SCOPUS_NAME'], match['SCOPUS_ID'], match['SCOPUS_CLEANED_LAST_NAME']])
    
    # Upload the data into s3
    key = 'researcher_data/no_matches/no_matches' + str(file_number) + '.csv'
    bucket.upload_file('/tmp/no_matches.csv', key)
    
    return {'file_key': key, 'iteration_number': file_number}
