import sys
import json
import io
import pandas as pd
import numpy as np
import boto3
import requests
import urllib
import base64
import math
import time
import ast
import re
import psycopg2
from psycopg2 import extras
from datetime import datetime
from custom_utils.utils import fetchFromS3, putToS3
from awsglue.utils import getResolvedOptions
from pyjarowinkler.distance import get_jaro_distance


# define job parameters
args = getResolvedOptions(
    sys.argv, ["TEMP_BUCKET_NAME", "EPO_INSTITUTION_NAME", "FILE_PATH", "DB_SECRET_NAME", "EQUIVALENT"])
TEMP_BUCKET_NAME = args["TEMP_BUCKET_NAME"]
EPO_INSTITUTION_NAME = args["EPO_INSTITUTION_NAME"]
FILE_PATH = args["FILE_PATH"]
DB_SECRET_NAME = args["DB_SECRET_NAME"]
EQUIVALENT = args["EQUIVALENT"]

# clients
glue_client = boto3.client("glue")


def sort_key(matches):
    return matches['jaroDistance']


'''
:param firstNameToMatch: str first name to match against list
:param lastNameToMatch: str last name to match against list
:param listOfNamesToMatchAgainst: array with each element being an object with {firstName: '', lastName: '', researcherId: ''}
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
                {
                    'firstName': firstLast['firstName'],
                    'lastName': firstLast['lastName'],
                    'preferredName': firstLast['preferredName'],
                    'id': firstLast['id'],
                    'jaroDistance': jaroDistance

                }
            )

    # Sort the list of matches so that the first position in the array has the highest jaroDistance
    lastNameMatches.sort(key=sort_key, reverse=True)

    # Go through the sorted list of names and pick the first, first name that has a jaro distance greater than equal to 0.95.
    for firstLast in lastNameMatches:
        jaroDistance = get_jaro_distance(
            firstNameToMatch, firstLast['firstName'])
        if (jaroDistance >= 0.95):
            return {
                'firstName': firstLast['firstName'],
                'lastName': firstLast['lastName'],
                'preferredName': firstLast['preferredName'],
                'id': firstLast['id'],
                'success': True
            }

    return {'success': False}


def findMatchFullName(fullname, listOfNamesToMatchAgainst):

    for name in listOfNamesToMatchAgainst:
        jaroDistance = get_jaro_distance(
            fullname, name['preferredName'])
        if (jaroDistance >= 0.95):
            return {
                'id': name['id'],
                'firstName': name['firstName'],
                'lastName': name['lastName'],
                'preferredName': name['preferredName'],
                'success': True
            }

    return {'success': False}


"""
This function will fetch all data entries (rows) from the researcher database
and generate a list of dictionary in the format: 
{
    'firstName': 'Tien', 
    'lastName': 'Nguyen', 
    "preferredName": 'Tien Nguyen', 
    "id": "ID-string"
}

:@return list of dictionary
"""


def createResearcherList():

    # a list that will eventually contain all the first and last name of
    # researcher in the postgreSQL database
    researcher_list = []

    # secret manager client to get login credentials
    sm_client = boto3.client("secretsmanager")
    response = sm_client.get_secret_value(
        SecretId=DB_SECRET_NAME)["SecretString"]
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
    query = "SELECT first_name, last_name, preferred_name, researcher_id FROM public.researcher_data"
    cursor.execute(query)
    results = cursor.fetchall()

    for row in results:
        firstName = row[0]
        lastName = row[1]
        preferredName = row[2]
        ids = row[3]
        rowDict = {
            'firstName': firstName,
            'lastName': lastName,
            "preferredName": preferredName,
            "id": ids
        }
        researcher_list.append(rowDict)

    cursor.close()
    connection.close()

    return researcher_list


"""
This function will assign the id for the firstName and lastName input by name matching
To be called inside a lambda function (NOTE: not AWS Lambda)

:@param firstName: string
:@param lastName: string
:@param researcherList: list of dictionary
:@return string
"""


def assignId(firstName, lastName, researcherList):

    result = findMatch(firstName, lastName, researcherList)
    Id = ''
    preferredName = ''
    if result['success'] == True:
        Id = result['id']
        preferredName = result['preferredName']

    return Id, preferredName


"""
combine fname and lname into one name if inventor is not in database
@param fname: str, first name
@param lname: str, last name
@param name: str, full name (name that are successfully matched)
@return str: the full name
"""


def full_name(fname, lname, name):

    if name == '':
        return fname + " " + lname
    return name


"""
This function will assign the ids that matched a researcher in the postgreSQL database
"""


def assign_ids_epo_patent():

    global FILE_PATH
    researcherList = createResearcherList()
    df = pd.read_csv(fetchFromS3(TEMP_BUCKET_NAME, FILE_PATH))
    # print(df.columns.values.tolist())
    df[["inventors_assigned_ids", "inventor_fullname"]] = df.apply(
        lambda x: assignId(x["first_name"], x["last_name"], researcherList),
        axis=1,
        result_type="expand"
    )
    df["matched_inventors_names"] = df["inventor_fullname"]
    # put full names in the inventors column
    df["inventors"] = df.apply(lambda x: full_name(
        x["first_name"], x["last_name"], x["inventor_fullname"]), axis=1)
    # df = df.drop(["inventor_fullname"])
    group = ["publication_number", "title", "applicants", "cpc",
             "family_number", "publication_date", "country_code", "kind_code"]
    df = df.groupby(group, as_index=False).aggregate(
        {
            "inventors": lambda x: ', '.join(x),
            # get rid of empty strings
            # "inventors_assigned_ids": lambda x: list(filter(None, list(x))),
            # column contain only the matched names
            # "matched_inventors_names": lambda x: list(filter(None, list(x)))
            "inventors_assigned_ids": lambda x: ','.join(list(filter(None, list(x)))),
            "matched_inventors_names": lambda x: ','.join(list(filter(None, list(x)))),
        }
    )

    # datetime object containing current date and time
    # now = datetime.now()
    # print("now =", now)
    # # dd/mm/YY H:M:S
    # dt_string = now.strftime("%d-%m-%Y_%H-%M-%S")
    # print("date and time =", dt_string)
    if EQUIVALENT == "true":
        FILE_PATH = f"epo/patent_with_researcher_ids/equivalent/patents_equivalent_ids.csv"
    else:
        FILE_PATH = f"epo/patent_with_researcher_ids/initial/patents_equivalent_ids.csv"
    putToS3(df, TEMP_BUCKET_NAME, FILE_PATH)

# script entry point
def main(argv):

    global FILE_PATH

    assign_ids_epo_patent()

    # start downstream job
    arguments = {
        "--TEMP_BUCKET_NAME": TEMP_BUCKET_NAME,
        "--FILE_PATH": FILE_PATH,
        "--EQUIVALENT": EQUIVALENT
    }
    glue_client.start_job_run(
        JobName="expertiseDashboard-storeEpoPatents",
        Arguments=arguments
    )


if __name__ == "__main__":
    main(sys.argv)
