import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset, NetworkMode } from 'aws-cdk-lib/aws-ecr-assets';
import * as path from 'path';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as dms from 'aws-cdk-lib/aws-dms';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { ArnPrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class VpcStack extends Stack {
    public readonly vpc: ec2.Vpc;

    constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Vpc For the Application to reside in
    this.vpc = new ec2.Vpc(this, 'Vpc', {
        cidr: '10.0.0.0/16',
        natGateways: 0,
        maxAzs: 2,
        subnetConfiguration: [
          {
            name: 'public-subnet-1',
            subnetType: ec2.SubnetType.PUBLIC,
            cidrMask: 24,
          },
          {
            name: 'isolated-subnet-1',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            cidrMask: 28,
          }
        ],
    });
  }
}