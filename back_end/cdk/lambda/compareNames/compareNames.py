import csv
import codecs
import boto3
import numpy
from pyjarowinkler.distance import get_jaro_distance
import os
from unidecode import unidecode
from strsimpy.normalized_levenshtein import NormalizedLevenshtein
from strsimpy.jaro_winkler import JaroWinkler

normalized_levenshtein = NormalizedLevenshtein()
jarowinkler = JaroWinkler()


s3_client = boto3.client("s3")

def normalized_levenshtein_distance(s1, s2):
    return normalized_levenshtein.distance(s1, s2)

def jaccard_similarity_for_sets(s1, s2):
    set1 = set(s1)
    set2 = set(s2)
    intersection = set1.intersection(set2)
    union = set1.union(set2)
    return len(intersection) / len(union)

def computeScore(s1, s2):
    jaro_winkler_distance = jarowinkler.similarity(s1, s2)
    normalized_levenshtein = normalized_levenshtein_distance(s1, s2)
    jaccard_similarity_value = jaccard_similarity_for_sets(s1, s2)

    # Define the weights for the string similarity metrics
    weights = {
        'jaro_winkler': 0.6,
        'levenshtein': 0.4,
        'jaccard': 0
    }

    # Calculate the weighted score
    score = (jaro_winkler_distance * weights['jaro_winkler'] +
             (1 - normalized_levenshtein) * weights['levenshtein'] +
             jaccard_similarity_value * weights['jaccard'])

    return score

def matchLastNames(scopus_last_name, institution_last_name):
    if scopus_last_name is None or institution_last_name is None:
        return False

    if scopus_last_name == "" or institution_last_name == "":
        return False

    # Convert to lowercase
    scopus_last_name = scopus_last_name.lower()
    institution_last_name = institution_last_name.lower()

    # Remove accents
    scopus_last_name = unidecode(scopus_last_name)
    institution_last_name = unidecode(institution_last_name)

    common_suffixes = {"pharmd", "phd"}

    scopus_last_name_array = scopus_last_name.split()
    institution_last_name_array = institution_last_name.split()

    scopus_last_name_array = [x for x in scopus_last_name_array if x not in common_suffixes]
    institution_last_name_array = [x for x in institution_last_name_array if x not in common_suffixes]

    # Make string from array with space between each word
    scopus_last_name = " ".join(scopus_last_name_array)
    institution_last_name = " ".join(institution_last_name_array)

    score = computeScore(scopus_last_name, institution_last_name)

    threshold = 0.96
    if score >= threshold:
        return True

    return False

def matchFirstNames(scopusFirstName, institutionFirstName):
    """
    The scopusFirstName can have multiple words, hyphens, and words with periods.
    The institutionFirstName can have multiple words, hyphens, and words with periods.

    This function is only called if the last names match.
    """

    # Check if the first names are None or empty strings
    if scopusFirstName is None or institutionFirstName is None:
        return False

    # Check if the first names are empty strings
    if scopusFirstName == "" or institutionFirstName == "":
        return False

    # Convert to lowercase
    scopusFirstName = scopusFirstName.lower()
    institutionFirstName = institutionFirstName.lower()

    # Remove accents
    scopusFirstName = unidecode(scopusFirstName)
    institutionFirstName = unidecode(institutionFirstName)

    threshold = 0.95

    # Compute the score
    score = computeScore(scopusFirstName, institutionFirstName)

    # If the score is greater than the threshold then return True
    if score >= threshold:
        return True


    scopusFirstNameWord = scopusFirstName.split()
    institutionFirstNameWords = institutionFirstName.split()

    # Compute the score of the first names that do not match fully
    score = computeScore(scopusFirstNameWord[0], institutionFirstNameWords[0])


    if score >= threshold:
        # Check that the first letter of the remaining words match
        i = 0
        while i < len(scopusFirstNameWord) and i < len(institutionFirstNameWords):
            if scopusFirstNameWord[i][0] != institutionFirstNameWords[i][0]:
                return False
            i += 1

        return True

    return False

'''
Compares the given institution_name to the last name in each scopus_id_row. Returns all matches that have
a Jaro-Winkler distance greater than or equal to 0.95
'''
def SearchIdsLastName(institution_name, scopus_id_rows):
    # Create an empty list to store the matches.
    matches = []
    for row in scopus_id_rows:
        # Get the last name from the row.
        scopus_name = row['CLEANED_LAST_NAME']
        # check if the last names match
        lastNamesMatch = matchLastNames(scopus_name, institution_name)
        # If the last names match append the row to the matches list.
        if lastNamesMatch:
            matches.append({'SCOPUS_NAME': row['NAME'], 'SCOPUS_CLEANED_LAST_NAME': scopus_name, 'SCOPUS_CLEANED_FIRST_NAME': row['CLEANED_FIRST_NAME'], 'SCOPUS_ID': row['SCOPUS_ID']})
    # If there are no matches then return False and an empty list.
    if (len(matches) == 0):
        return (False, matches)
    return(True, matches)

'''
Compares the given institution_name to the first name in each scopus_id_row. Returns all matches that have
a Jaro-Winkler distance greater than or equal to 0.95
'''
def SearchIdsFirstName(institutionFirstName, lastNameMatches):
    # Create an empty list to store the matches.
    matches = []

    for row in lastNameMatches:
        scopusFirstName = row['SCOPUS_CLEANED_FIRST_NAME']

        # check if the first names match
        firstNamesMatch = matchFirstNames(institutionFirstName, scopusFirstName)

        # If the first names match append the row to the matches list.
        if firstNamesMatch:
            matches.append({'SCOPUS_NAME': row['SCOPUS_NAME'], 'SCOPUS_CLEANED_LAST_NAME': row['SCOPUS_CLEANED_LAST_NAME'], 'SCOPUS_CLEANED_FIRST_NAME': scopusFirstName, 'SCOPUS_ID': row['SCOPUS_ID']})

    # If there are no matches then return False and an empty list.
    if (len(matches) == 0): 
        return (False, matches)

    # If there are matches then return True and the list of matches.
    return (True, matches)

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

        fullMatches = []
        foundFullMatch = False

        # Search for matches by last name
        foundMatch, matches = SearchIdsLastName(last_name, scopus_id_rows)
        # If matches are found by last name, search through matched last names for a first name match.
        if (foundMatch):
            foundFullMatch, fullMatches = SearchIdsFirstName(first_name, matches)


        for i in range(len(fullMatches)):
            fullMatches[i].update(row)

        if (foundFullMatch):
            # If there are multiple matches with a Jaro-Winkler distance greater than 0.95 then store them in the duplicates folder.
            if(len(fullMatches) > 1):
                duplicates = numpy.concatenate((duplicates, fullMatches))
                
            # If there is only one match with a Jaro-Winkler distance greater than 0.95 then store it in the matches folder.
            else:
                found_matches = numpy.concatenate((found_matches, fullMatches))
        # If no matches are found by last name then store the row in the no_matches folder.
        else:
            no_matches = numpy.concatenate((no_matches, fullMatches))
    
    # TODO: change 100 to environment variable
    file_number = int(event['startIndex'] / 100)
    
    # Write matches to csv file
    with open('/tmp/matches.csv', mode='w', newline='', encoding='utf-8-sig') as matches_file:
        writer = csv.writer(matches_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL) 
        file_headers = ['PREFERRED_FIRST_NAME', 'PREFERRED_LAST_NAME', 'PREFERRED_FULL_NAME', 'INSTITUTION_USER_ID', 
                    'EMAIL_ADDRESS', 'PRIMARY_DEPARTMENT_AFFILIATION', 'SECONDARY_DEPARTMENT_AFFILIATION', 
                    'PRIMARY_FACULTY_AFFILIATION', 'SECONDARY_FACULTY_AFFILIATION', 'PRIMARY_CAMPUS_LOCATION', 
                    'PRIMARY_ACADEMIC_RANK', 'PRIMARY_ACADEMIC_TRACK_TYPE', 'SCOPUS_ID', 'EXTRA_IDS', 'CLOSEST_MATCH_NAME']
        writer.writerow(file_headers)
        for match in found_matches:
            writer.writerow([match['PREFERRED_FIRST_NAME'], match['PREFERRED_LAST_NAME'], match['PREFERRED_FULL_NAME'], 
                             match['INSTITUTION_USER_ID'], match['EMAIL_ADDRESS'], match['PRIMARY_DEPARTMENT_AFFILIATION'], 
                             match['SECONDARY_DEPARTMENT_AFFILIATION'], match['PRIMARY_FACULTY_AFFILIATION'], 
                             match['SECONDARY_FACULTY_AFFILIATION'], match['PRIMARY_CAMPUS_LOCATION'], 
                             match['PRIMARY_ACADEMIC_RANK'], match['PRIMARY_ACADEMIC_TRACK_TYPE'], match['SCOPUS_ID'], [],
                             match['SCOPUS_NAME']])
    
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
                    'PRIMARY_ACADEMIC_RANK', 'PRIMARY_ACADEMIC_TRACK_TYPE', 'SCOPUS_ID', 'CLOSEST_MATCH_NAME']
        writer.writerow(file_headers)
        for match in duplicates:
            writer.writerow([match['PREFERRED_FIRST_NAME'], match['PREFERRED_LAST_NAME'], match['PREFERRED_FULL_NAME'], 
                             match['INSTITUTION_USER_ID'], match['EMAIL_ADDRESS'], match['PRIMARY_DEPARTMENT_AFFILIATION'], 
                             match['SECONDARY_DEPARTMENT_AFFILIATION'], match['PRIMARY_FACULTY_AFFILIATION'], 
                             match['SECONDARY_FACULTY_AFFILIATION'], match['PRIMARY_CAMPUS_LOCATION'], 
                             match['PRIMARY_ACADEMIC_RANK'], match['PRIMARY_ACADEMIC_TRACK_TYPE'], match['SCOPUS_ID'], 
                             match['SCOPUS_NAME']])
    
    # Upload the data into s3
    key = 'researcher_data/duplicates/duplicates' + str(file_number) + '.csv'
    bucket.upload_file('/tmp/duplicates.csv', key)
    
    # Write missing matches to csv file
    with open('/tmp/no_matches.csv', mode='w', newline='', encoding='utf-8-sig') as no_matches_file:
        writer = csv.writer(no_matches_file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
        file_headers = ['PREFERRED_FIRST_NAME', 'PREFERRED_LAST_NAME', 'PREFERRED_FULL_NAME', 'CLEANED_NAME', 'INSTITUTION_USER_ID', 
                    'EMAIL_ADDRESS', 'PRIMARY_DEPARTMENT_AFFILIATION', 'SECONDARY_DEPARTMENT_AFFILIATION', 
                    'PRIMARY_FACULTY_AFFILIATION', 'SECONDARY_FACULTY_AFFILIATION', 'PRIMARY_CAMPUS_LOCATION', 
                    'PRIMARY_ACADEMIC_RANK', 'PRIMARY_ACADEMIC_TRACK_TYPE', 
                    'CLOSEST_MATCH_NAME', 'CLOSEST_MATCH_ID', 'CLOSEST_MATCH_NAME_CLEANED']
        writer.writerow(file_headers)
        for match in no_matches:
            writer.writerow([match['PREFERRED_FIRST_NAME'], match['PREFERRED_LAST_NAME'], match['PREFERRED_FULL_NAME'], '',
                             match['INSTITUTION_USER_ID'], match['EMAIL_ADDRESS'], match['PRIMARY_DEPARTMENT_AFFILIATION'], 
                             match['SECONDARY_DEPARTMENT_AFFILIATION'], match['PRIMARY_FACULTY_AFFILIATION'], 
                             match['SECONDARY_FACULTY_AFFILIATION'], match['PRIMARY_CAMPUS_LOCATION'], 
                             match['PRIMARY_ACADEMIC_RANK'], match['PRIMARY_ACADEMIC_TRACK_TYPE'], 
                             match['SCOPUS_NAME'], match['SCOPUS_ID'], match['SCOPUS_CLEANED_LAST_NAME']])
    
    # Upload the data into s3
    key = 'researcher_data/no_matches/no_matches' + str(file_number) + '.csv'
    bucket.upload_file('/tmp/no_matches.csv', key)
    
    return {'file_key': key, 'iteration_number': file_number}