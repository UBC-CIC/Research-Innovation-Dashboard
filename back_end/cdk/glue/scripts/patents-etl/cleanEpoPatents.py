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
from datetime import datetime
from custom_utils.utils import fetchFromS3, putToS3
from awsglue.utils import getResolvedOptions


# define job parameters
args = getResolvedOptions(
    sys.argv, ["TEMP_BUCKET_NAME", "EPO_INSTITUTION_NAME", "FILE_PATH"])
TEMP_BUCKET_NAME = args["TEMP_BUCKET_NAME"]
EPO_INSTITUTION_NAME = args["EPO_INSTITUTION_NAME"]
FILE_PATH = args["FILE_PATH"]

# clients
glue_client = boto3.client("glue")

"""
This function take a string representation of a list and turn it into an actual list
Example: "['Tien', 'Nguyen']" -> ["Tien", "Nguyen"]
@param row: str, a string representation of a list
@return: list object
"""


def format_list_column(row):
    regex = r"\(.*\)"
    # parse string representation of list into actual list
    name_list = ast.literal_eval(row)
    names = []
    for name in name_list:
        if re.search(regex, name):
            name = re.sub(regex, "", name)
        names.append(name)
    return names


"""
This function takes in an applicant name and format it
@param name: str, the name
@return str, the formatted name
"""


def format_applicant_column(name):
    # name of university or company
    if re.search(r".*(univ).*", name, flags=re.I) or re.search(r".*(inc).*", name, flags=re.I):
        return name.strip().replace(",", "").upper()
    elif name.rstrip(",").count(",") >= 1:  # name of a person in the form last, first
        last_n = name.split(",", 1)[0].replace(",", "")
        first_n = name.split(",", 1)[1].replace(",", "")
        return (first_n + " " + last_n).upper()
    return name.strip().replace(",", "").upper()


"""
This function takes in a classification letter and match it with the correct category
@param cpc: str, the CPC letter
@return: str, the corresponding category
"""


def format_cpc_column(cpc):
    cpc_dict = {
        "A": "Human necessities",
        "B": "Performing operations; transporting",
        "C": "Chemistry; metallurgy",
        "D": "Textiles; paper",
        "E": "Fixed constructions",
        "F": "Mechanical engineering; lighting; heating; weapons; blasting engines or pumps",
        "G": "Physics",
        "H": "Electricity",
        "Y": "General tagging of new technological developments; general tagging of cross-sectional technologies spanning over several sections of the IPC; technical subjects covered by former USPC cross-reference art collections [XRACs] and digests"
    }
    if cpc in cpc_dict.keys():
        return cpc_dict[cpc]
    return ""


"""
This function takes a name string and format it approriately:
  if the name is blank, then first_n and last_n is NaN
  if the name contains one or more comma, then split on first comma
  if the name contains 0 comma, then split on first space if contains more than 1 space
@param name: str, the name of the inventor
@return first_n, last_n: str, 2 values correspond to first/last name splitted from original name
"""


def format_name_column(name):
    # print(name)
    last_n = np.nan
    first_n = np.nan

    if name == np.nan:
        return first_n, last_n

    elif name.count(",") >= 1:  # fn and ln seprated with comma
        last_n = name.split(",", 1)[0].strip().title()
        first_n = name.split(",", 1)[1].strip().title()

    elif name.count(",") == 0:
        if name.count(" ") >= 1:  # fn and ln separated with space
            last_n = name.split(" ", 1)[0].strip().title()
            first_n = name.split(" ", 1)[1].strip().title()
    return first_n, last_n


def clean_epo_patent():

    global FILE_PATH

    df = pd.read_csv(fetchFromS3(TEMP_BUCKET_NAME, FILE_PATH))

    # string -> list of string
    df["applicants"] = df["applicants"].apply(lambda x: format_list_column(x))
    # explode applicants in the list into individual row
    df = df.explode(column="applicants")
    # drop rows that has no applicants
    df['applicants'].replace('', np.nan, inplace=True)
    df = df[df["applicants"].notna()]
    # clean the applicant names
    df["applicants"] = df.apply(
        lambda x: format_applicant_column(x["applicants"]), axis=1)
    # recombine applicants into one comma-separated string
    group = ["publication_number", "title", "inventors", "publication_date",
             "family_number", "cpc", "country_code", "kind_code"]
    df = df.groupby(group, as_index=False).aggregate(
        {
            "applicants": lambda x: ', '.join(x)
        }
    )

    # string -> list of string
    df["cpc"] = df["cpc"].apply(lambda x: format_list_column(x))
    # explode cpc number into individual rows
    df = df.explode(column="cpc")
    # clean cpc column
    df["cpc"] = df.apply(lambda x: format_cpc_column(x["cpc"]), axis=1)
    # recombine cpc category into one comma-separated string
    group = ["publication_number", "title", "inventors", "publication_date",
             "family_number", "applicants", "country_code", "kind_code"]
    df = df.groupby(group, as_index=False).aggregate(
        {
            "cpc": lambda x: ', '.join(x)
        }
    )

    # string -> list of string
    df["inventors"] = df["inventors"].apply(lambda x: format_list_column(x))
    # explode name in the list into individual row
    df = df.explode(column="inventors")
    # drop rows that has no inventors
    df['inventors'].replace('', np.nan, inplace=True)
    df = df[df["inventors"].notna()]
    # strip trailing comma on the right of the name string
    df["inventors"] = df["inventors"].str.rstrip(",")
    # format names to get first name and last name
    df["first_name"], df["last_name"] = zip(
        *df['inventors'].map(format_name_column))

    # format datetime
    dates = pd.to_datetime(df["publication_date"], format='%Y%m%d')
    df["publication_date"] = dates.dt.strftime('%Y-%b-%d')

    # format title to title format
    df["title"] = df["title"].str.title()

    # datetime object containing current date and time
    # now = datetime.now()
    # print("now =", now)
    # # dd/mm/YY H:M:S
    # dt_string = now.strftime("%d-%m-%Y_%H-%M-%S")
    # print("date and time =", dt_string)

    # saving file with some datetime information for logging/debugging purpose
    FILE_PATH = f"epo/patent_data_clean/patents_clean.csv"
    putToS3(df, TEMP_BUCKET_NAME, FILE_PATH)
    print(f"Saved file at {TEMP_BUCKET_NAME}/{FILE_PATH}")

# script entry point
def main(argv):

    global FILE_PATH

    clean_epo_patent()

    # start downstream job
    arguments = {
        "--TEMP_BUCKET_NAME": TEMP_BUCKET_NAME,
        "--FILE_PATH": FILE_PATH
    }
    glue_client.start_job_run(
        JobName="assignIdsEpoPatents",
        Arguments=arguments
    )


if __name__ == "__main__":
    main(sys.argv)
