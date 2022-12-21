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
    sys.argv, ["BUCKET_NAME", "FILENAME_RAW", "FILENAME_CLEAN", "PROGRAM_CODE_KEY"])
BUCKET_NAME = args["BUCKET_NAME"]
FILENAME_RAW = args["FILENAME_RAW"]
FILENAME_CLEAN = args["FILENAME_CLEAN"]
PROGRAM_CODE_KEY = args["PROGRAM_CODE_KEY"]


def cleanSshrc(bucket, key_raw, key_clean, key_program_codes):

    raw_data = fetchFromS3(bucket=bucket, key=key_raw)
    program_codes = fetchFromS3(bucket=bucket, key=key_program_codes)

    # read raw data into a pandas DataFrame
    df = pd.read_csv(raw_data, skiprows=2, skipfooter=2, header=0)

    # split Name into fname and lname, then drop original column
    df["First Name"] = df["Applicant"].str.split(",", expand=True)[1]
    df["First Name"] = df["First Name"].str.replace(" ", "", 1)
    #df["First Name"] = df["First Name"].str.replace(" ", "", 1)
    df["Last Name"] = df["Applicant"].str.split(",", expand=True)[0]

    # add Department column
    df["Department"] = np.nan

    # add a column called Agency and populate with string SSHRC
    df["Agency"] = "SSHRC"

    # add a column called Program and match value
    df_program_codes = pd.read_csv(program_codes)
    df_program_codes["Code"] = df_program_codes["Code"].astype(str)

    df["Program Code"] = df["Program Code"].str.replace(
        ",", "", 1)  # remove comma
    df = df.merge(right=df_program_codes, left_on="Program Code",
                  right_on="Code", how="left")
    df["Grant Program"] = df["Funding Opportunities"]

    # remove comma, $ and convert Amount to integer
    df["Amount ($)"] = df["Amount ($)"].str.replace(",", "")
    df["Amount ($)"] = df["Amount ($)"].str.replace("$", "", regex=False)
    df["Amount ($)"] = pd.to_numeric(df["Amount ($)"]).astype(int)
    df["Amount"] = df["Amount ($)"]

    # new column Project Title
    df["Project Title"] = df["Title of project"]

    # new Keywords column with nan
    df["Keywords"] = np.nan

    # new column Year
    df["Year"] = df["Fiscal Year"]

    # new column Start Date
    df["Start Date"] = np.nan

    # new column End Date
    df["End Date"] = np.nan

    # remove redundant columns
    redundant = ["Applicant", "Administrating Organization", "Title of project", "Amount ($)",
                 "Fiscal Year", "Program Code", "Code", "Funding Opportunities"]
    df = df.drop(columns=redundant)

    putToS3(df, key=key_clean, bucket=bucket)


# function call
cleanSshrc(BUCKET_NAME, FILENAME_RAW, FILENAME_CLEAN, PROGRAM_CODE_KEY)
