import json
import boto3
import os

SG_ID = os.environ["SG_ID"]
ACCOUNT_ID = os.environ["ACCOUNT_ID"]


def lambda_handler(event, context):

    # Set up the EC2 client
    ec2 = boto3.client('ec2')

    # Set the security group ID
    security_group_id = SG_ID
    user_id = ACCOUNT_ID

    response = ec2.describe_security_groups(
        GroupIds=[security_group_id]
    )
    # print(response['SecurityGroups'][0])
    print(response['SecurityGroups'][0]['IpPermissions'])

    # define the ingress rule that allows ALL TRAFFIC
    all_traf = {
        'IpProtocol': '-1',
        'IpRanges': [],
        'Ipv6Ranges': [],
        'PrefixListIds': [],
        'UserIdGroupPairs': [
            {
                'GroupId': security_group_id,
                'UserId': user_id
            }
        ]
    }

    for ingress_rule in response['SecurityGroups'][0]['IpPermissions']:
        if ingress_rule == all_traf:
            print("Security Group Rule that allows ALL TRAFFIC (-1) detected!")

            # Revoke Ingress Rule that allows ALL Traffic
            response = ec2.revoke_security_group_ingress(
                GroupId=security_group_id,
                IpPermissions=[all_traf],
                DryRun=False
            )

            break
        print("No Security Group Rule that allows ALL TRAFFIC (-1)")

    # Create an ingress rule that allows ALL TCP and self-referencing
    # https://docs.aws.amazon.com/glue/latest/dg/setup-vpc-for-glue-access.html
    # response = ec2.authorize_security_group_ingress(
    #     GroupId=security_group_id,
    #     IpPermissions=[
    #         {
    #             'FromPort': 0,
    #             'IpProtocol': 'tcp',
    #             'IpRanges': [],
    #             'Ipv6Ranges': [],
    #             'PrefixListIds': [],
    #             'ToPort': 65535,
    #             'UserIdGroupPairs': [{
    #                 'Description': 'self-referencing ingress rule for Glue',
    #                 'GroupId': security_group_id,
    #                 'UserId': user_id
    #             }]
    #         }
    #     ],
    #     DryRun=False
    # )

    # Print the response to confirm the rule was revoked
    # print(security_group_id)
    print(response)
