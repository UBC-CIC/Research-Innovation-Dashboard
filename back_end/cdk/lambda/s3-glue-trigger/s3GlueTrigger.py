import json
import boto3
from botocore.exceptions import ClientError
import re


"""
Handle S3 PUT event from S3 bucket, then create approriate ENVIRONMENT VARIABLES
to pass into the Glue Job so that it can run the approriate cleaning script for
each data set, and also have the correct configuration settings.

We chose to filter the event based on the folder structure and not the exact name of the
csv file so that the user can upload any filename and it will trigger the correct job, 
as long as its in the correct raw folder (a correct path).

The handler first filter out the put event in the raw folder, then trigger the correct job.
It can event extend to any other grant data that might be added in the future, but
with these sepcific requirements:
+ The raw folder structure should look like similar to: raw/mygrant/mygrant_raw.csv
+ Only one raw file that needs to be cleaned per grant
+ The user must create a Glue job that cleans that specific raw data, and name it similar to clean-mygrant

A special case is the SSHRC datasets that include a program codes csv file, so
we make sure that the Glue job is started only when both files are there when we perform a
S3 ListObjectsV2 api call.

then after each file is cleaned and put into a clean folder with their uniqe paths, s3 will
send another event and this lambda will trigger the assign ids job. This job has a max concurrency
value of 7 to allows at least 4 simultaneous invocations.

and finally a job will be trigger to insert the data into the database when all of them have 
the ids assigned.

IMPORTANT: User MUST upload the raw data in the raw folder and follow the folder naming requirements above

:param event: an S3 ObjectCreated:PUT event
"""


def lambda_handler(event, context):

    MAX_CAPACITY = 0.0625  # 1/16 DPU
    TIMEOUT = 120  # 120 min timeout

    s3_client = boto3.client("s3")
    glue_client = boto3.client("glue")

    s3_event = event["Records"][0]["s3"]
    bucketName = s3_event["bucket"]["name"]
    response = ""
    jobName = ""

    # when the user first upload a raw csv file into any grant folder inside the raw folder
    if "raw/" in s3_event["object"]["key"]:

        fileKey = s3_event["object"]["key"]
        file = fileKey.split("/", 2)[1]  # get the name of the raw file folder

        split = fileKey.split(".csv", 1)
        fileKey_clean = (split[0] + "-clean" + split[1] +
                         ".csv").replace("raw/", "clean/", 1)

        arguments = {
            "--BUCKET_NAME": bucketName,
            "--FILENAME_RAW": fileKey,
            "--FILENAME_CLEAN": fileKey_clean,
        }

        # sshrc is a special case because the cleaning process require two differen files
        if "raw/sshrc/" in fileKey:
            jobName = "expertiseDashboard-clean-sshrc"

            # s3 api call to list the objects with the specified path (folder)
            objectList = s3_client.list_objects_v2(
                Bucket=bucketName,
                Prefix="raw/sshrc/"
            )

            objectCount = len(objectList["Contents"])

            print(objectList["Contents"])
            for obj in objectList["Contents"]:
                if obj["Key"] == "raw/sshrc/":
                    objectCount -= 1
            print("# of files: " + str(objectCount))

            # glue api call to list the job runs, limited to the most recent runs
            jobRuns = glue_client.get_job_runs(JobName=jobName, MaxResults=1)

            # check if the raw file and the program code file is there
            if objectCount == 2:
                if not jobRuns["JobRuns"]:
                    try:

                        for file in objectList["Contents"]:
                            # using regex to match for the name of the program code csv file
                            if re.match(r"(?i).*(program).*(code).*", file["Key"]):
                                arguments["--PROGRAM_CODE_KEY"] = file["Key"]
                            else:
                                arguments["--FILENAME_RAW"] = file["Key"]
                        response = glue_client.start_job_run(
                            JobName=jobName,
                            MaxCapacity=MAX_CAPACITY,
                            Timeout=TIMEOUT,
                            Arguments=arguments
                        )
                        print("Started Glue Job: " + jobName)
                    except ClientError as e:
                        if e.response['Error']['Code'] == 'ConcurrentRunsExceededException':
                            print(jobName + " is at max concurrency")

                else:
                    latestRunState = jobRuns["JobRuns"][0]["JobRunState"]
                    if latestRunState in ("STOPPED", "SUCCEEDED", "FAILED", "TIMEOUT"):
                        try:

                            for file in objectList["Contents"]:
                                # using regex to match for the name of the program code csv file
                                if re.match(r"(?i).*(program).*(code).*", file["Key"]):
                                    arguments["--PROGRAM_CODE_KEY"] = file["Key"]
                                else:
                                    arguments["--FILENAME_RAW"] = file["Key"]
                            response = glue_client.start_job_run(
                                JobName=jobName,
                                MaxCapacity=MAX_CAPACITY,
                                Timeout=TIMEOUT,
                                Arguments=arguments
                            )
                            print("Started Glue Job: " + jobName)
                        except ClientError as e:
                            if e.response['Error']['Code'] == 'ConcurrentRunsExceededException':
                                print(jobName + " is at max concurrency")

        # other than that this script will work for any grant data
        # just make sure the folder structure is raw/mygrant/mygrant-raw.csv
        # and the Glue job for cleaning is called clean-mygrant
        else:
            try:
                jobName = "expertiseDashboard-clean-" + file
                response = glue_client.start_job_run(
                    JobName=jobName,
                    MaxCapacity=MAX_CAPACITY,
                    Timeout=TIMEOUT,
                    Arguments=arguments
                )
                print("Started Glue Job: " + jobName)
            except ClientError as e:
                if e.response['Error']['Code'] == 'ConcurrentRunsExceededException':
                    print(jobName + " is at max concurrency")

    # when the raw data is clean and put into the approriate clean folder
    # this part is triggered when the previous part is done, because s3 will send another
    # trigger when a clean file appears in the clean folder
    # need MaximumConcurrentRuns = at least 4
    elif "clean/" in s3_event["object"]["key"]:
        jobName = "expertiseDashboard-assignIds"

        fileKey = s3_event["object"]["key"]

        split = fileKey.split(".csv", 1)
        fileKey_clean = (split[0] + "-ids" + split[1] +
                         ".csv").replace("clean/", "ids-assigned/", 1)

        arguments = {
            "--BUCKET_NAME": bucketName,
            "--FILENAME_CLEAN": fileKey,
            "--FILENAME_ID": fileKey_clean
        }

        try:
            response = glue_client.start_job_run(
                JobName=jobName,
                MaxCapacity=MAX_CAPACITY,
                Timeout=TIMEOUT,
                Arguments=arguments
            )

            print("Started Glue Job  " + jobName +
                  " to process " + fileKey.split("/", 2)[1])

        except ClientError as e:
            if e.response['Error']['Code'] == 'ConcurrentRunsExceededException':
                print(jobName + " is at max concurrency")

    # when the data is assigned ids and put into the approriate ids-assigned folder
    # this will trigger a job to store the data in a table in the database
    # need MaximumConcurrentRuns = at least 4
    elif "ids-assigned/" in s3_event["object"]["key"]:
        jobName = "expertiseDashboard-storeData"

        fileKey = s3_event["object"]["key"]

        arguments = {
            "--BUCKET_NAME": bucketName,
            "--FILENAME_ID": fileKey,
        }

        try:
            response = glue_client.start_job_run(
                JobName=jobName,
                MaxCapacity=MAX_CAPACITY,
                Timeout=TIMEOUT,
                Arguments=arguments
            )

            print("Started Glue Job  " + jobName +
                  " to process " + fileKey.split("/", 2)[1])

        except ClientError as e:
            if e.response['Error']['Code'] == 'ConcurrentRunsExceededException':
                print(jobName + " is at max concurrency")
