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


# define job parameters
args = getResolvedOptions(
    sys.argv, ["TEMP_BUCKET_NAME", "EPO_INSTITUTION_NAME", "FILE_PATH", "DB_SECRET_NAME"])
TEMP_BUCKET_NAME = args["TEMP_BUCKET_NAME"]
EPO_INSTITUTION_NAME = args["EPO_INSTITUTION_NAME"]
FILE_PATH = args["FILE_PATH"]
DB_SECRET_NAME = args["DB_SECRET_NAME"]


def storePatentData():

    global FILE_PATH
    df_id = pd.read_csv(fetchFromS3(TEMP_BUCKET_NAME, FILE_PATH))
    df_id["inventors_assigned_ids"] = df_id["inventors_assigned_ids"].apply(
        lambda x: ast.literal_eval(x))

    # retain row with inventor ids
    df_id["id_count"] = df_id.apply(
        lambda x: len(x["inventors_assigned_ids"]), axis=1)
    df_id = df_id[df_id.id_count > 0]
    # rearrange columns order
    columns_order = ['publication_number', 'country_code', 'kind_code', 'title', 'inventors',
                     'applicants', 'family_number', 'cpc', 'publication_date', 'inventors_assigned_ids']
    df_id = df_id[columns_order]
    # cast family_number as str
    df_id["family_number"] = df_id["family_number"].astype(str)

    # secretsmanager client to get db credentials
    sm_client = boto3.client("secretsmanager")
    response = sm_client.get_secret_value(
        SecretId=DB_SECRET_NAME)["SecretString"]
    secret = json.loads(response)

    connection = psycopg2.connect(
        user=secret["username"],
        password=secret["password"],
        host=secret["host"],
        dbname=secret["dbname"]
    )
    cursor = connection.cursor()
    print("Successfully connected to database")

    # # clear data from table (for testing)
    # query = "TRUNCATE patent_data"
    # cursor.execute(query)
    
    # query = """CREATE TABLE IF NOT EXISTS public.patent_data (
    #   patent_id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    #   patent_number varchar,
    #   patent_country_code,
    #   patent_kind_code,
    #   patent_title varchar,
    #   patent_inventors varchar,
    #   patent_sponsors varchar,
    #   patent_family_number varchar,
    #   patent_classification varchar,
    #   patent_publication_date varchar,
    #   inventors_assigned_ids varchar[]
    # );"""

    # cursor.execute(query)
    # connection.commit()

    # check for duplicate insertion
    schema = """patent_number, patent_country_code, patent_kind_code, patent_title, patent_inventors, patent_sponsors, 
                patent_family_number, patent_classification, patent_publication_date, inventors_assigned_ids"""
    

    query = f"SELECT {schema} FROM public.patent_data"
    cursor.execute(query)
    tableData = cursor.fetchall()
    df_database = pd.DataFrame(tableData, columns=columns_order)
    # combine both dataframe into one, then drop all duplicates column
    df_insert = pd.concat([df_id, df_database], axis=0).drop_duplicates(subset=["family_number", "publication_number", "publication_date"], keep=False)

    listOfValuesToInsert = list(df_insert.itertuples(index=False, name=None))
    print(f"inserting {str(len(listOfValuesToInsert))} new entries!")
    # inserting to db
    query = f"INSERT INTO patent_data ({schema}) VALUES %s"
    extras.execute_values(cursor, query, listOfValuesToInsert)

    connection.commit()

    # log the rows that are inserted
    # datetime object containing current date and time
    # now = datetime.now()
    # print("now =", now)
    # # dd/mm/YY H:M:S
    # dt_string = now.strftime("%d-%m-%Y_%H-%M-%S")
    # print("date and time =", dt_string)
    # saving file with some datetime information for logging/debugging purpose
    FILE_PATH = f"epo/patent_data_insert/patents_insert.csv"
    putToS3(df_insert, TEMP_BUCKET_NAME, FILE_PATH)
    print(f"Saved file at {TEMP_BUCKET_NAME}/{FILE_PATH}")

    # For testing purposes
    query = "SELECT * FROM public.patent_data LIMIT 1"
    cursor.execute(query)
    print(cursor.fetchall())
    query = "SELECT COUNT(*) FROM public.patent_data"
    cursor.execute(query)
    print("# of rows right now: " + str(cursor.fetchall()))

    cursor.close()
    connection.close()

    print("Job done!")


def main(argv):

    storePatentData()


if __name__ == "__main__":
    main(sys.argv)
