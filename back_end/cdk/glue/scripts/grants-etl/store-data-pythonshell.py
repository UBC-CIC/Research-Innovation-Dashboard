import sys
import json
import io
import pandas as pd
import numpy as np
import psycopg2
import psycopg2.extras as extras
import boto3
from awsglue.utils import getResolvedOptions

# get environment variable for this Glue job
args = getResolvedOptions(
    sys.argv, ["BUCKET_NAME", "FILENAME_ID", "SECRET_NAME"])
BUCKET_NAME = args["BUCKET_NAME"]
FILENAME_ID = args["FILENAME_ID"]
SECRET_NAME = args["SECRET_NAME"]


def storeData():

    s3_client = boto3.resource('s3')
    response = s3_client.Object(BUCKET_NAME, FILENAME_ID).get()
    status = response.get("ResponseMetadata", {}).get("HTTPStatusCode")

    df_id = pd.read_csv(io.StringIO(response["Body"].read().decode(
        "utf-8")), header=0, keep_default_na=False)

    # retain rows with assigned IDs
    df_id = df_id[df_id["Assigned ID"] != ""]

    # rearrange columns order
    df_id = df_id[['Assigned ID', 'Name', 'Department', 'Agency',
                   'Grant Program', 'Amount', 'Project Title',
                   'Keywords', 'Year', 'Start Date', 'End Date']]

    # convert the entire DataFrame into a list of tuples (rows)
    cleanData = list(df_id.itertuples(index=False, name=None))

    # secretsmanager client to get db credentials
    sm_client = boto3.client("secretsmanager")
    response = sm_client.get_secret_value(SecretId=SECRET_NAME)["SecretString"]
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
    # query = "TRUNCATE grant_data"
    # cursor.execute(query)

    # connection.commit()

    # check for duplicate insertion
    query = "SELECT assigned_id, name, department, agency, grant_program, amount, project_title, keywords, year, start_date, end_date FROM public.grant_data"
    cursor.execute(query)
    tableData = cursor.fetchall()
    # the difference between the two sets is the data that are unique and can be inserted into the database
    listOfValuesToInsert = list(set(cleanData) - set(tableData))

    # inserting to db
    query = "INSERT INTO grant_data (assigned_id, name, department, agency, grant_program, amount, project_title, keywords, year, start_date, end_date) VALUES %s"
    extras.execute_values(cursor, query, listOfValuesToInsert)

    connection.commit()

    # For testing purposes
    query = "SELECT * FROM public.grant_data LIMIT 1"
    cursor.execute(query)
    print(cursor.fetchall())
    query = "SELECT COUNT(*) FROM public.grant_data"
    cursor.execute(query)
    print("# of rows right now: " + str(cursor.fetchall()))

    cursor.close()
    connection.close()

    print("Job done!")


storeData()
