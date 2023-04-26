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
    sys.argv, ["DB_SECRET_NAME", "DMS_TASK_ARN"])
DB_SECRET_NAME = args["DB_SECRET_NAME"]
DMS_TASK_ARN = args["DMS_TASK_ARN"]

def main(argv):

    dms_client = boto3.client("dms")

    response = dms_client.start_replication_task(
        ReplicationTaskArn=DMS_TASK_ARN,
        StartReplicationTaskType='reload-target'
    )


if __name__ == "__main__":
    main(sys.argv)
