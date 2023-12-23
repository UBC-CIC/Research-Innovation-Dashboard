import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps, RemovalPolicy, SecretValue } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { aws_rds as rds } from 'aws-cdk-lib';
import { VpcStack } from './vpc-stack';
import * as logs from 'aws-cdk-lib/aws-logs'
import * as sm from 'aws-cdk-lib/aws-secretsmanager'

export class DatabaseStack extends Stack {
    public readonly dbInstance: rds.DatabaseInstance;
    public readonly secretPath: string;
    public readonly secretPathUser: sm.Secret;
    public readonly secretPathAdminName: string;

    constructor(scope: Construct, id: string, vpcStack: VpcStack, props?: StackProps) {
      super(scope, id, props);

    this.secretPathAdminName = "expertiseDashboard/adminCredentials/dbCredentials"; // Name in the Secret Manager to store admin/master DB credentials
    this.secretPath = 'expertiseDashboard/credentials/dbCredentials'; // Name in the Secret Manager to store limited permission user DB credentials

    this.secretPathUser = new sm.Secret(this, this.secretPath, {
        secretName: this.secretPath,
        description: "Secrets for clients to connect to RDS",
        removalPolicy: RemovalPolicy.DESTROY,
        secretObjectValue: {
            username: SecretValue.unsafePlainText(""),
            password: SecretValue.unsafePlainText("")
        }
    });

    const parameterGroup = new rds.ParameterGroup(this, "rdsParameterGroup", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_5,
      }),
      description: "Custom Parameter Group To Allow DMS Replication",
      parameters: {
        "rds.logical_replication": "1",
      }
    })

    // Database secret with customized username retrieve at deployment time
    const dbUsername = sm.Secret.fromSecretNameV2(this, 'expertiseDashboard-dbUsername', 'expertiseDashboard-dbUsername')

    // Define the postgres database
    this.dbInstance = new rds.DatabaseInstance(this, 'expertiseDashboard', {
      vpc: vpcStack.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_5,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MEDIUM,
      ),
      credentials: rds.Credentials.fromUsername(dbUsername.secretValueFromJson("username").unsafeUnwrap() , {
        secretName: this.secretPathAdminName
      }),
      multiAz: true,
      allocatedStorage: 100,
      maxAllocatedStorage: 115,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      deletionProtection: true,
      databaseName: 'expertiseDashboard',
      publiclyAccessible: false,
      parameterGroup: parameterGroup,
      cloudwatchLogsRetention: logs.RetentionDays.INFINITE,
      storageEncrypted: true, // storage encryption at rest
      monitoringInterval: cdk.Duration.seconds(60) // enhanced monitoring interval
    });

    this.dbInstance.connections.securityGroups.forEach(function (securityGroup) {
      securityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/16'), ec2.Port.tcp(5432), 'Postgres Ingress');
    });
  }
}