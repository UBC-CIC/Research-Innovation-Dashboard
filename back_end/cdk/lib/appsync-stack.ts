import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { OpensearchStack } from './opensearch-stack';
import { VpcStack } from './vpc-stack';
import { aws_appsync as appsync } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib'
import { ArnPrincipal, Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { DatabaseStack } from './database-stack';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

export class AppsyncStack extends Stack {
  constructor(scope: Construct, id: string, opensearchStack: OpensearchStack, vpcStack: VpcStack, databaseStack: DatabaseStack, props?: StackProps) {
    super(scope, id, props);

    // Get the API ID from paramter Store
    // During Amplify Deployment the APIID is stored in parameter store
    const APIID = ssm.StringParameter.fromStringParameterAttributes(this, 'VPRIGraphQLAPIIdOutput', {
      parameterName: 'VPRIGraphQLAPIIdOutput',
    }).stringValue;

    //Create a role for lambda to access the postgresql database
    const lambdaRole = new Role(this, 'PostgresLambdaRole', {
        roleName: 'PostgresLambdaRole',
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    lambdaRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        //Logs
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        
        //VPC
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface",
        "ec2:AssignPrivateIpAddresses",
        "ec2:UnassignPrivateIpAddresses"
      ],
      resources: ['*']
    }));
    lambdaRole.addToPolicy(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          //Secrets Manager
          "secretsmanager:GetSecretValue",
        ],
        resources: [`arn:aws:secretsmanager:ca-central-1:${this.account}:secret:vpri/credentials/*`]
    }));

    //Create Lamabda Service role for the Appsync datasources
    const appsyncLambdaServiceRole = new Role(this, 'appsyncLambdaServiceRole', {
      roleName: 'appsyncLambdaServiceRole',
        assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
        inlinePolicies: {
            additional: new PolicyDocument({
                statements: [
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: [
                          //Lambda Invoke
                          "lambda:invokeFunction",
                        ],
                        resources: ['*']
                    })
                ]
            }),
        },
    });

    // The layer containing the postgres library
    const postgresLayer = new lambda.LayerVersion(this, 'postgres', {
      code: lambda.Code.fromAsset('./layers/postgres.zip'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_16_X],
      description: 'Contains the postgres library',
    });

    //Get default secuirty group
    const defaultSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, id, vpcStack.vpc.vpcDefaultSecurityGroup);

    // Create the postgresql db query function.
    const queryDbFunction = new lambda.Function(this, 'postgresQuery', {
      functionName: "postgresQuery",
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(300),
      role: lambdaRole,
      memorySize: 512,
      environment: {
          "SM_DB_CREDENTIALS": databaseStack.secretPath,
      },
      securityGroups: [ defaultSecurityGroup ],
      vpc: vpcStack.vpc,
      code: lambda.Code.fromAsset('./lambda/postgresQuery/'),
      layers: [postgresLayer]
    });

    //Create Opensearch Appsync Data Source
    const opensearchDataSource = new appsync.CfnDataSource(this, 'opensearchDataSource', {
      apiId: APIID,
      name: "opensearchDataSource",
      type: "AWS_LAMBDA",
      lambdaConfig: {
        lambdaFunctionArn: opensearchStack.opensearchFunction.functionArn
      },
      serviceRoleArn: appsyncLambdaServiceRole.roleArn
    });

    //Create PostgreSQL Appsync Data Source
    const postgresqlDataSource = new appsync.CfnDataSource(this, 'postgresqlDataSource', {
      apiId: APIID,
      name: "postgresqlDataSource",
      type: "AWS_LAMBDA",
      lambdaConfig: {
        lambdaFunctionArn: queryDbFunction.functionArn
      },
      serviceRoleArn: appsyncLambdaServiceRole.roleArn
    });

    //Upload the right schema to appsync
    const apiSchema = new appsync.CfnGraphQLSchema(this, 'MyCfnGraphQLSchema', {
      apiId: APIID,

      definition: `
      type Department {
        prime_department: String
      }
      
      type Faculty {
        prime_faculty: String
      }
      
      type Mutation {
        putPub(
          authors: [String!],
          id: ID!,
          journal: String,
          keywords: [String],
          title: String!
        ): Publication
      }
      
      type Publication {
        author_ids: [String!]
        author_names: String!
        cited_by: Int
        id: ID!
        journal: String
        keywords: String!
        link: String
        title: String!
        year_published: String
      }

      type grant {
        name: String!
        department: String
        agency: String!
        grant_program: String
        amount: Int
        project_title: String
        keywords: String
        year: String
        start_date: String
        end_date: String
      }
      
      type Query {
        advancedSearchPublications(
          includeAllTheseWords: String!,
          includeAnyOfTheseWords: String!,
          includeTheseExactWordsOrPhrases: String!,
          journal: String!,
          noneOfTheseWords: String!,
          table: String!,
          year_gte: Int!,
          year_lte: Int!
        ): [Publication]
        advancedSearchResearchers(
          includeAllTheseWords: String!,
          includeAnyOfTheseWords: String!,
          includeTheseExactWordsOrPhrases: String!,
          noneOfTheseWords: String!,
          prime_department: String!,
          prime_faculty: String!,
          table: String!
        ): [ResearcherOpenSearch]
        advancedSearchGrants(
          includeAllTheseWords: String!,
          includeAnyOfTheseWords: String!,
          includeTheseExactWordsOrPhrases: String!,
          noneOfTheseWords: String!,
          table: String!
        ): [grant]
        allPublicationsPerFacultyQuery: [totalPubsPerFaculty]
        facultyMetrics(faculty: String!): [facultyMetric]
        getAllDepartments: [String]
        getAllDistinctJournals: [String]
        getAllFaculty: [String]
        getAllResearchersRankings: [Ranking]
        getNumberOfResearcherPubsAllYears(id: ID!): graphDataAllYears
        getNumberOfResearcherPubsLastFiveYears(id: ID!): graphData
        getPub(id: ID!): Publication
        getResearcher(id: ID!): Researcher
        getResearcherElsevier(id: ID!): ResearcherElsevier
        getResearcherFull(id: ID!): ResearcherFull
        getResearcherOrcid(id: ID!): ResearcherOrcid
        getResearcherPubsByCitations(id: ID!): [Publication]
        getResearcherPubsByTitle(id: ID!): [Publication]
        getResearcherPubsByYear(id: ID!): [Publication]
        getResearcherRankingsByDepartment(prime_department: String!): [Ranking]
        getResearcherRankingsByFaculty(prime_faculty: String!): [Ranking]
        searchPublications(search_value: String!, journalsToFilterBy: [String]!): [Publication]
        searchResearcher(search_value: String!, departmentsToFilterBy: [String]!, facultiesToFilterBy: [String]!): [ResearcherOpenSearch]
        similarResearchers(scopus_id: String!): [ResearcherOpenSearch]
        totalPublicationPerYear: [pubsPerYear]
        wordCloud(gte: Int!, lte: Int!): [wordCloud]
        changeScopusId(oldScopusId: String!, newScopusId: String!): Boolean
        lastUpdatedResearchersList: [lastUpdated]
        getUpdatePublicationsLogs: [updatePublicationsLogType]
        getFlaggedIds: [[Researcher]]
        getResearcherGrants(id: ID!): [grant]
        searchGrants(search_value: String!): [grant]
        getAllGrantAgencies: [String]
      }

      type updatePublicationsLogType {
        number_of_publications_updated: Int
        date_updated: String
      }

      type lastUpdated {
        preferred_name: String
        last_updated: String
      }
      
      type Ranking {
        h_index: Float
        num_citations: Int
        preferred_name: String
        prime_department: String
        prime_faculty: String
        scopus_id: String
      }
      
      type Researcher {
        employee_id: String
        areas_of_interest: String
        campus: String
        email: String
        first_name: String
        job_stream: String
        last_name: String
        orcid_id: String
        preferred_name: String
        prime_department: String
        prime_faculty: String
        rank: String
        scopus_id: String!
        second_department: String
        second_faculty: String
      }
      
      type ResearcherElsevier {
        h_index: Float
        id: ID!
        num_citations: Int
        num_documents: Int
      }
      
      type ResearcherFull {
        areas_of_interest: String
        campus: String
        email: String
        first_name: String
        h_index: Float
        job_stream: String
        keywords: String!
        last_name: String
        num_citations: Int
        num_documents: Int
        num_patents_filed: Int
        orcid_id: String
        preferred_name: String
        prime_department: String
        prime_faculty: String
        rank: String
        scopus_id: String!
        second_department: String
        second_faculty: String
        last_updated: String
      }
      
      type ResearcherOpenSearch {
        campus: String
        email: String
        first_name: String
        job_stream: String
        keywords: String
        last_name: String
        preferred_name: String
        prime_department: String
        prime_faculty: String
        rank: String
        scopus_id: String
        second_department: String
        second_faculty: String
      }
      
      type ResearcherOrcid {
        id: ID!
        num_patents_filed: Int
      }
      
      type facultyMetric {
        faculty: String
        num_publications: String
        year: String
      }
      
      type graphData {
        lastFiveYears: [String]
        publicationsPerYear: [String]
      }
      
      type graphDataAllYears {
        allyears: [String]
        publicationsPerYear: [String]
      }
      
      type pubsPerYear {
        count: String
        year_published: String
      }
      
      schema {
        query: Query
        mutation: Mutation
      }
      
      type totalPubsPerFaculty {
        faculty: String
        sum: Int
      }
      
      type wordCloud {
        text: String
        value: Int
      }      
      `
    });

    //Create All the resolvers for the schema
    const SearchResearcherResolver = new appsync.CfnResolver(this, 'searchResearcher', {
      apiId: APIID,
      fieldName: 'searchResearcher',
      typeName: 'Query',
      dataSourceName: opensearchDataSource.name,
    });
    SearchResearcherResolver.addDependsOn(opensearchDataSource);

    const SearchPublicationsResolver = new appsync.CfnResolver(this, 'searchPublications', {
      apiId: APIID,
      fieldName: 'searchPublications',
      typeName: 'Query',
      dataSourceName: opensearchDataSource.name,
    });
    SearchPublicationsResolver.addDependsOn(opensearchDataSource);

    const SearchGrantsResolver = new appsync.CfnResolver(this, 'searchGrants', {
      apiId: APIID,
      fieldName: 'searchGrants',
      typeName: 'Query',
      dataSourceName: opensearchDataSource.name,
    });
    SearchGrantsResolver.addDependsOn(opensearchDataSource);

    const SimilarResearchersResolver = new appsync.CfnResolver(this, 'similarResearchers', {
      apiId: APIID,
      fieldName: 'similarResearchers',
      typeName: 'Query',
      dataSourceName: opensearchDataSource.name,
    });
    SimilarResearchersResolver.addDependsOn(opensearchDataSource);

    const AdvancedSearchResearchersResolver = new appsync.CfnResolver(this, 'advancedSearchResearchers', {
      apiId: APIID,
      fieldName: 'advancedSearchResearchers',
      typeName: 'Query',
      dataSourceName: opensearchDataSource.name,
    });
    AdvancedSearchResearchersResolver.addDependsOn(opensearchDataSource);

    const AdvancedSearchPublicationsResolver = new appsync.CfnResolver(this, 'advancedSearchPublications', {
      apiId: APIID,
      fieldName: 'advancedSearchPublications',
      typeName: 'Query',
      dataSourceName: opensearchDataSource.name,
    });
    AdvancedSearchPublicationsResolver.addDependsOn(opensearchDataSource);

    const AdvancedSearchGrantsResolver = new appsync.CfnResolver(this, 'advancedSearchGrants', {
      apiId: APIID,
      fieldName: 'advancedSearchGrants',
      typeName: 'Query',
      dataSourceName: opensearchDataSource.name,
    });
    AdvancedSearchGrantsResolver.addDependsOn(opensearchDataSource);

    //Create all the PostgreSQL resolvers
    let postgresqlDBQueryList = ["allPublicationsPerFacultyQuery", "facultyMetrics", "getAllDepartments",
    "getAllDistinctJournals", "getAllFaculty", "getAllResearchersRankings", "getNumberOfResearcherPubsAllYears",
    "getNumberOfResearcherPubsLastFiveYears", "getPub", "getResearcher", "getResearcherElsevier", "getResearcherFull",
    "getResearcherOrcid", "getResearcherPubsByCitations", "getResearcherPubsByTitle", "getResearcherPubsByYear",
    "getResearcherRankingsByDepartment", "getResearcherRankingsByFaculty", "totalPublicationPerYear", "wordCloud",
    "changeScopusId", "lastUpdatedResearchersList", "getUpdatePublicationsLogs", "getFlaggedIds", "getResearcherGrants", "getAllGrantAgencies"];

    for(var i = 0; i<postgresqlDBQueryList.length; i++){
      const resolver = new appsync.CfnResolver(this, postgresqlDBQueryList[i], {
        apiId: APIID,
        fieldName: postgresqlDBQueryList[i],
        typeName: 'Query',
        dataSourceName: postgresqlDataSource.name,
      });
      resolver.addDependsOn(postgresqlDataSource);
    }

    // Waf Firewall
    const waf = new wafv2.CfnWebACL(this, 'waf', {
      description: 'waf for VPRI',
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: { 
        sampledRequestsEnabled: true, 
        cloudWatchMetricsEnabled: true,
        metricName: 'vpri-firewall'
      },
      rules: [
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 1,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            }
          },
          overrideAction: { none: {}},
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesCommonRuleSet'
          }
        },
        {
          name: 'LimitRequests1000',
          priority: 2,
          action: {
            block: {}
          },
          statement: {
            rateBasedStatement: {
              limit: 1000,
              aggregateKeyType: "IP"
            }
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'LimitRequests1000'
          }
        },
    ]
    })

    const wafAssociation = new wafv2.CfnWebACLAssociation(this, 'waf-association', {
      resourceArn: `arn:aws:appsync:ca-central-1:${this.account}:apis/${APIID}`,
      webAclArn: waf.attrArn
    });
  }
}