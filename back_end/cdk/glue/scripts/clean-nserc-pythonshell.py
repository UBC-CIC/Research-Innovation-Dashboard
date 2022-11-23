import sys
import json
import io
import pandas as pd
import numpy as np
import boto3
from awsglue.utils import getResolvedOptions


# define job parameters
args = getResolvedOptions(sys.argv, ["BUCKET_NAME", "FILENAME_RAW", "FILENAME_CLEAN"])
BUCKET_NAME = args["BUCKET_NAME"]
FILENAME_RAW = args["FILENAME_RAW"]
FILENAME_CLEAN = args["FILENAME_CLEAN"]

"""
Fetch the raw csv data from s3
:param bucket: str, the name of the target bucket
:param key_raw: str, the key (path) to the raw csv file
:return StringIO file-like object
"""


def fetchFromS3(bucket, key):

    # get the raw csv file from S3
    s3 = boto3.resource('s3')
    s3_bucket_raw = s3.Object(bucket, key)
    response = s3_bucket_raw.get()

    # extract the raw data from the response Body
    raw_data_from_s3 = response["Body"]

    return io.StringIO(raw_data_from_s3.read().decode("utf-8"))


"""
Put a Pandas DataFrame to the target S3 bucket & folder as a csv file
:param df: Pandas DataFrame, the clean df
:param bucket: string, the bucket name
:param key: string, the path to the clean file
"""


def putToS3(df, bucket, key):

    # create a buffer to write csv data to
    csv_buffer = io.StringIO()
    # avoid pandas saving an extra index column
    df.to_csv(csv_buffer, index=False)

    # put buffered data into the clean S3 bucket
    s3_bucket_clean = boto3.resource('s3')
    response = s3_bucket_clean.Object(
        bucket, key).put(Body=csv_buffer.getvalue())

    status = response.get("ResponseMetadata", {}).get("HTTPStatusCode")

    if status == 200:
        print(f"Successful S3 put_object response. Status - {status}")
    else:
        print(f"Unsuccessful S3 put_object response. Status - {status}")

"""
This function will clean the NSERC data by splitting column Name into First_name and 
Last_name, modidy the name of other columns, drop unused(duplicate) columns and 
write the final csv file to a destination s3 bucket location.

:param bucket: the name of the target bucket
:param key_raw: the key (path) to the raw csv file
:param key_clean: the key(path) to a clean csv file after transformation
:return: none
"""


def cleanNserc(bucket, key_raw, key_clean):

    raw_data = fetchFromS3(bucket=bucket, key=key_raw)

    # read raw data into a pandas DataFrame
    df = pd.read_csv(raw_data, skiprows=3, header=0)

    # split Name into fname and lname
    df["First Name"] = df["Name"].str.split(",", expand=True)[1]
    df["First Name"] = df["First Name"].str.replace(" ", "", 1)
    df["Last Name"] = df["Name"].str.split(",", expand=True)[0]

    # add Department column
    df["Department"] = np.nan

    # add Agency column with string NSERC
    df["Agency"] = "NSERC"

    # rename Program column to Grant Program
    df["Grant Program"] = df["Program"]

    # remove comma and convert Amount to integer
    df["Amount($)"] = df["Amount($)"].str.replace(",", "")
    df["Amount($)"] = pd.to_numeric(df["Amount($)"])
    df["Amount"] = df["Amount($)"]

    # add Keywords column
    df["Keywords"] = np.nan

    # rename Project Title and Fiscal Year columns
    df["Year"] = df["Fiscal Year"]

    # add Start Date and End Date column
    df["Start Date"] = np.nan
    df["End Date"] = np.nan

    # drop old columns
    df = df.drop(columns=["Program", "Fiscal Year", "Name", "Amount($)"])

    putToS3(df=df, key=key_clean, bucket=bucket)


# function call
cleanNserc(BUCKET_NAME, FILENAME_RAW, FILENAME_CLEAN)