import sys
import json
import io
import pandas as pd
import numpy as np
import psycopg2
import boto3
from awsglue.utils import getResolvedOptions
from pyjarowinkler.distance import get_jaro_distance

# get environment variable for this Glue job
args = getResolvedOptions(
    sys.argv, ["BUCKET_NAME", "FILENAME_CLEAN", "FILENAME_ID", "SECRET_NAME"])
BUCKET_NAME = args["BUCKET_NAME"]
FILENAME_CLEAN = args["FILENAME_CLEAN"]
FILENAME_ID = args["FILENAME_ID"]
SECRET_NAME = args["SECRET_NAME"]


def sort_key(matches):
    return matches['jaroDistance']


'''
:param firstNameToMatch: str first name to match against list
:param lastNameToMatch: str last name to match against list
:param listOfNamesToMatchAgainst: array with each element being an object with {firstName: '', lastName: '', scopusId: ''}
:return dictionary

All last name matches greater than 0.95 get added to an array
The array is sorted so the best match is put to the top of the lsit

All names are made to be lower to help with matching better

Then you take the smaller list of acceptable last name matches and match against the first name.

Go in order so the best matched last name is accepted when its first name has a jaro distance greater than equal to 0.95.

If there is a matching name the function returns a dictonary with the success key as True and the 
firstName, lastName and Id as keys

If there is no matching name the function returns a dictonary with the success as False

returns the matching name in the list of names given to match against.
If there is no matching name it returns a dictonary with the success as false
'''


def findMatch(firstNameToMatch, lastNameToMatch, listOfNamesToMatchAgainst):

    # Find all the last name matches
    lastNameMatches = []

    # Put all last name matches in the array lastNameMatches
    for firstLast in listOfNamesToMatchAgainst:
        jaroDistance = get_jaro_distance(
            lastNameToMatch, firstLast['lastName'])
        if (jaroDistance >= 0.95):
            lastNameMatches.append(
                {'firstName': firstLast['firstName'], 'lastName': firstLast['lastName'], 'id': firstLast['id'], 'jaroDistance': jaroDistance})

    # Sort the list of matches so that the first position in the array has the highest jaroDistance
    lastNameMatches.sort(key=sort_key, reverse=True)

    # Go through the sorted list of names and pick the first, first name that has a jaro distance greater than equal to 0.95.
    for firstLast in lastNameMatches:
        jaroDistance = get_jaro_distance(
            firstNameToMatch, firstLast['firstName'])
        if (jaroDistance >= 0.95):
            return {'firstName': firstLast['firstName'], 'lastName': firstLast['lastName'], 'id': firstLast['id'], 'success': True}

    return {'success': False}


"""
This function will fetch all data entries (rows) from the researcher database
and generate a list of dictionary in the format: {'firstName': Tien, 'lastName': Nguyen, "id": "ID-string"}

:return list of dictionary
"""


def createResearcherList():

    # a list that will eventually contain all the first and last name of
    # researcher in the postgreSQL database
    researcher_list = []

    # secret manager client to get login credentials
    sm_client = boto3.client("secretsmanager")
    response = sm_client.get_secret_value(SecretId=SECRET_NAME)["SecretString"]
    secret = json.loads(response)

    # postgreSQL connection
    connection = psycopg2.connect(
        user=secret["username"],
        password=secret["password"],
        host=secret["host"],
        dbname=secret["dbname"]
    )

    # fetch all data from database
    cursor = connection.cursor()
    query = "SELECT first_name, last_name, researcher_id FROM public.researcher_data"
    cursor.execute(query)
    results = cursor.fetchall()

    for row in results:
        firstName = row[0]
        lastName = row[1]
        Id = row[2]
        rowDict = {'firstName': firstName, 'lastName': lastName, "id": Id}
        researcher_list.append(rowDict)

    cursor.close()
    connection.close()

    return researcher_list


"""
This function will assign the id for the firstName and lastName input by name matching
To be called inside a lambda function (NOTE: not AWS Lambda)

:param firstName: string
:param lastName: string
:param researcherList: list of dictionary
:return string
"""


def assignId(firstName, lastName, researcherList):

    result = findMatch(firstName, lastName, researcherList)
    Id = ''
    if result['success'] == True:
        Id = result['id']
    return Id


"""
Perform name-matching and assigning ids for all names appears in the nserc data
Also merge First Name and Last Name into one Name column
Put the new data with id assigned into an S3 bucket

:param bucket: string, the bucket name
:key_clean1: string, the path(key) to clean csv file (without ids)
:key_clean2: string, the path(key) to clean csv file (with ids assigned)
"""


def assignIdToCleanData(bucket, key_clean1, key_clean2):

    researcher_list = createResearcherList()

    s3_client = boto3.resource('s3')
    response = s3_client.Object(bucket, key_clean1).get()
    status = response.get("ResponseMetadata", {}).get("HTTPStatusCode")

    df_clean = pd.read_csv(io.StringIO(response["Body"].read().decode(
        "utf-8")), header=0, keep_default_na=False)

    # select only the First / Last Name columns
    # drop all duplicates First/Last Name,
    # the resulting data will contain only unique First/Last Name pairs
    # duplicate are drops, by default only first occurrence is retained,
    # thus this implied that the order of occurrence is preserved
    df_distinct = df_clean[["First Name", "Last Name"]].drop_duplicates()

    df_distinct["Assigned ID"] = df_distinct.apply(
        lambda x: assignId(x["First Name"], x["Last Name"], researcher_list),
        axis=1)

    # Left Join with the cleaned df to assign IDs
    df_clean = df_clean.merge(right=df_distinct, left_on=["First Name", "Last Name"],
                              right_on=["First Name", "Last Name"], how="left")

    # combine First Name and Last Name into Name
    df_clean["Name"] = df_clean["First Name"] + " " + df_clean["Last Name"]
    df_clean = df_clean.drop(columns=["First Name", "Last Name"])

    with io.StringIO() as csv_buffer:
        df_clean.to_csv(csv_buffer, index=False)

        response = s3_client.Object(bucket_name=bucket, key=key_clean2).put(
            Body=csv_buffer.getvalue())
        status = response.get("ResponseMetadata", {}).get("HTTPStatusCode")

        if status == 200:
            print(f"Successful S3 put_object response. Status - {status}")
        else:
            print(f"Unsuccessful S3 put_object response. Status - {status}")


# function call
assignIdToCleanData(BUCKET_NAME, FILENAME_CLEAN, FILENAME_ID)
