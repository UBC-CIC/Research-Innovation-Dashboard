import sys
import json
import io
import pandas as pd
import numpy as np
import boto3
from awsglue.utils import getResolvedOptions


# define job parameters
args = getResolvedOptions(sys.argv, ["BUCKET_NAME", "FILENAME_RAW", "FILENAME_CLEAN", "PROGRAM_CODE_KEY"])
BUCKET_NAME = args["BUCKET_NAME"]
FILENAME_RAW = args["FILENAME_RAW"]
FILENAME_CLEAN = args["FILENAME_CLEAN"]
PROGRAM_CODE_KEY = args["PROGRAM_CODE_KEY"]

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
This function will convert a year value from integer 201920 to string "2019-2020"
IMPORTANT: this function assumes that the upper end of the year range is any year in the 2000s
:param year: integer, the year value
:return: string, the formatted year value string
"""


def cleanYearValue(year):
    year = str(year)
    clean_year = year[0:4] + "-20" + year[4:]
    return clean_year


"""
This function will clean the PI Names column and append the cleaned first / last name into
their respective column. Also will append the rest of the columns that do not need to be clean
into the new clean DataFrame
:param nameCell: string, the name string
:param firstNamesColumn: list, the column for the clean first name
:param lastNamesColumn: list, the column for the clean last name
:param row: tuple, a corresponding row in the DataFrame
:param cleanDataFrame: Pandas DataFrame, the target clean DataFrame
"""


def cleanNameColumn(nameCell, firstNamesColumn, lastNamesColumn, row, cleanDataFrame):
    # If the cell is not null
    if pd.notna(nameCell):
        # Chir Data has names split by ; so split on ; to get list of names
        namesArray = nameCell.split(";")
        firstNames = ''
        lastNames = ''
        for name in namesArray:
            # Each name is last, first middle
            # Split on comma to split up last and first/middle
            splitName = name.split(", ")
            lastName = splitName[0]
            # The first name is always the first word in the first/middle when split on space
            firstName = splitName[1].split(" ")[0]

            cleanDataFrame.loc[len(cleanDataFrame.index)] = [firstName, lastName, row[4],
                                                             row[5], row[8], row[9], row[14], row[10], row[13], row[15], row[11], row[12]]


"""
This function will fetch the raw CIHR data from the raw S3 bucket, clean it, and put the clean data
into the corresponding clean S3 bucket
:param bucket: the name of the target bucket
:param key_raw: the key (path) to the raw csv file
:param key_clean: the key(path) to a clean csv file after transformation
"""


def cleanCihr(bucket, key_raw, key_clean):

    # Get CSV file from S3 bucket
    raw_data = fetchFromS3(bucket=bucket, key=key_raw)
    df = pd.read_csv(raw_data, header=0)

    firstNames = []
    lastNames = []

    # Create New Dataframe
    df_clean = pd.DataFrame(columns=["First Name", "Last Name", "Institution", "Department", "Agency",
                                     "Grant Program", "Amount", "Project Title", "Keywords", "Year", "Start Date", "End Date"])

    # Cleans data and stores in new data frame
    for row in df.itertuples():
        cleanNameColumn(row[1], firstNames, lastNames, row, df_clean)

    # Modify format of Year column
    df_clean["Year"] = df_clean.apply(
        lambda x: cleanYearValue(x["Year"]), axis=1)

    # Cast the Amount column as Integer
    df_clean["Amount"] = df_clean["Amount"].astype(int)

    # Store CSV file to S3
    putToS3(df=df_clean, key=key_clean, bucket=bucket)


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


"""
This function will clean the SSHRC data by splitting column Name into First_name and 
Last_name, modidy the name of other columns, drop unused(duplicate) columns and 
write the final csv file to a destination s3 bucket location.

:param bucket: the name of the target bucket
:param key_raw: the key (path) to the raw csv file
:param key_clean: the key(path) to a clean csv file after transformation
:param key_program_codes: the key(path) to a csv file of the program codes
:return: none
"""


def cleanSshrc(bucket, key_raw, key_clean, key_program_codes):

    raw_data = fetchFromS3(bucket=bucket, key_raw=key_raw)
    program_codes = fetchFromS3(bucket=bucket, key_raw=key_program_codes)

    # read raw data into a pandas DataFrame
    df = pd.read_csv(raw_data, skiprows=2, skipfooter=2, header=0)

    # filter for University of British Columbia
    df = df[df["Administrating Organization"]
            == "University of British Columbia"]

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
    # filter for University of British Columbia only
    df = df[df[col_dict["Institution"]] ==
            "The University of British Columbia"]
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

    # Year column
    df["Year"] = ""

    # Start Date column
    df["Start Date"] = df[col_dict["Start Date"]]

    # End Date column
    df["End Date"] = ""

    # drop redundant columns
    df = df.drop(columns=orig_colnames)

    putToS3(df,bucket, key=key_clean)