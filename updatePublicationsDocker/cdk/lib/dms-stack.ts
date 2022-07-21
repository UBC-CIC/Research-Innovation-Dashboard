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

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class DmsStack extends Stack {
  constructor(scope: Construct, id: string, vpcStack: VpcStack, opensearchStack: OpensearchStack, props?: StackProps) {
    super(scope, id, props);

    let subnets = [];
    for(let i = 0; i<vpcStack.vpc.publicSubnets.length; i++){
        subnets.push(vpcStack.vpc.publicSubnets[i].subnetId);
    }

    // Create a subnet group that allows DMS to access your data
    const subnet = new dms.CfnReplicationSubnetGroup(this, 'SubnetGroup', {
        replicationSubnetGroupIdentifier: 'cdk-subnetgroup',
        replicationSubnetGroupDescription: 'subnets that have access to my data source and target.',
        subnetIds: subnets,
    });

    //Launch an instance in the subnet group
    const instance = new dms.CfnReplicationInstance(this, 'Instance', {
        replicationInstanceIdentifier: 'cdk-instance',
  
        // Use the appropriate instance class: https://docs.aws.amazon.com/dms/latest/userguide/CHAP_ReplicationInstance.Types.html
        replicationInstanceClass: 'dms.t3.micro',
  
        // Setup networking this.subnetGroup.ref
        replicationSubnetGroupIdentifier: subnet.ref,
        vpcSecurityGroupIds: [ vpcStack.vpc.vpcDefaultSecurityGroup ],
    });

    const source = new dms.CfnEndpoint(this, 'Source', {
        endpointIdentifier: 'cdk-source',
        endpointType: 'source',
        engineName: 'postgres',
        serverName: 'vpripublicationdb.ct5odvmonthn.ca-central-1.rds.amazonaws.com',
        port: 5432,
        databaseName: 'myDatabase',
        username: 'vpri',
        password: 'Pv9FNYbhpSRNNXes'
    });

    const target = new dms.CfnEndpoint(this, 'Target', {
        endpointIdentifier: 'cdk-target',
        endpointType: 'target',
        engineName: 'opensearch',

        elasticsearchSettings: {
            endpointUri: opensearchStack.devDomain.domainEndpoint,
            errorRetryDuration: 300,
            fullLoadErrorPercentage: 10,
            serviceAccessRoleArn: 'arn:aws:iam::649335657496:role/another-test-role'
        },
    });
    
    // Define the replication task
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
  }
}