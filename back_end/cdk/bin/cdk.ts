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
import { GrantDataStack } from '../lib/grantdata-stack';
import { PatentDataStack } from '../lib/patentdata-stack';
import { UpdatePublicationStack } from '../lib/updatepublication-stack';


const app = new cdk.App();

const vpcStack = new VpcStack(app, "VpcStack", 
    {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});

const databaseStack = new DatabaseStack(app, 'DatabaseStack', vpcStack, 
    {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});

const openSearchStack = new OpensearchStack(app, "OpensearchStack", vpcStack, 
    {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});

const dmsStack = new DmsStack(app, 'DmsStack', vpcStack, openSearchStack, databaseStack, 
    {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});

const grantDataStack = new GrantDataStack(app, 'GrantDataStack', vpcStack, databaseStack, dmsStack,
    {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});
grantDataStack.addDependency(vpcStack)
grantDataStack.addDependency(databaseStack)
grantDataStack.addDependency(dmsStack)

const dataFetchStack = new DataFetchStack(app, 'DataFetchStack', databaseStack, dmsStack, grantDataStack,
    {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});
dataFetchStack.addDependency(databaseStack)

const patentDataStack = new PatentDataStack(app, 'PatentDataStack', grantDataStack, vpcStack,
    {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});
patentDataStack.addDependency(grantDataStack)

const updatePublicationStack = new UpdatePublicationStack(app, 'UpdatePublicationStack', grantDataStack, 
    {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }})
updatePublicationStack.addDependency(grantDataStack)

const fargateStack = new FargateStack(app, 'FargateStack', vpcStack, databaseStack, dmsStack,
    {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});
    
const appsyncStack = new AppsyncStack(app, 'AppsyncStack', openSearchStack, vpcStack, databaseStack, dataFetchStack,
    {env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }});

