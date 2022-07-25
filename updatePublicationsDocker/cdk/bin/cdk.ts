#!/usr/bin/env node
import 'source-map-support/register';
//import * as cdk from '@aws-cdk/core';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { OpensearchStack } from '../lib/opensearch-stack';
import { FargateStack } from '../lib/fargate-stack';
import { DmsStack } from '../lib/dms-stack';
import { AppsyncStack } from '../lib/appsync-stack'

const app = new cdk.App();

const vpcStack = new VpcStack(app, "VpcStack");
const openSearchStack = new OpensearchStack(app, "OpensearchStack", vpcStack);
const dmsStack = new DmsStack(app, 'DmsStack', vpcStack, openSearchStack)
//const fargateStack = new FargateStack(app, 'FargateStack', vpcStack);
const appsyncStack = new AppsyncStack(app, 'AppsyncStack', openSearchStack, vpcStack);