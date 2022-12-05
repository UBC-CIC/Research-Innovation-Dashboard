import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { triggers } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_iam as iam} from 'aws-cdk-lib';
import  { aws_s3 as s3 } from 'aws-cdk-lib'
import { aws_stepfunctions as sfn} from 'aws-cdk-lib';
import { aws_stepfunctions_tasks as tasks} from 'aws-cdk-lib';
import { ArnPrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { DatabaseStack } from './database-stack';
import { DmsStack } from './dms-stack';

export class DataFetchStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, databaseStack: DatabaseStack, dmsStack: DmsStack, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the S3 Bucket
    const s3Bucket = new s3.Bucket(this, 's3-bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    /*
      Define Lambda Layers
    */
    // The layer containing the requests library
    const requests = new lambda.LayerVersion(this, 'requests', {
      code: lambda.Code.fromAsset('layers/requests.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: 'Contains the requests library',
    });

    // The layer containing the psycopg2 library
    const psycopg2 = new lambda.LayerVersion(this, 'psycopg2', {
      code: lambda.Code.fromAsset('layers/psycopg2.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: 'Contains the psycopg2 library',
    });

    // The layer containing the pyjarowinler library
    const pyjarowinkler = new lambda.LayerVersion(this, 'pyjarowinkler', {
      code: lambda.Code.fromAsset('layers/pyjarowinkler.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: 'Contains the pyjarowinkler library',
    });

    // The layer containing the pytz library
    const pytz = new lambda.LayerVersion(this, 'pytz', {
      code: lambda.Code.fromAsset('layers/pytz.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: 'Contains the pytz library, used to get the correct timezone when fetching the date',
    });

    // The layer containing the numpy library (AWS Managed)
    const numpy = lambda.LayerVersion.fromLayerVersionArn(this, 'awsNumpyLayer', 'arn:aws:lambda:ca-central-1:336392948345:layer:AWSDataWrangler-Python39:5')

    // Create the database tables (runs during deployment)
    const createTables = new triggers.TriggerFunction(this, 'createTables', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'createTables.lambda_handler',
      layers: [psycopg2],
      code: lambda.Code.fromAsset('lambda/createTables'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
    });
    createTables.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'SecretsManagerReadWrite',
      ),
    );

    /*
        Create the lambda roles
    */
    const nameMatchRole = new Role(this, 'NameMatchRole', {
      roleName: 'NameMatchRole',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    nameMatchRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        // S3
        "s3:ListBucket",
        "s3:*Object"
      ],
      resources: [s3Bucket.bucketArn]
    }));
    nameMatchRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        // Parameter Store
        "ssm:DescribeParameters",
        //Needed to put the Lambda in a VPC
        "ec2:DescribeNetworkInterfaces",
        "ec2:CreateNetworkInterface",
        "ec2:DeleteNetworkInterface",
        "ec2:DescribeInstances",
        "ec2:AttachNetworkInterface"
      ],
      resources: ["*"]
    }));
    nameMatchRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        // Parameter Store
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
      ],
      resources: [`arn:aws:ssm:ca-central-1:${this.account}:parameter/service/elsevier/api/user_name/*`]
    }));

    const dataFetchRole = new Role(this, 'DataFetchRole', {
      roleName: 'DataFetchRole',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    dataFetchRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        // Secrets Manager
        "secretsmanager:GetSecretValue",
      ],
      resources: [`arn:aws:secretsmanager:ca-central-1:${this.account}:secret:vpri/credentials/*`]
    }));
    dataFetchRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        // S3
        "s3:ListBucket",
        "s3:*Object"
      ],
      resources: [s3Bucket.bucketArn]
    }));
    dataFetchRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        // Parameter Store
        "ssm:DescribeParameters",
        //Needed to put the Lambda in a VPC
        "ec2:DescribeNetworkInterfaces",
        "ec2:CreateNetworkInterface",
        "ec2:DeleteNetworkInterface",
        "ec2:DescribeInstances",
        "ec2:AttachNetworkInterface"
      ],
      resources: ["*"]
    }));
    dataFetchRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        // Parameter Store
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
      ],
      resources: [
        `arn:aws:ssm:ca-central-1:${this.account}:parameter/service/elsevier/api/user_name/*`,
      ]
    }));
    //Create a policy to start DMS task
    dataFetchRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        // Parameter Store
        "dms:StartReplicationTask",
      ],
      resources: [dmsStack.replicationTask.ref]
    }));
    /*
      Define Lambdas and add correct permissions
    */
    const scopusClean = new lambda.Function(this, 'scopusClean', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'scopusClean.lambda_handler',
      code: lambda.Code.fromAsset('lambda/scopusClean'),
      timeout: cdk.Duration.minutes(15),
      role: nameMatchRole,
      memorySize: 512,
      environment: {
        S3_BUCKET_NAME: s3Bucket.bucketName,
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const ubcClean = new lambda.Function(this, 'ubcClean', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'ubcClean.lambda_handler',
      code: lambda.Code.fromAsset('lambda/ubcClean'),
      timeout: cdk.Duration.minutes(15),
      role: nameMatchRole,
      memorySize: 512,
      environment: {
        S3_BUCKET_NAME: s3Bucket.bucketName,
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const compareNames = new lambda.Function(this, 'compareNames', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'compareNames.lambda_handler',
      layers: [pyjarowinkler, numpy],
      code: lambda.Code.fromAsset('lambda/compareNames'),
      timeout: cdk.Duration.minutes(15),
      role: nameMatchRole,
      memorySize: 512,
      environment: {
        S3_BUCKET_NAME: s3Bucket.bucketName,
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const cleanNoMatches = new lambda.Function(this, 'cleanNoMatches', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'cleanNoMatches.lambda_handler',
      layers: [pyjarowinkler, requests],
      code: lambda.Code.fromAsset('lambda/cleanNoMatches'),
      timeout: cdk.Duration.minutes(15),
      role: nameMatchRole,
      memorySize: 512,
      environment: {
        S3_BUCKET_NAME: s3Bucket.bucketName,
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const identifyDuplicates = new lambda.Function(this, 'identifyDuplicates', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'identifyDuplicates.lambda_handler',
      layers: [pyjarowinkler, requests],
      code: lambda.Code.fromAsset('lambda/identifyDuplicates'),
      timeout: cdk.Duration.minutes(15),
      role: nameMatchRole,
      memorySize: 512,
      environment: {
        S3_BUCKET_NAME: s3Bucket.bucketName,
        SCIVAL_MAX_AUTHORS: '100',
        SCIVAL_URL: 'https://api.elsevier.com/analytics/scival/author/metrics',
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const researcherFetch = new lambda.Function(this, 'researcherFetch', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'researcherFetch.lambda_handler',
      layers: [psycopg2, pytz],
      code: lambda.Code.fromAsset('lambda/researcherFetch'),
      timeout: cdk.Duration.minutes(15),
      role: dataFetchRole,
      memorySize: 512,
      environment: {
        S3_BUCKET_NAME: s3Bucket.bucketName,
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const elsevierFetch = new lambda.Function(this, 'elsevierFetch', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'elsevierFetch.lambda_handler',
      layers: [requests, psycopg2, pytz],
      code: lambda.Code.fromAsset('lambda/elsevierFetch'),
      timeout: cdk.Duration.minutes(15),
      role: dataFetchRole,
      memorySize: 512,
      environment: {
        SCIVAL_MAX_AUTHORS: '100',
        SCIVAL_URL: 'https://api.elsevier.com/analytics/scival/author/metrics',
        SCOPUS_MAX_AUTHORS: '25',
        SCOPUS_URL: 'https://api.elsevier.com/content/author',
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const orcidFetch = new lambda.Function(this, 'orcidFetch', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'orcidFetch.lambda_handler',
      layers: [requests, psycopg2, pytz],
      code: lambda.Code.fromAsset('lambda/orcidFetch'),
      timeout: cdk.Duration.minutes(15),
      role: dataFetchRole,
      memorySize: 512,
      environment: {
        ORCID_URL: 'http://pub.orcid.org/'
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const publicationFetch = new lambda.Function(this, 'publicationFetch', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'publicationFetch.lambda_handler',
      layers: [requests, psycopg2, pytz],
      code: lambda.Code.fromAsset('lambda/publicationFetch'),
      timeout: cdk.Duration.minutes(15),
      role: dataFetchRole,
      memorySize: 512,
      environment: {
        RESULTS_PER_PAGE: '25',
        SCOPUS_SEARCH_URL: 'https://api.elsevier.com/content/search/scopus'
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const startReplication = new lambda.Function(this, 'startReplication', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'startReplication.lambda_handler',
      layers: [requests, psycopg2, pytz],
      code: lambda.Code.fromAsset('lambda/startReplication'),
      timeout: cdk.Duration.minutes(15),
      role: dataFetchRole,
      memorySize: 512,
      environment: {
        Replication_Task_Arn: dmsStack.replicationTask.ref
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    /*
        Set up the step function
    */
    const scopusCleanInvoke = new tasks.LambdaInvoke(this, 'Clean Scopus Data', {
      lambdaFunction: scopusClean,
      outputPath: '$.Payload',
    });

    const ubcCleanInvoke = new tasks.LambdaInvoke(this, 'Clean UBC Data', {
      lambdaFunction: ubcClean,
      outputPath: '$.Payload',
    });

    const compareNamesInvoke = new tasks.LambdaInvoke(this, 'Perform Name Comparison', {
      lambdaFunction: compareNames,
      outputPath: '$.Payload',
    });
    const compareNamesMap = new sfn.Map(this, 'Name Comparison Map', {
      maxConcurrency: 8,
      itemsPath: '$'
    });
    compareNamesMap.iterator(compareNamesInvoke);

    const cleanNoMatchesInvoke = new tasks.LambdaInvoke(this, 'Perform Additional Comparisons On Missed Matches', {
      lambdaFunction: cleanNoMatches,
      outputPath: '$.Payload',
    });
    const cleanNoMatchesMap = new sfn.Map(this, 'Missing Matches Map', {
      maxConcurrency: 1,
      itemsPath: '$'
    });
    cleanNoMatchesMap.iterator(cleanNoMatchesInvoke);

    const identifyDuplicatesInvoke = new tasks.LambdaInvoke(this, 'Perform Additional Comparisons Duplicate Profiles', {
      lambdaFunction: identifyDuplicates,
      outputPath: '$.Payload',
    });
    const identifyDuplicatesMap = new sfn.Map(this, 'Duplicates Map', {
      maxConcurrency: 1,
      itemsPath: '$'
    });
    identifyDuplicatesMap.iterator(identifyDuplicatesInvoke);

    const researcherFetchInvoke = new tasks.LambdaInvoke(this, 'Fetch Researchers', {
      lambdaFunction: researcherFetch,
      outputPath: '$.Payload',
    });

    const elsevierFetchInvoke = new tasks.LambdaInvoke(this, 'Fetch Elsevier Data', {
      lambdaFunction: elsevierFetch,
      outputPath: '$.Payload',
    });

    const orcidFetchInvoke = new tasks.LambdaInvoke(this, 'Fetch Orcid Data', {
      lambdaFunction: orcidFetch,
      outputPath: '$.Payload',
    });

    const publicationFetchInvoke = new tasks.LambdaInvoke(this, 'Fetch Publications', {
      lambdaFunction: publicationFetch,
      outputPath: '$.Payload',
    });
    const publicationMap = new sfn.Map(this, 'Publication Map', {
      maxConcurrency: 1,
      itemsPath: '$'
    })
    publicationMap.iterator(publicationFetchInvoke);

    const replicationStartInvoke = new tasks.LambdaInvoke(this, 'Start DMS Replication', {
      lambdaFunction: startReplication,
      outputPath: '$.Payload',
    });

    const dataFetchDefinition = scopusCleanInvoke
      .next(ubcCleanInvoke)
      .next(compareNamesMap)
      .next(cleanNoMatchesMap)
      .next(identifyDuplicatesMap)
      .next(researcherFetchInvoke)
      .next(elsevierFetchInvoke)
      .next(orcidFetchInvoke)
      .next(publicationMap)
      .next(replicationStartInvoke);
    
    const dataFetch = new sfn.StateMachine(this, 'Data Fetch State Machine', {
      definition: dataFetchDefinition,
    });

    // Give the lambdas permission to access the S3 Bucket
    s3Bucket.grantReadWrite(scopusClean);
    s3Bucket.grantReadWrite(ubcClean);
    s3Bucket.grantReadWrite(compareNames);
    s3Bucket.grantReadWrite(cleanNoMatches);
    s3Bucket.grantReadWrite(identifyDuplicates);
    s3Bucket.grantReadWrite(researcherFetch);
    s3Bucket.grantReadWrite(new iam.AccountRootPrincipal());
  }
}
