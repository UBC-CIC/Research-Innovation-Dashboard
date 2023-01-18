import json
import os
import boto3

# create the folder structure on S3 bucket to upload grant data
def lambda_handler(event, context):
    s3 = boto3.client("s3")
    bucket = os.environ.get("BUCKET_NAME")
    s3.put_object(Bucket=bucket, Key="raw/cihr/")
    s3.put_object(Bucket=bucket, Key="raw/nserc/")
    s3.put_object(Bucket=bucket, Key="raw/sshrc/")
    s3.put_object(Bucket=bucket, Key="raw/cfi/")
