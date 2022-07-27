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
import { OpensearchStack } from './opensearch-stack';
import { VpcStack } from './vpc-stack';
import { DatabaseStack } from './database-stack';
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export class DmsStack extends Stack {
  constructor(scope: Construct, id: string, vpcStack: VpcStack, opensearchStack: OpensearchStack, databaseStack: DatabaseStack, props?: StackProps) {
    super(scope, id, {
      env: {
          region: 'ca-central-1'
      },
    });

    //Create Policy For DMS to access opensearch
    const opensearchAccessPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: ['*'],
          actions: [
          "es:ESHttpDelete",
          "es:ESHttpGet",
          "es:ESHttpHead",
          "es:ESHttpPost",
          "es:ESHttpPut"
          ],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    //Create Role For DMS to access opensearch
    const role = new iam.Role(this, 'opensearch-access-role', {
      assumedBy: new iam.ServicePrincipal('dms.amazonaws.com'),
      description: 'DMS Role To Access OpenSearch',
      inlinePolicies: {
        opensearchAccessPolicy: opensearchAccessPolicy,
      },
    });

    //Get the ID's of all the public subnets in the vpc
    let subnets = [];
    for(let i = 0; i<vpcStack.vpc.publicSubnets.length; i++){
        subnets.push(vpcStack.vpc.publicSubnets[i].subnetId);
    }

    // Create a subnet group in the VPC that has access to both the postgresql db and opensearch
    const subnet = new dms.CfnReplicationSubnetGroup(this, 'SubnetGroup', {
        replicationSubnetGroupIdentifier: 'cdk-subnetgroup',
        replicationSubnetGroupDescription: 'subnets that have access to my data source and target.',
        subnetIds: subnets,
    });

    //Launch an instance in the subnet group created above
    const instance = new dms.CfnReplicationInstance(this, 'Instance', {
        replicationInstanceIdentifier: 'cdk-instance',
  
        // Other Potential Instance Classes (Smallest in canada is t3 micro): https://docs.aws.amazon.com/dms/latest/userguide/CHAP_ReplicationInstance.Types.html
        replicationInstanceClass: 'dms.t3.micro',
  
        // Attach the subnet group to the replication instance
        replicationSubnetGroupIdentifier: subnet.ref,

        // Attach the default VPC security group to the replication instance
        vpcSecurityGroupIds: [ vpcStack.vpc.vpcDefaultSecurityGroup ],
    });

    // Get database credentials here
    const mySecretFromName = secretsmanager.Secret.fromSecretNameV2(this, 'SecretFromName', "credentials/dbCredentials");

    // Create the postgresql source endpoint
    const source = new dms.CfnEndpoint(this, 'Source', {
        endpointIdentifier: 'cdk-source',
        endpointType: 'source',
        engineName: 'postgres',
        serverName: mySecretFromName.secretValueFromJson("host").unsafeUnwrap(),
        port: 5432,
        databaseName: mySecretFromName.secretValueFromJson("dbname").unsafeUnwrap(),
        username: mySecretFromName.secretValueFromJson("username").unsafeUnwrap(),
        password: mySecretFromName.secretValueFromJson("password").unsafeUnwrap()
    });

    // Create the opensearch target endpoint
    const target = new dms.CfnEndpoint(this, 'Target', {
        endpointIdentifier: 'cdk-target',
        endpointType: 'target',
        engineName: 'opensearch',

        elasticsearchSettings: {
            endpointUri: opensearchStack.devDomain.domainEndpoint,
            errorRetryDuration: 300,
            fullLoadErrorPercentage: 10,
            serviceAccessRoleArn: role.roleArn
        },
    });
    
    // Create a replication task to replicate the
    // reseracher_data and publication_data tables into opensearch this will happen ongoing forever.
    const task = new dms.CfnReplicationTask(this, 'Task', {
        replicationInstanceArn: instance.ref,
  
        migrationType: 'full-load-and-cdc', // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-dms-replicationtask.html#cfn-dms-replicationtask-migrationtype
        sourceEndpointArn: source.ref,
        targetEndpointArn: target.ref,
        tableMappings: JSON.stringify({
          "rules": [{
            "rule-type": "selection",
            "rule-id": "1",
            "rule-name": "import researcher data",
            "object-locator": {
              "schema-name": "public",
              "table-name": "researcher_data"
            },
            "rule-action": "include"
          },
          {
            "rule-type": "selection",
            "rule-id": "2",
            "rule-name": "import publication data",
            "object-locator": {
              "schema-name": "public",
              "table-name": "publication_data"
            },
            "rule-action": "include"
          }]
        })
    })

    //
    // NEED TO CHECK ON SCHEMA NAME!
    //
    //
  }
}