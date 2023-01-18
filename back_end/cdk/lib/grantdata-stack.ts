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

export class GrantDataStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    vpcStack: VpcStack,
    databaseStack: DatabaseStack,
    props?: StackProps
  ) {
    super(scope, id, props);

    // Create new Glue  Role
    const roleName = "AWSGlueServiceRole-ShellJob";
    const glueRole = new iam.Role(this, roleName, {
      assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
      description: "Glue Service Role for various resources",
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

    // Create S3 bucket for Glue Job scripts/data
    const glueS3Bucket = new s3.Bucket(this, "glue-s3-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // create S3 bucket for the grant data
    const grantDataS3Bucket = new s3.Bucket(this, "grant-data-s3-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // create folder structure for the user to upload grant CSV files
    const createFolders = new triggers.TriggerFunction(this, "createFolders", {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: "createGrantFolders.lambda_handler",
      code: lambda.Code.fromAsset("lambda/create-grant-folders"),
      timeout: cdk.Duration.minutes(1),
      memorySize: 512,
      vpc: vpcStack.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      environment: {
        BUCKET_NAME: grantDataS3Bucket.bucketName,
      },
    });
    createFolders.addToRolePolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
        resources: [`arn:aws:s3:::${grantDataS3Bucket.bucketName}/*`],
      })
    );
    createFolders.executeAfter(grantDataS3Bucket);

    // Lambda function to trigger Glue jobs
    const glueTrigger = new lambda.Function(this, "s3-glue-trigger", {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: "s3GlueTrigger.lambda_handler",
      code: lambda.Code.fromAsset("lambda/s3-glue-trigger"),
      timeout: cdk.Duration.minutes(1),
      memorySize: 512,
      vpc: vpcStack.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    glueTrigger.addToRolePolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["glue:*"],
        resources: ["*"],
      })
    );

    glueTrigger.addToRolePolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "s3:ListBucketVersions",
          "s3:ListBucket",
          "s3:ListObjectsV2",
          "s3:ListMultipartUploadParts",
          "s3:ListObjectVersions",
        ],
        resources: ["*"],
      })
    );

    // grant permission for s3 to invoke lambda
    glueTrigger.addPermission("s3-invoke", {
      principal: new iam.ServicePrincipal("s3.amazonaws.com"),
      action: "lambda:InvokeFunction",
      sourceAccount: this.account,
      sourceArn: grantDataS3Bucket.bucketArn,
    });

    // add s3 event to invoke lambda

    // raw cihr data
    grantDataS3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(glueTrigger),
      {
        prefix: "raw/cihr",
        suffix: ".csv",
      }
    );

    // clean cihr data
    grantDataS3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(glueTrigger),
      {
        prefix: "clean/cihr",
        suffix: ".csv",
      }
    );

    // ids-assigned cihr data
    grantDataS3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(glueTrigger),
      {
        prefix: "ids-assigned/cihr",
        suffix: ".csv",
      }
    );

    // raw nserc data
    grantDataS3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(glueTrigger),
      {
        prefix: "raw/nserc",
        suffix: ".csv",
      }
    );

    // clean nserc data
    grantDataS3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(glueTrigger),
      {
        prefix: "clean/nserc",
        suffix: ".csv",
      }
    );

    // ids-assigned nserc data
    grantDataS3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(glueTrigger),
      {
        prefix: "ids-assigned/nserc",
        suffix: ".csv",
      }
    );

    // raw sshrc data
    grantDataS3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(glueTrigger),
      {
        prefix: "raw/sshrc",
        suffix: ".csv",
      }
    );

    // clean sshrc data
    grantDataS3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(glueTrigger),
      {
        prefix: "clean/sshrc",
        suffix: ".csv",
      }
    );

    // ids-assigned sshrc data
    grantDataS3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(glueTrigger),
      {
        prefix: "ids-assigned/sshrc",
        suffix: ".csv",
      }
    );

    // raw cfi data
    grantDataS3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(glueTrigger),
      {
        prefix: "raw/cfi",
        suffix: ".csv",
      }
    );

    // clean cfi data
    grantDataS3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(glueTrigger),
      {
        prefix: "clean/cfi",
        suffix: ".csv",
      }
    );

    // ids-assigned cfi data
    grantDataS3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(glueTrigger),
      {
        prefix: "ids-assigned/cfi",
        suffix: ".csv",
      }
    );

    // Put pyjarowinkler whl file to glue S3 bucket
    new s3deploy.BucketDeployment(this, "DeployGlueJobExtraLibs", {
      sources: [
        s3deploy.Source.asset("./glue/extra-python-lib/downloaded_modules"),
        s3deploy.Source.asset("./glue/extra-python-lib/custom_modules/dist"),
      ],
      exclude: [".DS_Store"],
      destinationBucket: glueS3Bucket,
      destinationKeyPrefix: "extra-python-libs",
    });

    // Create a Connection to the PostgreSQL database inside the VPC
    const glueConnectionName = "vpri-postgres-conn";
    const databaseSecret = sm.Secret.fromSecretNameV2(
      this,
      "databaseSecret",
      databaseStack.secretPath
    );
    const host = databaseSecret.secretValueFromJson("host").unsafeUnwrap();
    const dbname = databaseSecret.secretValueFromJson("dbname").unsafeUnwrap();
    const connectionProperties: { [key: string]: any } = {
      JDBC_ENFORCE_SSL: "true",
      JDBC_CONNECTION_URL: "jdbc:postgresql://" + host + ":5432/" + dbname,
      SKIP_CUSTOM_JDBC_CERT_VALIDATION: "true",
      SECRET_ID: databaseStack.secretPath,
      KAFKA_SSL_ENABLED: "false",
    };
    const publicSubnetId = vpcStack.vpc.publicSubnets[0].subnetId;
    const securityGroup = vpcStack.vpc.vpcDefaultSecurityGroup;
    const glueConnection = new glue.CfnConnection(this, glueConnectionName, {
      catalogId: this.account, // this AWS account ID
      connectionInput: {
        name: glueConnectionName,
        description: "a connection to the vpri PostgreSQL database for Glue",
        connectionType: "JDBC",
        connectionProperties: connectionProperties,
        physicalConnectionRequirements: {
          availabilityZone: vpcStack.availabilityZones[0],
          securityGroupIdList: [securityGroup],
          subnetId: publicSubnetId,
        },
      },
    });

    // a parameter at deployment time for the institution name filter of CFI grant data
    const cfiInstitutionName = new cdk.CfnParameter(
      this,
      "cfiInstitutionName",
      {
        type: "String",
        description:
          "The name of the Institution that you want to filter for the CFI grant data.",
      }
    );

    // define a Glue Python Shell Job to clean the raw grant data
    const PYTHON_VER = "3.9";
    const GLUE_VER = "3.0";
    const MAX_RETRIES = 0; // no retries, only execute once
    const MAX_CAPACITY = 0.0625; // 1/16 of a DPU, lowest setting
    const MAX_CONCURRENT_RUNS = 7; // 4 concurrent runs of the same job simultaneously
    const TIMEOUT = 120; // 120 min timeout duration
    const defaultArguments = {
      "--extra-py-files": `s3://${glueS3Bucket.bucketName}/extra-python-libs/pyjarowinkler-1.8-py2.py3-none-any.whl,s3://${glueS3Bucket.bucketName}/extra-python-libs/custom_utils-0.1-py3-none-any.whl`,
      "library-set": "analytics",
      "--SECRET_NAME": databaseStack.secretPath,
      "--BUCKET_NAME": grantDataS3Bucket.bucketName,
      "--CFI_INSTITUTION_NAME": cfiInstitutionName.valueAsString,
    };

    // Glue Job: clean cihr data
    const cleanCihrJobName = "clean-cihr-pythonshell";
    const cleanCihrJob = new glue.CfnJob(this, cleanCihrJobName, {
      name: cleanCihrJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/" +
          cleanCihrJobName +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: 1,
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Glue Job: clean nserc data
    const cleanNsercJobName = "clean-nserc-pythonshell";
    const cleanNsercJob = new glue.CfnJob(this, cleanNsercJobName, {
      name: cleanNsercJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/" +
          cleanNsercJobName +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: 1,
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Glue Job: clean sshrc data
    const cleanSshrcJobName = "clean-sshrc-pythonshell";
    const cleanSshrcJob = new glue.CfnJob(this, cleanSshrcJobName, {
      name: cleanSshrcJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/" +
          cleanSshrcJobName +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: 1,
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Glue Job: clean cfi data
    const cleanCfiJobName = "clean-cfi-pythonshell";
    const cleanCfiJob = new glue.CfnJob(this, cleanCfiJobName, {
      name: cleanCfiJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/" +
          cleanCfiJobName +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: 1,
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Glue Job: name-match and assign ids
    const assignIdsJobName = "assign-ids-pythonshell";
    const assignIdsJob = new glue.CfnJob(this, assignIdsJobName, {
      name: assignIdsJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/" +
          assignIdsJobName +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
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

    // Glue Job: store data into table in database
    const storeDataJobName = "store-data-pythonshell";
    const storeDataJob = new glue.CfnJob(this, storeDataJobName, {
      name: storeDataJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          glueS3Bucket.bucketName +
          "/scripts/" +
          storeDataJobName +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
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
    cleanCihrJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    cleanNsercJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    cleanSshrcJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    cleanCfiJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    assignIdsJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    storeDataJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    createFolders.applyRemovalPolicy(RemovalPolicy.DESTROY);
    glueTrigger.applyRemovalPolicy(RemovalPolicy.DESTROY);
    glueConnection.applyRemovalPolicy(RemovalPolicy.DESTROY);
    glueRole.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
