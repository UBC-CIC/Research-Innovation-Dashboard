import * as cdk from "aws-cdk-lib";
import { CfnDynamicReference, CfnDynamicReferenceService, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { VpcStack } from "./vpc-stack";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as glue from "aws-cdk-lib/aws-glue";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as sm from "aws-cdk-lib/aws-secretsmanager"
import { DatabaseStack } from "./database-stack";

export class GlueStack extends Stack {
  constructor(scope: Construct, id: string, vpcStack: VpcStack, databaseStack: DatabaseStack,props?: StackProps) {
    super(scope, id, props);

    // Create new Glue  Role
    const glueRole = new iam.Role(this, "glue-s3-role", {
      assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
      description:
        "Glue Service Role to Get and Put object to S3 Bucket and other",
      roleName: "glue-service-role",
    });

    // Add AWSGlueServiceRole to role
    const gluePolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      "service-role/AWSGlueServiceRole"
    );
    glueRole.addManagedPolicy(gluePolicy);

    // Create S3 bucket for Glue Job scripts/data
    const glueS3Bucket = new s3.Bucket(this, "glue-s3-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // create S3 bucket for the grant data
    const grantDataS3Bucket = new s3.Bucket(this, "grant-data-s3-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Put pyjarowinkler whl file to glue S3 bucket
    new s3deploy.BucketDeployment(this, "DeployGlueJobExtraLibs", {
      sources: [s3deploy.Source.asset("./glue/extra-python-lib")],
      destinationBucket: glueS3Bucket,
      destinationKeyPrefix: "extra-python-libs",
    });

    // Create a Connection to the PostgreSQL database inside the VPC
    const glueConnectionName = "vpri-postgres-conn";
    const host = "";
    const dbname = "";
    const connectionProperties: { [key: string]: any } = {
      JDBC_ENFORCE_SSL: "true",
      JDBC_CONNECTION_URL:
        "jdbc:postgresql://" + host + ":5432/"+ dbname,
      SKIP_CUSTOM_JDBC_CERT_VALIDATION: "true",
      SECRET_ID: databaseStack.secretPath,
      KAFKA_SSL_ENABLED: "false",
    };
    const publicSubnetId = vpcStack.vpc.publicSubnets[0].subnetId
    const securityGroup = vpcStack.vpc.vpcDefaultSecurityGroup
    const glueConnection = new glue.CfnConnection(this, glueConnectionName, {
      catalogId: this.account, // this AWS account ID
      connectionInput: {
        name: glueConnectionName,
        description: "a connection to the vpri PostgreSQL database for Glue",
        connectionType: "JDBC",
        connectionProperties: connectionProperties,
        physicalConnectionRequirements: {
          availabilityZone: "ca-central-1a",
          securityGroupIdList: [securityGroup],
          subnetId: publicSubnetId,
        },
      },
    });

    // define a Glue Python Shell Job to clean the raw grant data
    const PYTHON_VER = "3.9";
    const GLUE_VER = "3.0";
    const MAX_RETRIES = 0; // no retries, only execute once
    const MAX_CAPACITY = 0.0625; // 1/16 of a DPU, lowest setting
    const TIMEOUT = 120; // 120 min timeout duration
    const defaultArguments: { [key: string]: string } = {
      "--extra-py-files":
        "s3://" +
        glueS3Bucket.bucketName +
        "/extra-python-libs/" +
        "pyjarowinkler-1.8-py2.py3-none-any.whl",
    };

    // Glue Job: clean grant data
    const cleanDataJobName = "clean-data-py-shell";
    const cleanDataJob = new glue.CfnJob(this, cleanDataJobName, {
      name: cleanDataJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/" +
          cleanDataJobName +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: 1,
      },
      connections: {
        connections: [glueConnectionName],
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Glue Job: name-match and assign ids
    const assignIDJobName = "assign-ids-py-shell";
    const assignIDJob = new glue.CfnJob(this, assignIDJobName, {
      name: assignIDJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/" +
          assignIDJobName +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: 1,
      },
      connections: {
        connections: [glueConnectionName],
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Deploy glue job to glue S3 bucket
    new s3deploy.BucketDeployment(this, "DeployGlueJobFiles", {
      sources: [s3deploy.Source.asset("./glue/scripts")],
      destinationBucket: glueS3Bucket,
      destinationKeyPrefix: "scripts",
    });

    // Grant S3 read/write role to Glue
    glueS3Bucket.grantReadWrite(glueRole);
    grantDataS3Bucket.grantReadWrite(glueRole);

    // Destroy Glue related resources when GlueStack is deleted
    // cleanDataJob.applyRemovalPolicy(RemovalPolicy.DESTROY)
    // assignIDJob.applyRemovalPolicy(RemovalPolicy.DESTROY)
    // glueConnection.applyRemovalPolicy(RemovalPolicy.DESTROY)
    // glueRole.applyRemovalPolicy(RemovalPolicy.DESTROY)
    //
  }
}
