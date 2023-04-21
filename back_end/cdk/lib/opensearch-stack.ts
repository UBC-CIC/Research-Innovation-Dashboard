import { VpcStack } from './vpc-stack';

import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
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
import * as logs from  'aws-cdk-lib/aws-logs'

export class OpensearchStack extends Stack {
    public readonly devDomain: opensearch.Domain;
    public readonly opensearchFunction: lambda.Function;
    public readonly domainName: string;

    constructor(scope: Construct, id: string, vpcStack: VpcStack, props?: StackProps) {
      super(scope, id, props);

    this.domainName = 'expertisedashboard-os-domain'

    //Create a role for lambda to access opensearch
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
                            "es:ESHttpGet",
                            "es:ESHttpPost",
                        ],
                        resources: ["arn:aws:es:*:*:domain/*"]
                    }),
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: [
                            // VPC
                            'ec2:CreateNetworkInterface',
                            'ec2:Describe*',
                            'ec2:DeleteNetworkInterface',
                        ],
                        resources: ["*"] // must be *
                    })
                ]
            }),
        },
    });
    
    //The opensearch policy only allows ESHttp from lambda with the correct role.
    //The policy only allows access to the specfic Opensearch domain
    const openSearchPolicyStatement = new PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [ 'es:ESHttp*' ],
        principals: [ new ArnPrincipal(lambdaRole.roleArn) ],
        resources: [ `arn:aws:es:${this.region}:${this.account}:domain/${this.domainName}` ],
    });

    // get the default security group from the vpc
    const defaultSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, id, vpcStack.vpc.vpcDefaultSecurityGroup);
    
    // Create the opensearch domain
    this.devDomain = new opensearch.Domain(this, 'expertiseDashboard-CdkOpensearchDomain', {
        version: opensearch.EngineVersion.OPENSEARCH_1_1,
        enableVersionUpgrade: true,
        capacity: {
            dataNodes: 2,
            dataNodeInstanceType: "t3.small.search"
        },
        domainName: this.domainName,
        accessPolicies: [openSearchPolicyStatement],
        vpc: vpcStack.vpc,
        vpcSubnets: [vpcStack.vpc.selectSubnets({subnetType: ec2.SubnetType.PRIVATE_ISOLATED})],
        securityGroups: [defaultSecurityGroup],
        zoneAwareness: {availabilityZoneCount : 2},
        enforceHttps: true,
        encryptionAtRest: {
            enabled: true,
        },
        fineGrainedAccessControl: {
            masterUserArn: lambdaRole.roleArn,
        },
        nodeToNodeEncryption: true
    });

    //Attach vpc service linked role to opensearch domain
    this.devDomain.node.addDependency(vpcStack.openSearchVPCPermissions);

    // Create three layers for the opensearch query function
    const aws4Layer = new lambda.LayerVersion(this, 'aws4', {
        compatibleRuntimes: [
          lambda.Runtime.NODEJS_12_X,
          lambda.Runtime.NODEJS_14_X,
          lambda.Runtime.NODEJS_16_X,
        ],
        code: lambda.Code.fromAsset('./layers/aws4.zip'),
        description: 'aws4',
    });

    const awsSdkLayer = new lambda.LayerVersion(this, 'aws-sdk-credential-provider-node', {
        compatibleRuntimes: [
          lambda.Runtime.NODEJS_12_X,
          lambda.Runtime.NODEJS_14_X,
          lambda.Runtime.NODEJS_16_X,
        ],
        code: lambda.Code.fromAsset('./layers/aws-sdk-credential-provider-node.zip'),
        description: 'aws-sdk-credential-provider-node',
    });

    const opensearchLayer = new lambda.LayerVersion(this, 'opensearch', {
        compatibleRuntimes: [
          lambda.Runtime.NODEJS_12_X,
          lambda.Runtime.NODEJS_14_X,
          lambda.Runtime.NODEJS_16_X,
        ],
        code: lambda.Code.fromAsset('./layers/opensearch.zip'),
        description: 'opensearch',
    });

    // Create the opensearch query function.
    this.opensearchFunction = new lambda.Function(this, 'expertiseDashboard-opensearchQuery', {
        functionName: "expertiseDashboard-opensearchQuery",
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
        layers: [aws4Layer, awsSdkLayer, opensearchLayer],
        logRetention: logs.RetentionDays.SIX_MONTHS
    });
  }
}