import sys
import json
import io
import pandas as pd
import numpy as np
import boto3

# define bucket for the raw/clean csv data

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
"""
def putToS3(df, bucket, key):

    # create a buffer to write csv data to
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False) # avoid pandas saving an extra index column
    
    # put buffered data into the clean S3 bucket
    s3_bucket_clean = boto3.resource('s3')
    response = s3_bucket_clean.Object(bucket, key).put(Body=csv_buffer.getvalue())
    
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
    df["First Name"] = df["First Name"].str.replace(" ","", 1)
    df["Last Name"] = df["Name"].str.split(",", expand=True)[0]
    
    # add Department column
    df["Department"] = np.nan
    
    # add Agency column with string NSERC
    df["Agency"] = "NSERC"
    
    # rename Program column to Grant Program
    df["Grant Program"] = df["Program"]
    
    # remove comma and convert Amount to integer
    df["Amount($)"] = df["Amount($)"].str.replace(",","")
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

    putToS3(df=df, key=key_clean)


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
    df = df[df["Administrating Organization"] == "University of British Columbia"]
    
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
    
    df["Program Code"] = df["Program Code"].str.replace(",", "", 1) # remove comma
    df = df.merge(right=df_program_codes, left_on="Program Code", right_on="Code", how="left")
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

    putToS3(df=df, key=key_clean)


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
    df = df[df[col_dict["Institution"]] == "The University of British Columbia"]
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
    
    putToS3(bucket=bucket, key=key_clean)