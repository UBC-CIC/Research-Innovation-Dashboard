import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from 'aws-cdk-lib/aws-iam'
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';

export class VpcStack extends Stack {
    public readonly vpc: ec2.Vpc;
    public readonly openSearchVPCPermissions: iam.CfnServiceLinkedRole

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

    // Get default security group for VPC
    const defaultSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, id, this.vpc.vpcDefaultSecurityGroup);

    // Add secrets manager endpoint to VPC
    this.vpc.addInterfaceEndpoint("Secrets Manager Endpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      securityGroups: [defaultSecurityGroup],
      subnets: {subnetType: ec2.SubnetType.PRIVATE_ISOLATED},
    });

    // Add RDS endpoint to VPC
    this.vpc.addInterfaceEndpoint("RDS Endpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.RDS,
      securityGroups: [defaultSecurityGroup],
      subnets: {subnetType: ec2.SubnetType.PRIVATE_ISOLATED},
    });

    // create opensearch service linked role. Without this role you cannot attach a vpc to opensearch
    this.openSearchVPCPermissions = new iam.CfnServiceLinkedRole(this, 'OpenSearchSLR', {
        awsServiceName: 'opensearchservice.amazonaws.com'
    });

    //Create Role For DMS to work
    const role = new iam.Role(this, 'dms-vpc-role', {
      assumedBy: new iam.ServicePrincipal('dms.amazonaws.com'),
      description: 'DMS Role To Create Replication Group',
      roleName: 'dms-vpc-role'
    });

    role.addManagedPolicy(ManagedPolicy.fromManagedPolicyArn(this, 'DMS-VPC-Managed-Policy', 'arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole'));
  }
}