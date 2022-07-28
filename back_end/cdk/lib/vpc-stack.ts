import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export class VpcStack extends Stack {
    public readonly vpc: ec2.Vpc;

    constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      env: {
          region: 'ca-central-1'
      },
    });

    // VPC for vpri application
    this.vpc = new ec2.Vpc(this, 'Vpc', {
        cidr: '10.0.0.0/16',
        natGateways: 0,
        maxAzs: 2,
        subnetConfiguration: [
          {
            name: 'public-subnet-1',
            subnetType: ec2.SubnetType.PUBLIC,
            cidrMask: 24,
          },
          {
            name: 'isolated-subnet-1',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            cidrMask: 28,
          }
        ],
    });

    const defaultSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, id, this.vpc.vpcDefaultSecurityGroup);

    this.vpc.addInterfaceEndpoint("Secrets Manager Endpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      securityGroups: [defaultSecurityGroup],
      subnets: {subnetType: ec2.SubnetType.PRIVATE_ISOLATED},
    });

    this.vpc.addInterfaceEndpoint("RDS Endpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.RDS,
      securityGroups: [defaultSecurityGroup],
      subnets: {subnetType: ec2.SubnetType.PRIVATE_ISOLATED},
    });
  }
}