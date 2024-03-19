import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { triggers } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_iam as iam} from 'aws-cdk-lib';
import  { aws_s3 as s3 } from 'aws-cdk-lib'
import { aws_stepfunctions as sfn} from 'aws-cdk-lib';
import { aws_stepfunctions_tasks as tasks} from 'aws-cdk-lib';
import { aws_logs as logs } from 'aws-cdk-lib';
import { ArnPrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { DatabaseStack } from './database-stack';
import { DmsStack } from './dms-stack';
import { GrantDataStack } from './grantdata-stack';
import { DefinitionBody } from 'aws-cdk-lib/aws-stepfunctions';

export class DataFetchStack extends cdk.Stack {
  public readonly psycopg2: lambda.LayerVersion;
  public readonly pyjarowinkler: lambda.LayerVersion;
  public readonly dataFetchRole: iam.Role;

  constructor(scope: cdk.App, id: string, databaseStack: DatabaseStack, dmsStack: DmsStack, grantDataStack: GrantDataStack, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the S3 Bucket
    const s3Bucket = new s3.Bucket(this, 'expertiseDashboard-data-s3-bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
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
    this.psycopg2 = new lambda.LayerVersion(this, 'psycopg2', {
      code: lambda.Code.fromAsset('layers/psycopg2.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: 'Contains the psycopg2 library',
    });

    // The layer containing the pyjarowinler library
    this.pyjarowinkler = new lambda.LayerVersion(this, 'pyjarowinkler', {
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
    
    // The layer containing the strsimpy library
    const strsimpy = new lambda.LayerVersion(this, 'strsimpy', {
      code: lambda.Code.fromAsset('layers/strsimpy.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: 'Contains the strsimpy library, used to perform various string comparison metrics',
    });

    // The layer containing the strsimpy library
    const unicode = new lambda.LayerVersion(this, 'unicode', {
      code: lambda.Code.fromAsset('layers/unicode.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      description: 'Contains the unicode library, used to decode unicode',
    });

    // The layer containing the numpy library (AWS Managed)
    const numpy = lambda.LayerVersion.fromLayerVersionArn(this, 'awsNumpyLayer', `arn:aws:lambda:${this.region}:336392948345:layer:AWSDataWrangler-Python39:5`)

    // Create the database tables (runs during deployment)
    const createTables = new triggers.TriggerFunction(this, 'expertiseDashboard-createTables', {
      functionName: 'expertiseDashboard-createTables',
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'createTables.lambda_handler',
      layers: [this.psycopg2],
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
      resources: ["*"] // must be *
    }));
    nameMatchRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        // Parameter Store
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
      ],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/service/elsevier/api/user_name/*`]
    }));
    nameMatchRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        // CloudWatch Logs
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      resources: ["arn:aws:logs:*:*:*"]
    }));

    this.dataFetchRole = new Role(this, 'DataFetchRole', {
      roleName: 'DataFetchRole',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    this.dataFetchRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        // Secrets Manager
        "secretsmanager:GetSecretValue",
      ],
      resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:expertiseDashboard/credentials/*`]
    }));
    this.dataFetchRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        // S3
        "s3:ListBucket",
        "s3:*Object"
      ],
      resources: [s3Bucket.bucketArn]
    }));
    this.dataFetchRole.addToPolicy(new PolicyStatement({
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
      resources: ["*"] // must be *
    }));
    this.dataFetchRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        // Parameter Store
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
      ],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/service/elsevier/api/user_name/*`,
      ]
    }));
    //Create a policy to start DMS task
    this.dataFetchRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        // Parameter Store
        "dms:StartReplicationTask",
      ],
      resources: [dmsStack.replicationTask.ref]
    }));
    // Allow CloudWatch logs
    this.dataFetchRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        // CloudWatch Logs
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      resources: ["arn:aws:logs:*:*:*"]
    }));

    /*
      Define Lambdas and add correct permissions
    */
    const scopusClean = new lambda.Function(this, 'expertiseDashboard-scopusClean', {
      functionName: 'expertiseDashboard-scopusClean',
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'scopusClean.lambda_handler',
      code: lambda.Code.fromAsset('lambda/scopusClean'),
      timeout: cdk.Duration.minutes(15),
      role: nameMatchRole,
      logRetention: logs.RetentionDays.SIX_MONTHS,
      memorySize: 512,
      environment: {
        S3_BUCKET_NAME: s3Bucket.bucketName,
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const institutionClean = new lambda.Function(this, 'expertiseDashboard-institutionClean', {
      functionName: 'expertiseDashboard-institutionClean',
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'institutionClean.lambda_handler',
      code: lambda.Code.fromAsset('lambda/institutionClean'),
      timeout: cdk.Duration.minutes(15),
      role: nameMatchRole,
      logRetention: logs.RetentionDays.SIX_MONTHS,
      memorySize: 512,
      environment: {
        S3_BUCKET_NAME: s3Bucket.bucketName,
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const compareNames = new lambda.Function(this, 'expertiseDashboard-compareNames', {
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: 'expertiseDashboard-compareNames',
      handler: 'compareNames.lambda_handler',
      layers: [this.pyjarowinkler, numpy, unicode, strsimpy],
      code: lambda.Code.fromAsset('lambda/compareNames'),
      timeout: cdk.Duration.minutes(15),
      role: nameMatchRole,
      logRetention: logs.RetentionDays.SIX_MONTHS,
      memorySize: 512,
      environment: {
        S3_BUCKET_NAME: s3Bucket.bucketName,
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const cleanNoMatches = new lambda.Function(this, 'expertiseDashboard-cleanNoMatches', {
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: 'expertiseDashboard-cleanNoMatches',
      handler: 'cleanNoMatches.lambda_handler',
      layers: [this.pyjarowinkler, requests],
      code: lambda.Code.fromAsset('lambda/cleanNoMatches'),
      timeout: cdk.Duration.minutes(15),
      role: nameMatchRole,
      logRetention: logs.RetentionDays.SIX_MONTHS,
      memorySize: 512,
      environment: {
        S3_BUCKET_NAME: s3Bucket.bucketName,
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const identifyDuplicates = new lambda.Function(this, 'expertiseDashboard-identifyDuplicates', {
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: 'expertiseDashboard-identifyDuplicates',
      handler: 'identifyDuplicates.lambda_handler',
      layers: [this.pyjarowinkler, requests],
      code: lambda.Code.fromAsset('lambda/identifyDuplicates'),
      timeout: cdk.Duration.minutes(15),
      role: nameMatchRole,
      logRetention: logs.RetentionDays.SIX_MONTHS,
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

    const researcherFetch = new lambda.Function(this, 'expertiseDashboard-researcherFetch', {
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: 'expertiseDashboard-researcherFetch',
      handler: 'researcherFetch.lambda_handler',
      layers: [this.psycopg2, pytz],
      code: lambda.Code.fromAsset('lambda/researcherFetch'),
      timeout: cdk.Duration.minutes(15),
      role: this.dataFetchRole,
      logRetention: logs.RetentionDays.SIX_MONTHS,
      memorySize: 512,
      environment: {
        S3_BUCKET_NAME: s3Bucket.bucketName,
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const elsevierFetch = new lambda.Function(this, 'expertiseDashboard-elsevierFetch', {
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: 'expertiseDashboard-elsevierFetch',
      handler: 'elsevierFetch.lambda_handler',
      layers: [requests, this.psycopg2, pytz],
      code: lambda.Code.fromAsset('lambda/elsevierFetch'),
      timeout: cdk.Duration.minutes(15),
      role: this.dataFetchRole,
      logRetention: logs.RetentionDays.SIX_MONTHS,
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

    const orcidFetch = new lambda.Function(this, 'expertiseDashboard-orcidFetch', {
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: 'expertiseDashboard-orcidFetch',
      handler: 'orcidFetch.lambda_handler',
      layers: [requests, this.psycopg2, pytz],
      code: lambda.Code.fromAsset('lambda/orcidFetch'),
      timeout: cdk.Duration.minutes(15),
      role: this.dataFetchRole,
      logRetention: logs.RetentionDays.SIX_MONTHS,
      memorySize: 512,
      environment: {
        ORCID_URL: 'http://pub.orcid.org/'
      },
      vpc: databaseStack.dbInstance.vpc, // add to the same vpc as rds
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const publicationFetch = new lambda.Function(this, 'expertiseDashboard-publicationFetch', {
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: 'expertiseDashboard-publicationFetch',
      handler: 'publicationFetch.lambda_handler',
      layers: [requests, this.psycopg2, pytz],
      code: lambda.Code.fromAsset('lambda/publicationFetch'),
      timeout: cdk.Duration.minutes(15),
      role: this.dataFetchRole,
      logRetention: logs.RetentionDays.SIX_MONTHS,
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

    const startReplication = new lambda.Function(this, 'expertiseDashboard-startReplication', {
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: 'expertiseDashboard-startReplication',
      handler: 'startReplication.lambda_handler',
      layers: [requests, this.psycopg2, pytz],
      code: lambda.Code.fromAsset('lambda/startReplication'),
      timeout: cdk.Duration.minutes(15),
      role: this.dataFetchRole,
      logRetention: logs.RetentionDays.SIX_MONTHS,
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

    const institutionCleanInvoke = new tasks.LambdaInvoke(this, 'Clean Institution Data', {
      lambdaFunction: institutionClean,
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
    /* 
    any step that's fetching from the Elsevier's API should NOT run in parallel 
    due to a very strict API throttling of 2 requests/second https://dev.elsevier.com/api_key_settings.html
    */
    const cleanNoMatchesMap = new sfn.Map(this, 'Missing Matches Map', {
      maxConcurrency: 1,
      itemsPath: '$'
    });
    cleanNoMatchesMap.iterator(cleanNoMatchesInvoke);
    
    const identifyDuplicatesInvoke = new tasks.LambdaInvoke(this, 'Perform Additional Comparisons Duplicate Profiles', {
      lambdaFunction: identifyDuplicates,
      outputPath: '$.Payload',
    });
    /* 
    any step that's fetching from any Elsevier's API should NOT run in parallel 
    due to a very strict API throttling of 2 requests/second https://dev.elsevier.com/api_key_settings.html
    */
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
    /* 
    any step that's fetching from any Elsevier's API should NOT run in parallel 
    due to a very strict API throttling of 2 requests/second https://dev.elsevier.com/api_key_settings.html
    */
    const publicationMap = new sfn.Map(this, 'Publication Map', {
      maxConcurrency: 1,
      itemsPath: '$'
    });
    publicationMap.iterator(publicationFetchInvoke);

    const replicationStartInvoke = new tasks.LambdaInvoke(this, 'Start DMS Replication', {
      lambdaFunction: startReplication,
      outputPath: '$.Payload',
    });

    const mergeKeywordsInvoke = new tasks.GlueStartJobRun(this, 'Create Merged Keywords', {
      glueJobName: grantDataStack.mergeKeywordsJobName,
    });

    const dataFetchDefinition = scopusCleanInvoke
      .next(institutionCleanInvoke)
      .next(compareNamesMap)
      .next(cleanNoMatchesMap)
      .next(identifyDuplicatesMap)
      .next(researcherFetchInvoke)
      .next(elsevierFetchInvoke)
      .next(orcidFetchInvoke)
      .next(publicationMap)
      .next(mergeKeywordsInvoke)
      .next(replicationStartInvoke);
    
    const dataFetch = new sfn.StateMachine(this, 'expertiseDashboard-DataFetchStateMachine', {
      definitionBody: sfn.DefinitionBody.fromChainable(dataFetchDefinition),
    });

    // Give the lambdas permission to access the S3 Bucket
    s3Bucket.grantReadWrite(scopusClean);
    s3Bucket.grantReadWrite(institutionClean);
    s3Bucket.grantReadWrite(compareNames);
    s3Bucket.grantReadWrite(cleanNoMatches);
    s3Bucket.grantReadWrite(identifyDuplicates);
    s3Bucket.grantReadWrite(researcherFetch);
    s3Bucket.grantReadWrite(new iam.AccountRootPrincipal());
  }
}
