#!/usr/bin/env node
import 'source-map-support/register';
//import * as cdk from '@aws-cdk/core';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { OpensearchStack } from '../lib/opensearch-stack';
import { FargateStack } from '../lib/fargate-stack';
import { DmsStack } from '../lib/dms-stack';
import { AppsyncStack } from '../lib/appsync-stack'
import { DatabaseStack } from '../lib/database-stack';
import { DataFetchStack } from '../lib/datafetch-stack';


const app = new cdk.App();

const vpcStack = new VpcStack(app, "VpcStack");
const databaseStack = new DatabaseStack(app, 'DatabaseStack', vpcStack);
const dataFetchStack = new DataFetchStack(app, 'DataFetchStack');
const openSearchStack = new OpensearchStack(app, "OpensearchStack", vpcStack);
const dmsStack = new DmsStack(app, 'DmsStack', vpcStack, openSearchStack, databaseStack)
const fargateStack = new FargateStack(app, 'FargateStack', vpcStack, databaseStack);
const appsyncStack = new AppsyncStack(app, 'AppsyncStack', openSearchStack, vpcStack, databaseStack);