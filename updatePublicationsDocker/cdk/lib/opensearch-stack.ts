import { VpcStack } from './vpc-stack';

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

export class OpensearchStack extends Stack {
    public readonly devDomain: opensearch.Domain;

    constructor(scope: Construct, id: string, vpcStack: VpcStack, props?: StackProps) {
    super(scope, id, props);

    const lambdaRole = new Role(this, 'OpenSearchLambdaRole', {
        roleName: 'OpenSearchLambdaRole',
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        inlinePolicies: {
            additional: new PolicyDocument({
                statements: [
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: [
                            // Opensearch
                            "es:*",
                            // VPC
                            'ec2:CreateNetworkInterface',
                            'ec2:Describe*',
                            'ec2:DeleteNetworkInterface',
                        ],
                        resources: ['*']
                    })
                ]
            }),
        },
    });
    
    //Allow 
    const openSearchPolicyStatement = new PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [ 'es:*' ],
        principals: [ new ArnPrincipal(lambdaRole.roleArn) ],
        resources: [ '*' ],
    });

    const openSearchVPCPermissions = new iam.CfnServiceLinkedRole(this, 'OpenSearchSLR', {
        awsServiceName: 'opensearchservice.amazonaws.com'
    });

    const defaultSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, id, vpcStack.vpc.vpcDefaultSecurityGroup);
    
    this.devDomain = new opensearch.Domain(this, 'vpriCdkOpensearchDomain', {
        version: opensearch.EngineVersion.OPENSEARCH_1_1,
        enableVersionUpgrade: true,
        capacity: {
            dataNodes: 2,
            dataNodeInstanceType: "t2.small.search"
        },
        domainName: 'vpri-cdk-opensearch-domain',
        accessPolicies: [openSearchPolicyStatement],
        vpc: vpcStack.vpc,
        vpcSubnets: [vpcStack.vpc.selectSubnets({subnetType: ec2.SubnetType.PUBLIC})],
        securityGroups: [defaultSecurityGroup],
        zoneAwareness: {availabilityZoneCount : 2}
    });

    //Attach vpc service linked role to opensearch domain
    this.devDomain.node.addDependency(openSearchVPCPermissions);

    const aws4Layer = new lambda.LayerVersion(this, 'aws4', {
        compatibleRuntimes: [
          lambda.Runtime.NODEJS_12_X,
          lambda.Runtime.NODEJS_14_X,
          lambda.Runtime.NODEJS_16_X,
        ],
        code: lambda.Code.fromAsset('layers/aws4'),
        description: 'aws4',
    });

    const awsSdkLayer = new lambda.LayerVersion(this, 'aws-sdk-credential-provider-node', {
        compatibleRuntimes: [
          lambda.Runtime.NODEJS_12_X,
          lambda.Runtime.NODEJS_14_X,
          lambda.Runtime.NODEJS_16_X,
        ],
        code: lambda.Code.fromAsset('layers/aws-sdk-credential-provider-node'),
        description: 'aws-sdk-credential-provider-node',
    });

    const opensearchLayer = new lambda.LayerVersion(this, 'opensearch', {
        compatibleRuntimes: [
          lambda.Runtime.NODEJS_12_X,
          lambda.Runtime.NODEJS_14_X,
          lambda.Runtime.NODEJS_16_X,
        ],
        code: lambda.Code.fromAsset('layers/opensearch'),
        description: 'opensearch',
    });

    const fn = new lambda.Function(this, 'MyFunction', {
        functionName: "QueryOpensearch",
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: 'index.handler',
        timeout: cdk.Duration.seconds(300),
        role: lambdaRole,
        memorySize: 512,
        environment: {
            "OPENSEARCH_ENDPOINT": this.devDomain.domainEndpoint,
        },
        securityGroups: [ defaultSecurityGroup ],
        vpc: vpcStack.vpc,
        code: lambda.Code.fromAsset('lambda/opensearchQuery'),
        layers: [aws4Layer, awsSdkLayer, opensearchLayer]
    });
  }
}