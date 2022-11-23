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

The handler first filter out the put event in the raw folder, then divide into 4 cases
based on the key corresponding 4 grant datasets. It will then trigger the correct cleaning
functions. A special case is the SSHRC datasets that include a program codes csv file, so
we make sure that the Glue job is started only when both files are there when we perform a
S3 ListObjectsV2 api call.

then after each file is cleaned and put into a clean folder with their uniqe paths, s3 will
send another event and this lambda will trigger the assign ids job. This job has a max concurrency
value of 7 to allows at least 4 simultaneous invocations.

IMPORTANT: User MUST upload the raw data in the raw folder

:param event: an S3 ObjectCreated:PUT event
"""
def lambda_handler(event, context):
    
    MAX_CAPACITY = 0.0625 # 1/16 DPU
    TIMEOUT = 120 # 120 min timeout
    
    s3_client = boto3.client("s3")
    glue_client = boto3.client("glue")
    
    s3_event = event["Records"][0]["s3"]
    bucketName = s3_event["bucket"]["name"]
    response = ""
    
    # when the user first upload a raw csv file into any grant folder inside the raw folder
    if "raw/" in s3_event["object"]["key"]:
        
        fileKey = s3_event["object"]["key"]
        
        split = fileKey.split(".csv", 1)
        fileKey_clean = (split[0] + "-clean" + split[1] + ".csv").replace("raw/", "clean/", 1)
        
        arguments = {
            "--BUCKET_NAME": bucketName,
            "--FILENAME_RAW": fileKey,
            "--FILENAME_CLEAN": fileKey_clean,
        }

        if "raw/cihr/" in fileKey:
            try:
                response = glue_client.start_job_run(
                    JobName="clean-cihr-pythonshell",
                    MaxCapacity=MAX_CAPACITY,
                    Timeout=TIMEOUT,
                    Arguments=arguments
                )
                print("Started Glue Job to clean cihr")
            except ClientError as e:
                if e.response['Error']['Code'] == 'ConcurrentRunsExceededException':
                    print("clean-cihr-pythonshell is at max concurrency")
            
        elif "raw/nserc/" in fileKey:
            try:
                response = glue_client.start_job_run(
                    JobName="clean-nserc-pythonshell",
                    MaxCapacity=MAX_CAPACITY,
                    Timeout=TIMEOUT,
                    Arguments=arguments
                )
                print("Started Glue Job to clean nserc")
            except ClientError as e:
                if e.response['Error']['Code'] == 'ConcurrentRunsExceededException':
                    print("clean-nserc-pythonshell is at max concurrency")
            
        elif "raw/sshrc/" in fileKey:
            objectList = s3_client.list_objects_v2(
                Bucket=bucketName,
                Prefix="raw/sshrc/"
            )
            # object count will always have one extra object, the empty folder
            # so must - 1 to get the actual number of object there
            objectCount = len(objectList["Contents"])
            
            print(objectCount)
            print(objectList["Contents"])
            
            if (objectCount-1 == 2): # check if the raw file and the program code file is there
                try:
                    for file in objectList["Contents"]:
                        # using regex to match for the name of the program code csv file
                        if re.match(r"(?i).*(program).*(code).*", file["Key"]):
                            arguments["--PROGRAM_CODE_KEY"] = file["Key"]
                        else:
                            arguments["--FILENAME_RAW"] = file["Key"]
                    response = glue_client.start_job_run(
                        JobName="clean-sshrc-pythonshell",
                        MaxCapacity=MAX_CAPACITY,
                        Timeout=TIMEOUT,
                        Arguments=arguments
                    )
                    print("Started Glue Job to clean sshrc")
                except ClientError as e:
                    if e.response['Error']['Code'] == 'ConcurrentRunsExceededException':
                        print("clean-sshrc-pythonshell is at max concurrency")    
            
        elif "raw/cfi/" in fileKey:
            try:
                response = glue_client.start_job_run(
                        JobName="clean-cfi-pythonshell",
                        MaxCapacity=MAX_CAPACITY,
                        Timeout=TIMEOUT,
                        Arguments=arguments
                )
                print("Started Glue Job to clean cfi")
            except ClientError as e:
                if e.response['Error']['Code'] == 'ConcurrentRunsExceededException':
                    print("clean-cfi-pythonshell is at max concurrency")
    
    # when the raw data is clean and put into the approriate clean folder
    # this part is triggered when the previous part is done, because s3 will send another
    # trigger when a clean file appears in the clean folder
    # need MaximumConcurrentRuns = at least
    elif "clean/" in s3_event["object"]["key"]:
        jobName = "assign-ids-pythonshell"
        
        fileKey = s3_event["object"]["key"]
        
        split = fileKey.split(".csv", 1)
        fileKey_clean = (split[0] + "-ids" + split[1] + ".csv").replace("clean/", "ids-assigned/", 1)
        
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
            
            print("Started Glue Job to assign ids to " + fileKey.split("/", 2)[1])
            
        except ClientError as e:
                if e.response['Error']['Code'] == 'ConcurrentRunsExceededException':
                    print("assign-ids-pythonshell is at max concurrency")
    
