import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_rds as rds } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_iam as iam} from 'aws-cdk-lib';
import  { aws_s3 as s3 } from 'aws-cdk-lib'
import { aws_s3_deployment as deployment } from 'aws-cdk-lib';
import { aws_stepfunctions as sfn} from 'aws-cdk-lib';
import { aws_stepfunctions_tasks as tasks} from 'aws-cdk-lib';

export class DataFetchStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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

    /*
      Define Lambdas and add correct permissions
    */
    const scopusClean = new lambda.Function(this, 'scopusClean', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'scopusClean.lambda_handler',
      code: lambda.Code.fromAsset('lambda/scopusClean'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
    });
    scopusClean.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonS3FullAccess',
      ),
    );

    const ubcClean = new lambda.Function(this, 'ubcClean', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'ubcClean.lambda_handler',
      code: lambda.Code.fromAsset('lambda/ubcClean'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
    });
    ubcClean.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonS3FullAccess',
      ),
    );

    const compareNames = new lambda.Function(this, 'compareNames', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'compareNames.lambda_handler',
      layers: [pyjarowinkler, numpy],
      code: lambda.Code.fromAsset('lambda/compareNames'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
    });
    compareNames.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonS3FullAccess',
      ),
    );

    const cleanNoMatches = new lambda.Function(this, 'cleanNoMatches', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'cleanNoMatches.lambda_handler',
      layers: [pyjarowinkler, requests],
      code: lambda.Code.fromAsset('lambda/cleanNoMatches'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
    });
    cleanNoMatches.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonS3FullAccess',
      ),
    );
    cleanNoMatches.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonSSMReadOnlyAccess',
      ),
    );

    const createTables = new lambda.Function(this, 'createTables', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'createTables.lambda_handler',
      layers: [psycopg2],
      code: lambda.Code.fromAsset('lambda/createTables'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
    });
    createTables.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'SecretsManagerReadWrite',
      ),
    );
   
    const researcherFetch = new lambda.Function(this, 'researcherFetch', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'researcherFetch.lambda_handler',
      layers: [psycopg2, pytz],
      code: lambda.Code.fromAsset('lambda/researcherFetch'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
    });
    researcherFetch.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonS3FullAccess',
      ),
    );
    researcherFetch.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonSSMReadOnlyAccess',
      ),
    );
    researcherFetch.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'SecretsManagerReadWrite',
      ),
    );

    const elsevierFetch = new lambda.Function(this, 'elsevierFetch', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'elsevierFetch.lambda_handler',
      layers: [requests, psycopg2, pytz],
      code: lambda.Code.fromAsset('lambda/elsevierFetch'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        SCIVAL_MAX_AUTHORS: '100',
        SCIVAL_URL: 'https://api.elsevier.com/analytics/scival/author/metrics',
        SCOPUS_MAX_AUTHORS: '25',
        SCOPUS_URL: 'https://api.elsevier.com/content/author',
      },
    });
    elsevierFetch.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonSSMReadOnlyAccess',
      ),
    );
    elsevierFetch.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'SecretsManagerReadWrite',
      ),
    );

    const orcidFetch = new lambda.Function(this, 'orcidFetch', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'orcidFetch.lambda_handler',
      layers: [requests, psycopg2, pytz],
      code: lambda.Code.fromAsset('lambda/orcidFetch'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        ORCID_URL: 'http://pub.orcid.org/'
      },
    });
    orcidFetch.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonSSMReadOnlyAccess',
      ),
    );
    orcidFetch.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'SecretsManagerReadWrite',
      ),
    );

    const publicationFetch = new lambda.Function(this, 'publicationFetch', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'publicationFetch.lambda_handler',
      layers: [requests, psycopg2, pytz],
      code: lambda.Code.fromAsset('lambda/publicationFetch'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        RESULTS_PER_PAGE: '25',
        SCOPUS_SEARCH_URL: 'https://api.elsevier.com/content/search/scopus'
      },
    });
    publicationFetch.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonSSMReadOnlyAccess',
      ),
    );
    publicationFetch.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'SecretsManagerReadWrite',
      ),
    );

    /*
        Set up name matching step function
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
      maxConcurrency: 40,
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

    const nameMatchDefinition = scopusCleanInvoke
    .next(ubcCleanInvoke)
    .next(compareNamesMap)
    .next(cleanNoMatchesMap);
  
  const nameMatch = new sfn.StateMachine(this, 'Name Match State Machine', {
    definition: nameMatchDefinition,
  });

    /*
        Set up data fetch step function
    */
    const createTablesInvoke = new tasks.LambdaInvoke(this, 'Create DB Tables', {
      lambdaFunction: createTables,
      outputPath: '$.Payload',
    });
    const researcherFetchInvoke = new tasks.LambdaInvoke(this, 'Fetch Researchers', {
      lambdaFunction: researcherFetch,
      outputPath: '$.Payload',
    });
    const researcherMap = new sfn.Map(this, 'Researcher Map', {
      maxConcurrency: 40,
      itemsPath: '$.indices'
    });
    researcherMap.iterator(researcherFetchInvoke);

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
      maxConcurrency: 5,
      itemsPath: '$'
    })
    publicationMap.iterator(publicationFetchInvoke);

    const dataFetchDefinition = createTablesInvoke
      .next(researcherMap)
      .next(elsevierFetchInvoke)
      .next(orcidFetchInvoke)
      .next(publicationMap);
    
    const dataFetch = new sfn.StateMachine(this, 'Data Fetch State Machine', {
      definition: dataFetchDefinition,
    });


  }
}
