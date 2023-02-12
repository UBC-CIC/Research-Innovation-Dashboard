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
    sys.argv, ["TEMP_BUCKET_NAME", "EPO_INSTITUTION_NAME", "API_SECRET_NAME"])
TEMP_BUCKET_NAME = args["TEMP_BUCKET_NAME"]
API_SECRET_NAME = args["API_SECRET_NAME"]
EPO_INSTITUTION_NAME = args["EPO_INSTITUTION_NAME"]
ACCESS_AUTH_URL = "https://ops.epo.org/3.2/auth/accesstoken"
OPS_SEARCH_URL = "http://ops.epo.org/3.2/rest-services/published-data/search/biblio"

# get API credentials
glue_client = boto3.client("glue")
sm_client = boto3.client("secretsmanager")
secret = json.loads(sm_client.get_secret_value(
    SecretId=API_SECRET_NAME)["SecretString"])
consumer_key = secret["consumer_key"]
consumer_secret_key = secret["consumer_secret_key"]

"""
This function fetch and encrypts the API keys per instructions in OPS v3.2 documentation
"""


def authorization():
    # encode the keys into base64 representation
    combined_string = f"{consumer_key}:{consumer_secret_key}"
    print(combined_string)

    b = base64.b64encode(bytes(combined_string, 'utf-8'))  # bytes
    base64_key = b.decode('utf-8')
    print(base64_key)

    # request access token
    headers = {"Authorization": base64_key,
               "Content-Type": "application/x-www-form-urlencoded"}
    payload = {"grant_type": "client_credentials"}
    response = requests.post(
        url=ACCESS_AUTH_URL, headers=headers, data=payload)
    access_token = response.json()["access_token"]
    # print(response.json())
    return access_token


"""
This function fetch the count (total number of patents) for the search results from the API query
@return: int, the count
"""


def get_patent_count():

    access_token = authorization()
    headers = {"Authorization": f"Bearer {access_token}",
               "Accept": "application/json"}
    payload = {"Range": "1-1",
               "q": f'(ia="{EPO_INSTITUTION_NAME}" and pd>=2001) and (pn=CA or pn=US)'}
    # encode space as %20 instead of + per OPS v3.2 API reference
    params = urllib.parse.urlencode(payload, quote_via=urllib.parse.quote)

    try:
        response = requests.get(
            url=OPS_SEARCH_URL, headers=headers, params=params)
        response_json = response.json()
    except json.decoder.JSONDecodeError as e:
        if "CLIENT.RobotDetected" in response.text:
            print("RobotDetected during fetching total patent count")
            time.sleep(60)
            try:
                response = requests.get(
                    url=OPS_SEARCH_URL, headers=headers, params=params)
                response_json = response.json()
            except json.decoder.JSONDecodeError as e:
                print("RobotDetected again, exiting!")
                raise SystemExit

    # get the patent count in year 2022
    patent_count = response_json['ops:world-patent-data']['ops:biblio-search']['@total-result-count']
    print(f"patent count is: {patent_count}")
    return int(patent_count)


"""
This function will fetch all the patents contains in the search results, and store the results in
CSV format inside an S3 Bucket
"""


def fetch_all_patent_data():

    patent_count = get_patent_count()
    global col_dict

    # adjust Range parameter in API query to query as many patent with fewest API calls as possible
    # we round the number of patent up to the nearest hundred, since the api does not return anything for index number
    # larger than total patent count
    # also Range can be as most 100, which means we can retrieve up to 100 patents per api call
    upperbound = math.ceil(patent_count/100)*100
    current_lowerbound = 1

    for i in range(1, int(upperbound/100) + 1):

        access_token = authorization()
        headers = {"Authorization": f"Bearer {access_token}",
                   "Accept": "application/json"}
        payload = {"Range": f"{current_lowerbound}-{i*100}",
                   "q": f'(ia="{EPO_INSTITUTION_NAME}" and pd>=2001) and (pn=CA or pn=US)'}
        # encode space as %20 instead of + per OPS v3.2 API reference
        params = urllib.parse.urlencode(payload, quote_via=urllib.parse.quote)

        try:
            response = requests.get(
                url=OPS_SEARCH_URL, headers=headers, params=params)
            searchResult = response.json()[
                'ops:world-patent-data']['ops:biblio-search']['ops:search-result']['exchange-documents']
        except json.decoder.JSONDecodeError as e:
            if "CLIENT.RobotDetected" in response.text:
                print("RobotDetected during fetching patent data")
                time.sleep(60)
                try:
                    response = requests.get(
                        url=OPS_SEARCH_URL, headers=headers, params=params)
                    searchResult = response.json()[
                        'ops:world-patent-data']['ops:biblio-search']['ops:search-result']['exchange-documents']
                except json.decoder.JSONDecodeError as e:
                    print("RobotDetected again, exiting!")
                    raise SystemExit

        for document in searchResult:

            publication_number = ""
            title = ""  # invention title
            applicants = []  # list of applicant names
            publication_date = ""
            inventors = []  # list of inventor names
            family_number = document['exchange-document']['@family-id']
            cpc = []  # list of cpc numbers
            country_code = ""
            kind_code = ""

            bib_data = document['exchange-document']['bibliographic-data']

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
            if type(bib_data['invention-title']) is list:
                # append only the english title
                for ttl in bib_data['invention-title']:
                    if ttl['@lang'] == 'en':
                        title = ttl['$']
            else:
                title = bib_data['invention-title']['$']

            # extract applicants
            if type(bib_data['parties']['applicants']['applicant']) is list:
                for app in bib_data['parties']['applicants']['applicant']:
                    if app['@data-format'] == 'original':
                        applicants.append(app['applicant-name']['name']['$'])
            else:
                applicants.append(
                    bib_data['parties']['applicants']['applicant']['applicant-name']['name']['$'])

            # extract inventors
            if 'inventors' not in bib_data['parties'].keys():
                inventors.append("")
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

        current_lowerbound += 100


col_dict = {"publication_number": [], "title": [], "inventors": [],
            "applicants": [], "publication_date": [], "family_number": [],
            "cpc": [], "country_code": [], "kind_code": []}


# script entry point
def main(argv):

    global col_dict

    try:
        fetch_all_patent_data()
        print(f"Fetching patent data process completed successfully!")
    except SystemExit:
        print(
            f"API fetching process exited early. Saving entries we currently have into s3.")
    finally:
        # datetime object containing current date and time
        # now = datetime.now()
        # print("now =", now)
        # # dd/mm/YY H:M:S
        # dt_string = now.strftime("%d-%m-%Y_%H-%M-%S")
        # print("date and time =", dt_string)

        df = pd.DataFrame(col_dict)
        total_patent_count = len(df.index)
        
        FILE_PATH = f"epo/patent_data_raw_from_source/patents_{total_patent_count}.csv"
        putToS3(df, TEMP_BUCKET_NAME, FILE_PATH)
        print(f"Finish saving {total_patent_count} entries to s3")

        # start downstream Glue Job
        arguments = {
            "--TEMP_BUCKET_NAME": TEMP_BUCKET_NAME,
            "--FILE_PATH": FILE_PATH
        }
        glue_client.start_job_run(
            JobName="cleanEpoPatents",
            Arguments=arguments
        )


if __name__ == "__main__":
    main(sys.argv)
