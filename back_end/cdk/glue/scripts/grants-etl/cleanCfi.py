import sys
import json
import io
import pandas as pd
import numpy as np
import boto3
from custom_utils.utils import fetchFromS3, putToS3
from awsglue.utils import getResolvedOptions


# define job parameters
args = getResolvedOptions(
    sys.argv, ["BUCKET_NAME", "FILENAME_RAW", "FILENAME_CLEAN", "CFI_INSTITUTION_NAME"])
BUCKET_NAME = args["BUCKET_NAME"]
FILENAME_RAW = args["FILENAME_RAW"]
FILENAME_CLEAN = args["FILENAME_CLEAN"]
CFI_INSTITUTION_NAME = args["CFI_INSTITUTION_NAME"]


"""
This function will clean the SSHRC data by splitting column Name into First_name and 
Last_name, modidy the name of other columns, drop unused(duplicate) columns and 
write the final csv file to a destination s3 bucket location.

:param bucket: the name of the target bucket
:param key_raw: the key (path) to the raw csv file
:param key_clean: the key(path) to a clean csv file after transformation
:return: none
"""


def cleanCfi(bucket, key_raw, key_clean):

    raw_data = fetchFromS3(bucket=bucket, key=key_raw)

    # read raw data into a pandas DataFrame
    df = pd.read_csv(raw_data, skiprows=1, header=0)

    # drop the empty column
    df = df.drop(columns=["Unnamed: 1"])

    # name dictionary to map our schema column names to original column name
    # since it's easier to refer to the column name with french alphabetics
    colnames = list(df)
    col_dict = {
        "Name": colnames[3],
        "Institution": colnames[1],
        "Department": colnames[9],
        "Grant Program": colnames[2],
        "Amount": colnames[5],
        "Project Title": colnames[4],
        "Keywords": colnames[7],
        "Start Date": colnames[6]
    }
    # new_colnames = list(col_dict.keys())
    orig_colnames = list(col_dict.values())

    # retain only the neccesary columns
    # filter for the correct institution only
    # since CFI is bulk data so it contains different institutions
    df = df[df[col_dict["Institution"]] == CFI_INSTITUTION_NAME]
    df = df[orig_colnames]

    # split Name into First/Last
    df["First Name"] = df[col_dict["Name"]].str.split(",", expand=True)[1]
    df["First Name"] = df["First Name"].str.replace(" ", "", 1)
    df["Last Name"] = df[col_dict["Name"]].str.split(",", expand=True)[0]

    # Department column
    df["Department"] = df[col_dict["Department"]]

    # add Agency column
    df["Agency"] = "CFI"

    # Grant Program column
    df["Grant Program"] = df[col_dict["Grant Program"]]

    # Amount column
    df["Amount"] = df[col_dict["Amount"]].str.replace(",", "")
    df["Amount"] = df["Amount"].str.replace("$", "", regex=False)
    df["Amount"] = pd.to_numeric(df["Amount"]).astype(int)

    # Project Title column
    df["Project Title"] = df[col_dict["Project Title"]]

    # Keywords column
    df["Keywords"] = df[col_dict["Keywords"]]

    # Start Date column
    df["Start Date"] = pd.to_datetime(df[col_dict["Start Date"]])
    df["Start Date"] = df["Start Date"].dt.strftime("%d-%b-%Y")
    
    # Year column
    df["Year"] = pd.to_datetime(df["Start Date"]).dt.strftime("%Y")

    # End Date column
    df["End Date"] = ""

    # drop redundant columns
    df = df.drop(columns=orig_colnames)

    putToS3(df, bucket, key=key_clean)


# function call
cleanCfi(BUCKET_NAME, FILENAME_RAW, FILENAME_CLEAN)
