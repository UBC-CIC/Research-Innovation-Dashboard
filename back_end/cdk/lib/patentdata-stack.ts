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

export class PatentDataStack extends Stack {
  
    public readonly ops_apikey: string;
  
    constructor(
    scope: Construct,
    id: string,
    grantDataStack: GrantDataStack,
    vpcStack: VpcStack,
    props?: StackProps
  ) {
    super(scope, id, props);

    // Create new Glue Role. DO NOT RENAME THE ROLE!!!
    const roleName = "AWSGlueServiceRole-PatentData";
    const glueRole = new iam.Role(this, roleName, {
      assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
      description: "Glue Service Role for Patent ETL",
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

    // create S3 bucket for the patent data
    const patentDataS3Bucket = new s3.Bucket(this, "expertiseDashboard-patent-data-s3-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      serverAccessLogsPrefix: "accessLog"
    });

    // reuse Glue bucket from grant to store glue Script
    const glueS3Bucket = grantDataStack.glueS3Bucket;
    // reuse Glue Connection's name
    const glueConnectionName = grantDataStack.glueConnectionName;
    // reuse Glue DMS Connection's name
    const glueDmsConnectionName = grantDataStack.glueDmsConnectionName;

    // a parameter at deployment time for the institution name filter of EPO patent data
    const epoInstitutionName = new cdk.CfnParameter(
      this,
      "epoInstitutionName",
      {
        type: "String",
        description:
          "The name of the Institution that you want to filter for the EPO patent data.",
      }
    );

    // define a Glue Python Shell Job
    this.ops_apikey  = "expertiseDashboard/credentials/opsApi"
    const PYTHON_VER = "3.9";
    const GLUE_VER = "3.0";
    const MAX_RETRIES = 0; // no retries, only execute once
    const MAX_CAPACITY = 0.0625; // 1/16 of a DPU, lowest setting
    const MAX_CONCURRENT_RUNS = 7; // 7 concurrent runs of the same job simultaneously
    const TIMEOUT = 120; // 120 min timeout duration
    const defaultArguments = {
      "--extra-py-files": `s3://${glueS3Bucket.bucketName}/extra-python-libs/pyjarowinkler-1.8-py2.py3-none-any.whl,s3://${glueS3Bucket.bucketName}/extra-python-libs/custom_utils-0.1-py3-none-any.whl`,
      "library-set": "analytics",
      "--DB_SECRET_NAME": grantDataStack.secretPath,
      "--API_SECRET_NAME": this.ops_apikey,
      "--TEMP_BUCKET_NAME": patentDataS3Bucket.bucketName,
      "--EPO_INSTITUTION_NAME": epoInstitutionName.valueAsString,
      "--FILE_PATH": "",
      "--EQUIVALENT": "false",
      "--DMS_TASK_ARN": grantDataStack.dmsTaskArn

    };

    // Glue Job: fetch EPO patent data from OPS API
    const fetchEpoPatentsJobName = "expertiseDashboard-fetchEpoPatents";
    const fetchEpoPatentsJob = new glue.CfnJob(this, fetchEpoPatentsJobName, {
      name: fetchEpoPatentsJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/patents-etl/" +
          "fetchEpoPatents" +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Glue Job: fetch equivalent EPO patent data from OPS API
    const fetchEquivalentEpoPatentsJobName = "expertiseDashboard-fetchEquivalentEpoPatents";
    const fetchEquivalentEpoPatentsJob = new glue.CfnJob(this, fetchEquivalentEpoPatentsJobName, {
      name: fetchEquivalentEpoPatentsJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/patents-etl/" +
          "fetchEquivalentEpoPatents" +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Glue Job: clean EPO patent data
    const cleanEpoPatentsJobName = "expertiseDashboard-cleanEpoPatents";
    const cleanEpoPatentsJob = new glue.CfnJob(this, cleanEpoPatentsJobName, {
      name: cleanEpoPatentsJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/patents-etl/" +
          "cleanEpoPatents" +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Glue Job: assign Ids to EPO patent data
    const assignIdsEpoPatentsJobName = "expertiseDashboard-assignIdsEpoPatents";
    const assignIdsEpoPatentsJob = new glue.CfnJob(this, assignIdsEpoPatentsJobName, {
      name: assignIdsEpoPatentsJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/patents-etl/" +
          "assignIdsEpoPatents" +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
      },
      connections: {
        connections: [glueConnectionName]
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Glue Job: store EPO patent data
    const storeEpoPatentsJobName = "expertiseDashboard-storeEpoPatents";
    const storeEpoPatentsJob = new glue.CfnJob(this, storeEpoPatentsJobName, {
      name: storeEpoPatentsJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/patents-etl/" +
          "storeEpoPatents" +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
      },
      connections: {
        connections: [glueConnectionName]
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Glue Job: clean cfi data
    const startDmsReplicationTaskJobName = "expertiseDashboard-startDmsReplicationTask-patent";
    const startDmsReplicationTaskJob = new glue.CfnJob(this, startDmsReplicationTaskJobName, {
      name: startDmsReplicationTaskJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/patents-etl/" +
          "startDmsReplicationTask-patent" +
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
      sources: [s3deploy.Source.asset("./glue/scripts/patents-etl")],
      destinationBucket: glueS3Bucket,
      destinationKeyPrefix: "scripts/patents-etl",
    });

    // Grant S3 read/write role to Glue
    glueS3Bucket.grantReadWrite(glueRole);
    patentDataS3Bucket.grantReadWrite(glueRole);

    // Create a CRON scheduler to start the pipeline
    const cfnTrigger = new glue.CfnTrigger(this, 'Patent-ETL-scheduler', {
        actions: [{
          jobName: fetchEpoPatentsJobName,
          timeout: TIMEOUT
        }],
        type: 'SCHEDULED',
        name: "Patent-ETL-scheduler",
        description: "Scheduled run for Patent ETL pipeline",
        startOnCreation: true,
        schedule: "cron(0 7 1,15 * ? *)" // run at 7:00 AM UTC on the 1st and 15th of every month
      });

    // Destroy Glue related resources when PatentDataStack is deleted
    fetchEpoPatentsJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    fetchEquivalentEpoPatentsJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    cleanEpoPatentsJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    assignIdsEpoPatentsJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    storeEpoPatentsJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    startDmsReplicationTaskJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    glueRole.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
