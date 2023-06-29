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

export class UpdatePublicationStack extends Stack {
  
    constructor(
    scope: Construct,
    id: string,
    grantDataStack: GrantDataStack,
    props?: StackProps
  ) {
    super(scope, id, props);

    // Create new Glue Role. DO NOT RENAME THE ROLE!!!
    const roleName = "AWSGlueServiceRole-UpdatePublication";
    const glueRole = new iam.Role(this, roleName, {
      assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
      description: "Glue Service Role for Update Publication",
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
    const glueSSMPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMFullAccess")

    glueRole.addManagedPolicy(glueServiceRolePolicy);
    glueRole.addManagedPolicy(glueConsoleFullAccessPolicy);
    glueRole.addManagedPolicy(glueSecretManagerPolicy);
    glueRole.addManagedPolicy(glueAmazonS3FullAccessPolicy);
    glueRole.addManagedPolicy(glueSSMPolicy)
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

    const PYTHON_VER = "3.9";
    const GLUE_VER = "3.0";
    const MAX_RETRIES = 0; // no retries, only execute once
    const MAX_CAPACITY = 1; // 1/16 of a DPU, lowest setting
    const MAX_CONCURRENT_RUNS = 7; // 7 concurrent runs of the same job simultaneously
    const TIMEOUT = 120; // 120 min timeout duration
    const defaultArguments = {
      "--extra-py-files": `s3://${glueS3Bucket.bucketName}/extra-python-libs/pyjarowinkler-1.8-py2.py3-none-any.whl,s3://${glueS3Bucket.bucketName}/extra-python-libs/custom_utils-0.1-py3-none-any.whl`,
      "library-set": "analytics",
      "--DB_SECRET_NAME": grantDataStack.secretPath,
      "--DMS_TASK_ARN": grantDataStack.dmsTaskArn,
      "--additional-python-modules": "psycopg2-binary"
    };

    // Glue Job: fetch EPO patent data from OPS API
    const updatePublicationsJobName = "expertiseDashboard-updatePublications";
    const updatePublicationsJob = new glue.CfnJob(this, updatePublicationsJobName, {
      name: updatePublicationsJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/researchers-etl/" +
          "updatePublications" +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
      },
      connections: {
        connections: [glueDmsConnectionName] // a Glue NETWORK connection allows you to access any resources inside and outside (the internet) of that VPC
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Glue Job: clean cfi data
    const startDmsReplicationTaskJobName = "expertiseDashboard-startDmsReplicationTask-updatePublications";
    const startDmsReplicationTaskJob = new glue.CfnJob(this, startDmsReplicationTaskJobName, {
      name: startDmsReplicationTaskJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/researchers-etl/" +
          "startDmsReplicationTask-updatePublications" +
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
      sources: [s3deploy.Source.asset("./glue/scripts/researchers-etl")],
      destinationBucket: glueS3Bucket,
      destinationKeyPrefix: "scripts/researchers-etl",
    });

    // Grant S3 read/write role to Glue
    glueS3Bucket.grantReadWrite(glueRole);

    // Create a CRON scheduler to start the pipeline
    const cfnTrigger = new glue.CfnTrigger(this, 'updatePublications-ETL-scheduler', {
        actions: [{
          jobName: updatePublicationsJobName,
          timeout: TIMEOUT
        }],
        type: 'SCHEDULED',
        name: "updatePublications-scheduler",
        description: "Scheduled run for updatePublications",
        startOnCreation: true,
        schedule: "cron(0 0 ? * SAT *)" // run at 12:00 AM UTC every SAT
      });

    // Destroy Glue related resources when PatentDataStack is deleted
    updatePublicationsJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    startDmsReplicationTaskJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    glueRole.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
