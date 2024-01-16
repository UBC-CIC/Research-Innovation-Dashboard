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
from datetime import datetime
from custom_utils.utils import fetchFromS3, putToS3
from awsglue.utils import getResolvedOptions


# define job parameters
args = getResolvedOptions(
    sys.argv, ["TEMP_BUCKET_NAME", "EPO_INSTITUTION_NAME", "API_SECRET_NAME", "FILE_PATH"])
TEMP_BUCKET_NAME = args["TEMP_BUCKET_NAME"]
API_SECRET_NAME = args["API_SECRET_NAME"]
EPO_INSTITUTION_NAME = args["EPO_INSTITUTION_NAME"]
FILE_PATH = args["FILE_PATH"]
ACCESS_AUTH_URL = "https://ops.epo.org/3.2/auth/accesstoken"

# get API credentials
glue_client = boto3.client("glue")
sm_client = boto3.client("secretsmanager")
secret = json.loads(sm_client.get_secret_value(SecretId=API_SECRET_NAME)["SecretString"])
consumer_key = secret["consumer_key"]
consumer_secret_key = secret["consumer_secret_key"]

"""
This function fetch and encrypts the API keys per instructions in OPS v3.2 documentation
"""


def authorization():
    # encode the keys into base64 representation
    combined_string = f"{consumer_key}:{consumer_secret_key}"

    b = base64.b64encode(bytes(combined_string, 'utf-8'))  # bytes
    base64_key = b.decode('utf-8')

    # request access token
    headers = {"Authorization": base64_key,
               "Content-Type": "application/x-www-form-urlencoded"}
    payload = {"grant_type": "client_credentials"}
    response = requests.post(
        url=ACCESS_AUTH_URL, headers=headers, data=payload)
    access_token = response.json()["access_token"]
    return access_token


"""
This function will fetch all the patents contains in the search results, and store the results in
CSV format inside an S3 Bucket
"""


def fetch_all_equivalent_patent_data():

    global col_dict
    df_patent = pd.read_csv(fetchFromS3(TEMP_BUCKET_NAME, FILE_PATH))
    patent_publications = df_patent["publication_number"].values.tolist()

    for idx, publication_number in enumerate(patent_publications):
        
        # refresh access token after 100 entries fetches
        # every token expires after 20 minutes
        if idx % 100 == 0:
            access_token = authorization()
        headers = {"Authorization": f"Bearer {access_token}",
                   "Accept": "application/json"}
        OPS_SEARCH_URL = f"http://ops.epo.org/3.2/rest-services/published-data/publication/docdb/{publication_number}/equivalents/biblio"
        
        try:
            response = requests.get(
                url=OPS_SEARCH_URL, headers=headers)
            searchResult = response.json()[
                'ops:world-patent-data']['ops:equivalents-inquiry']['ops:inquiry-result']
        except json.decoder.JSONDecodeError as e:
            if "CLIENT.RobotDetected" in response.text:
                print("RobotDetected during fetching patent data")
                time.sleep(60)
                try:
                    response = requests.get(
                        url=OPS_SEARCH_URL, headers=headers)
                    searchResult = response.json()[
                        'ops:world-patent-data']['ops:equivalents-inquiry']['ops:inquiry-result']
                except json.decoder.JSONDecodeError as e:
                    print("RobotDetected again, exiting!")
                    raise SystemExit

        for document in searchResult:
            
            # weird bug
            if document in ["publication-reference", "exchange-documents"]:
                continue
            
            publication_number = ""
            title = ""  # invention title
            applicants = []  # list of applicant names
            publication_date = ""
            inventors = []  # list of inventor names
            family_number = document['exchange-documents']['exchange-document']['@family-id']
            cpc = []  # list of cpc numbers
            country_code = ""
            kind_code = ""

            bib_data = document['exchange-documents']["exchange-document"]['bibliographic-data']

            # extract publication_number, publication_date, country_code, kind_code
            if type(bib_data['publication-reference']['document-id']) is list:
                for doc_id in bib_data['publication-reference']['document-id']:
                    if doc_id['@document-id-type'] == 'docdb':
                        country = doc_id['country']['$']
                        number = doc_id['doc-number']['$']
                        kind = doc_id['kind']['$']
                        publication_number = country + number + kind
                        publication_date = doc_id['date']['$']
                        country_code = country
                        kind_code = kind
            else:
                doc_id = bib_data['publication-reference']['document-id']
                country = doc_id['country']['$']
                number = doc_id['doc-number']['$']
                kind = doc_id['kind']['$']
                publication_number = country + number + kind
                publication_date = doc_id['date']['$']
                country_code = country
                kind_code = kind

            # extract cpc (patent classification)
            if 'patent-classification' in bib_data['patent-classifications'].keys():
                if type(bib_data['patent-classifications']['patent-classification']) is list:
                    for clf in bib_data['patent-classifications']['patent-classification']:
                        if clf['classification-scheme']['@scheme'] == 'CPCI':
                            if clf['section']['$'] not in cpc:
                                cpc.append(clf['section']['$'])
                            # cpc = cpc + clf['section']['$'] + ","
                else:
                    cpc.append(bib_data['patent-classifications']
                              ['patent-classification']['section']['$'])
            else:
                cpc.append("")

            # extract invention title
            if 'invention-title' not in bib_data.keys():
                continue
            if type(bib_data['invention-title']) is list:
                # append only the english title
                for ttl in bib_data['invention-title']:
                    if ttl['@lang'] == 'en':
                        title = ttl['$']
            else:
                title = bib_data['invention-title']['$']

            # extract applicants
            if 'applicants' not in bib_data['parties'].keys():
                continue
            if type(bib_data['parties']['applicants']['applicant']) is list:
                for app in bib_data['parties']['applicants']['applicant']:
                    if app['@data-format'] == 'original':
                        applicants.append(app['applicant-name']['name']['$'])
            else:
                applicants.append(
                    bib_data['parties']['applicants']['applicant']['applicant-name']['name']['$'])

            # extract inventors
            if 'inventors' not in bib_data['parties'].keys():
                continue
            elif type(bib_data['parties']['inventors']["inventor"]) is list:
                for inv in bib_data['parties']['inventors']['inventor']:
                    if inv['@data-format'] == 'original':
                        inventors.append(inv['inventor-name']['name']['$'])
            else:
                inventors.append(
                    bib_data['parties']['inventors']['inventor']['inventor-name']['name']['$'])

            # append everything to a dictionary
            col_dict["publication_number"].append(
                publication_number)  # append docdb number
            col_dict["title"].append(title)
            col_dict["inventors"].append(inventors)
            col_dict["applicants"].append(applicants)
            col_dict["publication_date"].append(publication_date)
            col_dict['family_number'].append(family_number)
            col_dict['cpc'].append(cpc)
            col_dict["country_code"].append(country_code)
            col_dict["kind_code"].append(kind_code)

        # sleep for 2 seconds to avoid throttling
        # max 30 queries per minutes with this setting
        time.sleep(2)


col_dict = {"publication_number": [], "title": [], "inventors": [],
            "applicants": [], "publication_date": [], "family_number": [],
            "cpc": [], "country_code": [], "kind_code": []}


# script entry point
def main(argv):

    global col_dict

    try:
        fetch_all_equivalent_patent_data()
        print(f"Fetching equivalent patent data process completed successfully!")
    except SystemExit:
        print(
            f"API fetching process exited early. Saving entries we currently have into s3.")
    finally:
        df = pd.DataFrame(col_dict)
        df = df[(df.country_code.str.contains("US")) | (df.country_code.str.contains("CA"))]
        total_patent_count = len(df.index)
        
        FILE_PATH = f"epo/patent_data_raw_from_source/equivalents/patents_equivalents_{total_patent_count}.csv"
        putToS3(df, TEMP_BUCKET_NAME, FILE_PATH)
        print(f"Finish saving {total_patent_count} entries to s3")

        # start downstream Glue Job
        arguments = {
            "--TEMP_BUCKET_NAME": TEMP_BUCKET_NAME,
            "--FILE_PATH": FILE_PATH,
            "--EQUIVALENT": "true"
        }
        glue_client.start_job_run(
            JobName="expertiseDashboard-cleanEpoPatents",
            Arguments=arguments
        )


if __name__ == "__main__":
    main(sys.argv)
