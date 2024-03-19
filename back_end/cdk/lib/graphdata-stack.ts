import * as cdk from "aws-cdk-lib";
import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { VpcStack } from "./vpc-stack";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as iam from "aws-cdk-lib/aws-iam";
import * as glue from "aws-cdk-lib/aws-glue";
import * as sm from "aws-cdk-lib/aws-secretsmanager";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { triggers } from "aws-cdk-lib";
import { DatabaseStack } from "./database-stack";
import { Effect, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { GrantDataStack } from "./grantdata-stack";
import { DataFetchStack } from "./datafetch-stack";

export class GraphDataStack extends Stack {
    constructor(
    scope: Construct,
    id: string,
    grantDataStack: GrantDataStack,
    vpcStack: VpcStack,
    dataFetchRole: iam.Role,
    props?: StackProps
  ) {
    super(scope, id, props);

    // S3 Bucket to store the graph
    // DO NOT CHANGE BUCKET NAME
    const graphBucket = new s3.Bucket(this, 'GraphBucket', {
      bucketName: 'expertise-dashboard-graph-bucket',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    // Create new Glue Role. DO NOT RENAME THE ROLE!!!
    const roleName = "AWSGlueServiceRole-GraphData";
    const glueRole = new iam.Role(this, roleName, {
      assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
      description: "Glue Service Role for Graph ETL",
      roleName: roleName,
    });

    // Add different policies to glue-service-role
    const glueServiceRolePolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AWSGlueServiceRole"
    );
    const glueConsoleFullAccessPolicy =
      iam.ManagedPolicy.fromAwsManagedPolicyName("AWSGlueConsoleFullAccess");
    const glueSecretManagerPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      "SecretsManagerReadWrite"
    );
    const glueAmazonS3FullAccessPolicy =
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess");

    glueRole.addManagedPolicy(glueServiceRolePolicy);
    glueRole.addManagedPolicy(glueConsoleFullAccessPolicy);
    glueRole.addManagedPolicy(glueSecretManagerPolicy);
    glueRole.addManagedPolicy(glueAmazonS3FullAccessPolicy);
    //Create a policy to start DMS task
    glueRole.addToPolicy(new iam.PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "dms:StartReplicationTask",
        "dms:DescribeReplicationTasks"
      ],
      resources: ["*"] // DO NOT CHANGE
    }));

    // reuse Glue bucket from grant to store glue Script
    const glueS3Bucket = grantDataStack.glueS3Bucket;
    // reuse Glue DMS Connection's name
    const glueDmsConnectionName = grantDataStack.glueDmsConnectionName;

    // define a Glue Python Shell Job
    const PYTHON_VER = "3.9";
    const GLUE_VER = "3.0";
    const MAX_RETRIES = 0; // no retries, only execute once
    const MAX_CAPACITY = 0.0625; // 1/16 of a DPU, lowest setting
    const MAX_CONCURRENT_RUNS = 7; // 7 concurrent runs of the same job simultaneously
    const TIMEOUT = 2880; // 2880 min timeout duration
    const defaultArguments = {
      "--extra-py-files": `s3://${glueS3Bucket.bucketName}/extra-python-libs/pyjarowinkler-1.8-py2.py3-none-any.whl,s3://${glueS3Bucket.bucketName}/extra-python-libs/custom_utils-0.1-py3-none-any.whl`,
      "library-set": "analytics",
      "--DB_SECRET_NAME": grantDataStack.secretPath,
      "--FILE_PATH": "",
      "--EQUIVALENT": "false",
      "--DMS_TASK_ARN": grantDataStack.dmsTaskArn,
      "--additional-python-modules": "psycopg2-binary"

    };

    // Glue Job: Create edges/connections for graph
    const createEdgesJobName = "expertiseDashboard-createEdges";
    const createEdgesJob = new glue.CfnJob(this, createEdgesJobName, {
      name: createEdgesJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/graph-etl/" +
          "createEdges" +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
      },
      connections: {
        connections: [glueDmsConnectionName]
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Glue Job: Create similar researchers for graph
    const createSimilarResearchersJobName = "expertiseDashboard-CreateSimilarResearchers";
    const createSimilarResearchersJob = new glue.CfnJob(this, createSimilarResearchersJobName, {
      name: createSimilarResearchersJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/graph-etl/" +
          "CreateSimilarResearchers" +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
      },
      connections: {
        connections: [glueDmsConnectionName]
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Deploy glue job to glue S3 bucket
    new s3deploy.BucketDeployment(this, "DeployGlueJobFiles", {
      sources: [s3deploy.Source.asset("./glue/scripts/graph-etl")],
      destinationBucket: glueS3Bucket,
      destinationKeyPrefix: "scripts/graph-etl",
    });

    // Grant S3 read/write role to Glue
    glueS3Bucket.grantReadWrite(glueRole);

    // Destroy Glue related resources when GraphDataStack is deleted
    createEdgesJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    createSimilarResearchersJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    glueRole.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const createXY = new lambda.Function(this, 'expertiseDashboard-createXYForGraph', {
      runtime: lambda.Runtime.NODEJS_16_X,
      functionName: 'expertiseDashboard-createXYForGraph',
      code: new lambda.AssetCode('lambda/createXYForGraph'),
      handler: 'createXYForGraph.handler',
      role: dataFetchRole,
      environment: {
        'GRAPH_BUCKET': graphBucket.bucketName
      }
    });
  }
}
