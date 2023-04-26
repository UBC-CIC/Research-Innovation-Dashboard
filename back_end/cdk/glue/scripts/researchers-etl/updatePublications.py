import requests
import json
import boto3
import psycopg2
import os
import math
import time

print("Starting Update Publications")

ssm_client = boto3.client('ssm')
sm_client = boto3.client('secretsmanager')
dms_client = boto3.client('dms')