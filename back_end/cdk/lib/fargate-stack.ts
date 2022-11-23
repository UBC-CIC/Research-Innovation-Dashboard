import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset, NetworkMode } from 'aws-cdk-lib/aws-ecr-assets';
import path = require('path')
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import { VpcStack } from './vpc-stack';
import { DatabaseStack } from './database-stack';
import { DmsStack } from './dms-stack';
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export class FargateStack extends Stack {
  constructor(scope: Construct, id: string, vpcStack: VpcStack, databaseStack: DatabaseStack, dmsStack: DmsStack,  props?: StackProps) {
    super(scope, id, props);
    
    // Create a cluster to run the scheduled fargate task.
    // The cluster is in the vpc defined above
    const cluster = new ecs.Cluster(this, 'updatePublicationsCluster', {
      vpc: vpcStack.vpc,
      enableFargateCapacityProviders: true,
    });

    //Get secret ARN for policy statement below
    const databaseSecret = secretsmanager.Secret.fromSecretNameV2(this, 'SecretFromName', databaseStack.secretPath);

    //Create a policy to access secret manager
    const accessSecretsManagerPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({ 
          resources: [`arn:aws:secretsmanager:ca-central-1:${this.account}:secret:vpri/credentials/*`],
          actions: ['secretsmanager:GetSecretValue'],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    //Create a policy to start DMS task
    const startDMSTaskPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({ 
          resources: [dmsStack.replicationTask.ref],
          actions: ['dms:StartReplicationTask'],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    //Create a role and attach the secret manager policy to it
    const fargateUpdatePublicationsRole = new iam.Role(this, "fargateUpdatePublicationsRole", {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'This role is used by fargate to run a container and update the databases publications',
      inlinePolicies: {
        accessSecretsManagerPolicy: accessSecretsManagerPolicy,
        startDMSTaskPolicy: startDMSTaskPolicy,
      },
    })

    // Attach the aws managed secrets manager policy to the fargate role
    fargateUpdatePublicationsRole.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, "AmazonSSMReadOnlyAccess", "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess"));

    //Create the fargate task definition and attach the role created above
    //The role allows the container to get the correct credentials and access the db
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      executionRole: fargateUpdatePublicationsRole,
      taskRole: fargateUpdatePublicationsRole,
      memoryLimitMiB: 2048,
      cpu: 1024,
    });

    //Create and attach the docker container to the task
    taskDefinition.addContainer('updatePublicationsContainer', {
      image: ecs.ContainerImage.fromAsset(path.join(__dirname, 'updatePublicationsImage')),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'my-log-group', logRetention: 30 }),
      environment: {
        "DB_CREDENTIALS_PATH": databaseStack.secretPath,
        "Replication_Task_Arn": dmsStack.replicationTask.ref
      }
    });

    //Create a scheduled fargate task that runs at 8:00 UTC on the first of every month
    //The task will run the docker container and update the publications in the database
    const scheduledFargateTask = new ecsPatterns.ScheduledFargateTask(this, 'ScheduledFargateTask', {
      cluster,
      scheduledFargateTaskDefinitionOptions: {taskDefinition: taskDefinition},
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '0',
        month: '*',
        weekDay: 'SAT'
      }),
      subnetSelection: {subnetType: ec2.SubnetType.PUBLIC},
      platformVersion: ecs.FargatePlatformVersion.LATEST,
    });
  }
}