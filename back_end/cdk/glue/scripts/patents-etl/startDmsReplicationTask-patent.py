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
    sys.argv, ["TEMP_BUCKET_NAME", "EPO_INSTITUTION_NAME", "DB_SECRET_NAME", "DMS_TASK_ARN"])
TEMP_BUCKET_NAME = args["TEMP_BUCKET_NAME"]
EPO_INSTITUTION_NAME = args["EPO_INSTITUTION_NAME"]
DB_SECRET_NAME = args["DB_SECRET_NAME"]
DMS_TASK_ARN = args["DMS_TASK_ARN"]

def main(argv):

    dms_client = boto3.client("dms")

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
