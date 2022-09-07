import boto3
import os

dms_client = boto3.client('dms')

def lambda_handler(event, context):
    print('hi')
    response = dms_client.start_replication_task(
    ReplicationTaskArn= os.environ['Replication_Task_Arn'],
    StartReplicationTaskType='reload-target')
    
    