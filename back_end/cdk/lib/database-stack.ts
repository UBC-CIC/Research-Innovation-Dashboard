import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { aws_rds as rds } from 'aws-cdk-lib';
import { VpcStack } from './vpc-stack';

export class DatabaseStack extends Stack {
    public readonly dbInstance: rds.DatabaseInstance;
    public readonly secretPath: string;

    constructor(scope: Construct, id: string, vpcStack: VpcStack, props?: StackProps) {
      super(scope, id, props);

    this.secretPath = 'vpri/credentials/dbCredentials';

    const parameterGroup = new rds.ParameterGroup(this, "rdsParameterGroup", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13_4,
      }),
      description: "Custom Parameter Group To Allow DMS Replication",
      parameters: {
        "rds.logical_replication": "1",
      }
    })

    // Define the postgres database
    this.dbInstance = new rds.DatabaseInstance(this, 'db-instance', {
      vpc: vpcStack.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO,
      ),
      credentials: rds.Credentials.fromGeneratedSecret('postgres', {
        secretName: this.secretPath
      }),
      multiAz: true,
      allocatedStorage: 100,
      maxAllocatedStorage: 105,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: true,
      databaseName: 'vpriDatabase',
      publiclyAccessible: false,
      parameterGroup: parameterGroup,
    });

    this.dbInstance.connections.securityGroups.forEach(function (securityGroup) {
      securityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/16'), ec2.Port.tcp(5432), 'Postgres Ingress');
    });
  }
}