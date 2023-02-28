import sys
import json
import io
import pandas as pd
import numpy as np
import psycopg2
import psycopg2.extras as extras
import boto3
from awsglue.utils import getResolvedOptions
from custom_utils.utils import fetchFromS3, putToS3

# get environment variable for this Glue job
args = getResolvedOptions(
    sys.argv, ["BUCKET_NAME", "SECRET_NAME", "DMS_TASK_ARN"])
BUCKET_NAME = args["BUCKET_NAME"]
SECRET_NAME = args["SECRET_NAME"]
DMS_TASK_ARN = args["DMS_TASK_ARN"]


def main(argv):

    dms_client = boto3.client("dms")
    s3_client = boto3.client("s3")
    objectList = s3_client.list_objects_v2(
        Bucket=BUCKET_NAME,
        Prefix="insert/"
    )

    objectCount = len(objectList["Contents"])

    print(objectList["Contents"])
    for obj in objectList["Contents"]:
        if obj["Key"] == "insert/":
            objectCount -= 1
    print("# of files: " + str(objectCount))

    if objectCount == 4:
        
        # check if dms task in READY state (initial deployment)
        response = dms_client.describe_replication_tasks(
            Filters=[
                {
                    "Name": "replication-task-arn",
                    "Values": [
                        DMS_TASK_ARN
                    ]
                }
            ]
        )
        status = response["ReplicationTasks"][0]["Status"]
        print(f"DMS Replication Task status: {status}")
        if status in ["ready", "stopped"]:
            response = dms_client.start_replication_task(
                ReplicationTaskArn=DMS_TASK_ARN,
                StartReplicationTaskType='reload-target'
            )
        else:
            waiter = dms_client.get_waiter("replication_task_stopped")
            # make waiter wait for a maximum of 30s x 80attempts = 2400s = 40min
            waiter.wait(
                Filters=[
                    {
                        "Name": "replication-task-arn",
                        "Values": [
                            DMS_TASK_ARN
                        ]
                    }
                ],
                WaiterConfig={
                    "Delay": 30,
                    "MaxAttempts": 80
                }
            )
            response = dms_client.start_replication_task(
                ReplicationTaskArn=DMS_TASK_ARN,
                StartReplicationTaskType='reload-target'
            )
            

if __name__ == "__main__":
    main(sys.argv)