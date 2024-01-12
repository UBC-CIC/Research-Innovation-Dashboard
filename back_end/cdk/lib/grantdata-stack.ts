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
import * as logs from "aws-cdk-lib/aws-logs";
import { triggers } from "aws-cdk-lib";
import { DatabaseStack } from "./database-stack";
import { Effect, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { DmsStack } from "./dms-stack";

export class GrantDataStack extends Stack {

  public readonly glueDmsConnection: glue.CfnConnection;
  public readonly glueDmsConnectionName: string;
  public readonly secretPath: string;
  public readonly glueS3Bucket: s3.Bucket;
  public readonly dmsTaskArn: string;
  public readonly mergeKeywordsJob: glue.CfnJob;
  public readonly mergeKeywordsJobName: string;

  constructor(
    scope: Construct,
    id: string,
    vpcStack: VpcStack,
    databaseStack: DatabaseStack,
    dmsStack: DmsStack,
    props?: StackProps
  ) {
    super(scope, id, props);
    this.secretPath = databaseStack.secretPath;
    this.dmsTaskArn = dmsStack.replicationTask.ref

    // Create new Glue Role. DO NOT RENAME THE ROLE!!!
    const roleName = "AWSGlueServiceRole-ShellJob";
    const glueRole = new iam.Role(this, roleName, {
      assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
      description: "Glue Service Role for Grant ETL",
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
      ],
      resources: [this.dmsTaskArn]
    }));
    glueRole.addToPolicy(new iam.PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "dms:DescribeReplicationTasks"
      ],
      resources: ["*"]
    }));

    // Create S3 bucket for Glue Job scripts/data
    this.glueS3Bucket = new s3.Bucket(this, "expertiseDashboard-glue-s3-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // create S3 bucket for the grant data
    const grantDataS3Bucket = new s3.Bucket(this, "expertiseDashboard-grant-data-s3-bucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // create folder structure for the user to upload grant CSV files
    const createFolders = new triggers.TriggerFunction(this, "expertiseDashboard-createFolders", {
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: "expertiseDashboard-createFolders",
      handler: "createGrantFolders.lambda_handler",
      code: lambda.Code.fromAsset("lambda/create-grant-folders"),
      timeout: cdk.Duration.minutes(1),
      memorySize: 512,
      vpc: vpcStack.vpc,
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

    createFolders.addToRolePolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          // CloudWatch Logs
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["arn:aws:logs:*:*:*"],
      })
    );

    createFolders.executeAfter(grantDataS3Bucket);

    // Lambda function to trigger Glue jobs
    const glueTrigger = new lambda.Function(this, "expertiseDashboard-s3-glue-trigger", {
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: "expertiseDashboard-s3-glue-trigger",
      handler: "s3GlueTrigger.lambda_handler",
      code: lambda.Code.fromAsset("lambda/s3-glue-trigger"),
      timeout: cdk.Duration.minutes(1),
      memorySize: 512,
      vpc: vpcStack.vpc,
      logRetention: logs.RetentionDays.SIX_MONTHS,
    });

    glueTrigger.addToRolePolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "glue:GetJob",
          "glue:GetJobs",
          "glue:GetJobRun",
          "glue:GetJobRuns",
          "glue:StartJobRun",
          "glue:UpdateJob"
        ],
        resources: [
          "*" // DO NOT CHANGE
        ],
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
        resources: [
          `arn:aws:s3:::${grantDataS3Bucket.bucketName}`,
          `arn:aws:s3:::${grantDataS3Bucket.bucketName}/*`
        ],
      })
    );

    glueTrigger.addToRolePolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          // CloudWatch Logs
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["arn:aws:logs:*:*:*"],
      })
    );

    glueTrigger.addToRolePolicy(new iam.PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "dms:StartReplicationTask",
        "dms:DescribeReplicationTasks"
      ],
      resources: ["*"] // Do Not change
    }));  

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
      destinationBucket: this.glueS3Bucket,
      destinationKeyPrefix: "extra-python-libs",
    });

    const securityGroup = new ec2.SecurityGroup(this, "glueSecurityGroup", {
      vpc: vpcStack.vpc,
      allowAllOutbound: true,
      description: "Self-referencing security group for Glue",
      securityGroupName: "default-glue-security-group",
    });
    // add self-referencing ingress rule
    securityGroup.addIngressRule(
      securityGroup,
      ec2.Port.allTcp(),
      "self-referencing security group rule"
    );

    // Create a Connection to the PostgreSQL database inside the VPC
    this.glueDmsConnectionName = "postgres-dms-conn";
   
    const dmsConnectionProps: { [key: string]: any } = {
      KAFKA_SSL_ENABLED: "false",
    };
    
    this.glueDmsConnection = new glue.CfnConnection(
      this,
      this.glueDmsConnectionName,
      {
        catalogId: this.account, // this AWS account ID
        connectionInput: {
          name: this.glueDmsConnectionName,
          description: "a connection to the DMS replication instance for Glue",
          connectionType: "NETWORK",
          connectionProperties: dmsConnectionProps,
          physicalConnectionRequirements: {
            availabilityZone: vpcStack.availabilityZones[0],
            securityGroupIdList: [securityGroup.securityGroupId],
            subnetId: databaseStack.dbInstance.vpc.isolatedSubnets[0].subnetId,
          },
        },
      }
    );

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
    const MAX_CONCURRENT_RUNS = 7; // 7 concurrent runs of the same job simultaneously
    const TIMEOUT = 120; // 120 min timeout duration
    const defaultArguments = {
      "--extra-py-files": `s3://${this.glueS3Bucket.bucketName}/extra-python-libs/pyjarowinkler-1.8-py2.py3-none-any.whl,s3://${this.glueS3Bucket.bucketName}/extra-python-libs/custom_utils-0.1-py3-none-any.whl`,
      "library-set": "analytics",
      "--SECRET_NAME": databaseStack.secretPath,
      "--BUCKET_NAME": grantDataS3Bucket.bucketName,
      "--CFI_INSTITUTION_NAME": cfiInstitutionName.valueAsString,
      "--DMS_TASK_ARN": this.dmsTaskArn,
      "--additional-python-modules": "psycopg2-binary"
    };

    // Glue Job: clean cihr data
    const cleanCihrJobName = "expertiseDashboard-clean-cihr";
    const cleanCihrJob = new glue.CfnJob(this, cleanCihrJobName, {
      name: cleanCihrJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          this.glueS3Bucket.bucketName +
          "/scripts/grants-etl/" +
          "cleanCihr" +
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
    const cleanNsercJobName = "expertiseDashboard-clean-nserc";
    const cleanNsercJob = new glue.CfnJob(this, cleanNsercJobName, {
      name: cleanNsercJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          this.glueS3Bucket.bucketName +
          "/scripts/grants-etl/" +
          "cleanNserc" +
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
    const cleanSshrcJobName = "expertiseDashboard-clean-sshrc";
    const cleanSshrcJob = new glue.CfnJob(this, cleanSshrcJobName, {
      name: cleanSshrcJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          this.glueS3Bucket.bucketName +
          "/scripts/grants-etl/" +
          "cleanSshrc" +
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
    const cleanCfiJobName = "expertiseDashboard-clean-cfi";
    const cleanCfiJob = new glue.CfnJob(this, cleanCfiJobName, {
      name: cleanCfiJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          this.glueS3Bucket.bucketName +
          "/scripts/grants-etl/" +
          "cleanCfi" +
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
    const assignIdsJobName = "expertiseDashboard-assignIds";
    const assignIdsJob = new glue.CfnJob(this, assignIdsJobName, {
      name: assignIdsJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          this.glueS3Bucket.bucketName +
          "/scripts/grants-etl/" +
          "assignIds" +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
      },
      connections: {
        connections: [this.glueDmsConnectionName],
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Glue Job: store data into table in database
    const storeDataJobName = "expertiseDashboard-storeData";
    const storeDataJob = new glue.CfnJob(this, storeDataJobName, {
      name: storeDataJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          this.glueS3Bucket.bucketName +
          "/scripts/grants-etl/" +
          "storeData" +
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
      },
      connections: {
        connections: [this.glueDmsConnectionName],
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Glue Job: start dms replication task
    const startDmsReplicationTaskJobName = "expertiseDashboard-startDmsReplicationTask-grant";
    const startDmsReplicationTaskJob = new glue.CfnJob(this, startDmsReplicationTaskJobName, {
      name: startDmsReplicationTaskJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          this.glueS3Bucket.bucketName +
          "/scripts/grants-etl/" +
          "startDmsReplicationTask-grant"+
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
      },
      connections: {
        connections: [this.glueDmsConnectionName],
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: defaultArguments,
    });

    // Glue Job: start dms replication task
    const mergeKeywordsJobName = "expertiseDashboard-mergeKeywords";
    const mergeKeywordsJob = new glue.CfnJob(this, mergeKeywordsJobName, {
      name: mergeKeywordsJobName,
      role: glueRole.roleArn,
      command: {
        name: "pythonshell",
        pythonVersion: PYTHON_VER,
        scriptLocation:
          "s3://" +
          this.glueS3Bucket.bucketName +
          "/scripts/researchers-etl/" +
          "mergeKeywords"+
          ".py",
      },
      executionProperty: {
        maxConcurrentRuns: MAX_CONCURRENT_RUNS,
      },
      connections: {
        connections: [this.glueDmsConnectionName],
      },
      maxRetries: MAX_RETRIES,
      maxCapacity: MAX_CAPACITY,
      timeout: TIMEOUT, // 120 min timeout duration
      glueVersion: GLUE_VER,
      defaultArguments: {
        "--extra-py-files": `s3://${this.glueS3Bucket.bucketName}/extra-python-libs/pyjarowinkler-1.8-py2.py3-none-any.whl,s3://${this.glueS3Bucket.bucketName}/extra-python-libs/custom_utils-0.1-py3-none-any.whl`,
        "library-set": "analytics",
        "--SECRET_NAME": databaseStack.secretPath,
        "--additional-python-modules": "psycopg2-binary"
      }
    });
    this.mergeKeywordsJob = mergeKeywordsJob;
    this.mergeKeywordsJobName = mergeKeywordsJobName;

    // Deploy glue job to glue S3 bucket
    new s3deploy.BucketDeployment(this, "DeployGlueJobFiles", {
      sources: [s3deploy.Source.asset("./glue/scripts/grants-etl")],
      destinationBucket: this.glueS3Bucket,
      destinationKeyPrefix: "scripts/grants-etl",
    });

    // Deploy mergeKeywords glue job to glue S3 bucket
    new s3deploy.BucketDeployment(this, "DeployGlueJobFiles-ResearcherETL", {
      sources: [s3deploy.Source.asset("./glue/scripts/researchers-etl")],
      destinationBucket: this.glueS3Bucket,
      destinationKeyPrefix: "scripts/researchers-etl",
    });

    // Grant S3 read/write role to Glue
    this.glueS3Bucket.grantReadWrite(glueRole);
    grantDataS3Bucket.grantReadWrite(glueRole);

    // Destroy Glue related resources when GrantDataStack is deleted
    cleanCihrJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    cleanNsercJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    cleanSshrcJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    cleanCfiJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    assignIdsJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    storeDataJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    startDmsReplicationTaskJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    mergeKeywordsJob.applyRemovalPolicy(RemovalPolicy.DESTROY);
    createFolders.applyRemovalPolicy(RemovalPolicy.DESTROY);
    glueTrigger.applyRemovalPolicy(RemovalPolicy.DESTROY);
    glueRole.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
