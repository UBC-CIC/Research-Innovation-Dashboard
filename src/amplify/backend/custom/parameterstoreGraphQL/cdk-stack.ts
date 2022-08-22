import * as cdk from '@aws-cdk/core';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
import * as ssm from '@aws-cdk/aws-ssm';
import { AmplifyDependentResourcesAttributes } from '../../types/amplify-dependent-resources-ref';

export class cdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps, amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps) {
    super(scope, id, props);
    /* Do not remove - Amplify CLI automatically injects the current deployment environment in this input parameter */
    new cdk.CfnParameter(this, 'env', {
      type: 'String',
      description: 'Current Amplify CLI env name',
    });
    /* AWS CDK code goes here - learn more: https://docs.aws.amazon.com/cdk/latest/guide/home.html */
    // Access other Amplify Resources 
  
    const dependencies:AmplifyDependentResourcesAttributes = AmplifyHelpers.addResourceDependency(this, 
      amplifyResourceProps.category, 
      amplifyResourceProps.resourceName, 
      [
        {category: 'api', resourceName: "vpriinnovationdashbo"},
      ]
    );
    const GraphQLAPIIdOutput = cdk.Fn.ref(dependencies.api.vpriinnovationdashbo.GraphQLAPIIdOutput)
    const GraphQLAPIEndpointOutput = cdk.Fn.ref(dependencies.api.vpriinnovationdashbo.GraphQLAPIEndpointOutput)
    /* AWS CDK code goes here - learn more: https://docs.aws.amazon.com/cdk/latest/guide/home.html */
    new ssm.StringParameter(this, 'ParameterStoreGraphQLAPIIdOutput', {
      parameterName: 'VPRIGraphQLAPIIdOutput',
      stringValue: GraphQLAPIIdOutput,
    });
    new ssm.StringParameter(this, 'ParameterStoreGraphQLAPIEndpointOutput', {
      parameterName: 'VPRIGraphQLAPIEndpointOutput',
      stringValue: GraphQLAPIEndpointOutput,
    });
  }
  }