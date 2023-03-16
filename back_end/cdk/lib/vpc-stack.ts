import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from 'aws-cdk-lib/aws-iam'
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { NatProvider } from 'aws-cdk-lib/aws-ec2';
import { triggers } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
export class VpcStack extends Stack {
    public readonly vpc: ec2.Vpc;
    public readonly openSearchVPCPermissions: iam.CfnServiceLinkedRole;
    public readonly glueSecurityGroup: ec2.SecurityGroup;

    constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    ec2.NatProvider.gateway()

    const natGatewayProvider = ec2.NatProvider.gateway()

    // VPC for application
    this.vpc = new ec2.Vpc(this, 'expertiseDashboard-Vpc', {
        cidr: '10.0.0.0/16',
        natGatewayProvider: natGatewayProvider,
        natGateways: 1,
        maxAzs: 2,
        subnetConfiguration: [
          {
            name: 'public-subnet-1',
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            name: 'isolated-subnet-1',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          }
        ],
        gatewayEndpoints: {
          S3: {
            service: ec2.GatewayVpcEndpointAwsService.S3,
          },
        },
    });
    this.vpc.addFlowLog('expertiseDashboard-vpcFlowLog');

    // Create a Self-referencing security group for Glue
    // https://docs.aws.amazon.com/glue/latest/dg/setup-vpc-for-glue-access.html
    this.glueSecurityGroup = new ec2.SecurityGroup(this, "glueSecurityGroup", {
        vpc: this.vpc,
        allowAllOutbound: true,
        description: "Self-referencing security group for Glue",
        securityGroupName: "default-glue-security-group"
      }
    )
    // add self-referencing ingress rule
    this.glueSecurityGroup.addIngressRule(this.glueSecurityGroup, ec2.Port.allTcp(), "self-referencing security group rule");

    // Get default security group for VPC
    const defaultSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, id, this.vpc.vpcDefaultSecurityGroup);

    // Trigger Function to revoke the default ingress rule that allows ALL TRAFFIC
    // Don't know why CDK did that by default
    const revokeIngressDefaultSG = new triggers.TriggerFunction(this, "expertiseDashboard-revokeIngressDefaultSG", {
      runtime: lambda.Runtime.PYTHON_3_9,
      functionName: "expertiseDashboard-revokeIngressDefaultSG",
      handler: "revokeIngressDefaultSG.lambda_handler",
      code: lambda.Code.fromAsset("lambda/revokeIngressDefaultSG"),
      timeout: cdk.Duration.seconds(7),
      vpc: this.vpc,
      environment: {
        SG_ID: defaultSecurityGroup.securityGroupId,
        ACCOUNT_ID: this.account
      },
    });
    revokeIngressDefaultSG.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ec2:RevokeSecurityGroupIngress"],
        resources: [`arn:aws:ec2:ca-central-1:${this.account}:security-group/${defaultSecurityGroup.securityGroupId}`],
      })
    );
    revokeIngressDefaultSG.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ec2:DescribeSecurityGroups"],
        resources: ["*"],
      })
    );
    revokeIngressDefaultSG.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          // CloudWatch Logs
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["arn:aws:logs:*:*:*"],
      })
    );
    revokeIngressDefaultSG.executeAfter(defaultSecurityGroup)

    // Add SSM endpoint to VPC
    this.vpc.addInterfaceEndpoint("SSM Endpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      securityGroups: [defaultSecurityGroup],
      subnets: {subnetType: ec2.SubnetType.PRIVATE_ISOLATED},
    });

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

    // Add Glue endpoint to VPC
    this.vpc.addInterfaceEndpoint("Glue Endpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.GLUE,
      securityGroups: [defaultSecurityGroup],
      subnets: {subnetType: ec2.SubnetType.PRIVATE_ISOLATED}
    });

    // Add Cloudwatch endpoint to VPC
    this.vpc.addInterfaceEndpoint("Cloudwatch Endpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      securityGroups: [defaultSecurityGroup],
      subnets: {subnetType: ec2.SubnetType.PRIVATE_ISOLATED}
    });

    // create opensearch service linked role. Without this role you cannot attach a vpc to opensearch
    this.openSearchVPCPermissions = new iam.CfnServiceLinkedRole(this, 'OpenSearchSLR', {
        awsServiceName: 'opensearchservice.amazonaws.com'
    });

    //Create Role For DMS to work. DO NOT RENAME THE ROLE!!!
    const role = new iam.Role(this, 'dms-vpc-role', {
      assumedBy: new iam.ServicePrincipal('dms.amazonaws.com'),
      description: 'DMS Role To Create Replication Group',
      roleName: 'dms-vpc-role'
    });

    role.addManagedPolicy(ManagedPolicy.fromManagedPolicyArn(this, 'DMS-VPC-Managed-Policy', 'arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole'));

    this.vpc.isolatedSubnets.forEach(({ routeTable: { routeTableId } }, index) => {
      new ec2.CfnRoute(this, 'PrivateSubnetPeeringConnectionRoute' + index, {
        destinationCidrBlock: '0.0.0.0/0',
        routeTableId,
        natGatewayId: natGatewayProvider.configuredGateways[0].gatewayId
      })
    })
  }
}