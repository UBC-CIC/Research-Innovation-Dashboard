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
import { DataFetchStack } from './datafetch-stack';

export class AppsyncStack extends Stack {
  constructor(scope: Construct, id: string, opensearchStack: OpensearchStack, vpcStack: VpcStack, databaseStack: DatabaseStack, dataFetchStack: DataFetchStack, props?: StackProps) {
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
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface",
        "ec2:AssignPrivateIpAddresses",
        "ec2:UnassignPrivateIpAddresses"
      ],
      resources: ['*'] // must be *
    }));
    lambdaRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        //Logs
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ],
      resources: ["arn:aws:logs:*:*:*"]
    }));
    lambdaRole.addToPolicy(new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          //Secrets Manager
          "secretsmanager:GetSecretValue",
        ],
        resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:expertiseDashboard/credentials/*`]
    }));

    // The layer containing the postgres library
    const postgresLayer = new lambda.LayerVersion(this, 'postgres', {
      code: lambda.Code.fromAsset('./layers/postgres.zip'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_16_X],
      description: 'Contains the postgres library',
    });

    // Create the postgresql db query function.
    const queryDbFunction = new lambda.Function(this, 'expertiseDashboard-postgresQuery', {
      functionName: "expertiseDashboard-postgresQuery",
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(300),
      role: lambdaRole,
      memorySize: 512,
      environment: {
          "SM_DB_CREDENTIALS": databaseStack.secretPath,
      },
      vpc: vpcStack.vpc,
      code: lambda.Code.fromAsset('./lambda/postgresQuery/'),
      layers: [postgresLayer]
    });

    // Create Lambdas for Knowledge Graph db queries
    const fetchResearcherNodes = new lambda.Function(this, 'expertiseDashboard-fetchResearcherNodes', {
      functionName: "expertiseDashboard-fetchResearcherNodes",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'fetchResearcherNodes.lambda_handler',
      timeout: cdk.Duration.seconds(300),
      role: lambdaRole,
      memorySize: 512,
      vpc: vpcStack.vpc,
      code: lambda.Code.fromAsset('lambda/fetchResearcherNodes'),
      layers: [dataFetchStack.psycopg2]
    });

    const getSimilarResearchers = new lambda.Function(this, 'expertiseDashboard-getSimilarResearchers', {
      functionName: "expertiseDashboard-getSimilarResearchers",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'getSimilarResearchers.lambda_handler',
      timeout: cdk.Duration.seconds(300),
      role: lambdaRole,
      memorySize: 512,
      vpc: vpcStack.vpc,
      code: lambda.Code.fromAsset('lambda/getSimilarResearchers'),
      layers: [dataFetchStack.psycopg2]
    });

    const fetchResearcherInformation = new lambda.Function(this, 'expertiseDashboard-fetchResearcherInformation', {
      functionName: "expertiseDashboard-fetchResearcherInformation",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'fetchResearcherInformation.lambda_handler',
      timeout: cdk.Duration.seconds(300),
      role: lambdaRole,
      memorySize: 512,
      vpc: vpcStack.vpc,
      code: lambda.Code.fromAsset('lambda/fetchResearcherInformation'),
      layers: [dataFetchStack.psycopg2]
    });

    const fetchEdgesFromPostgres = new lambda.Function(this, 'expertiseDashboard-fetchEdgesFromPostgres', {
      functionName: "expertiseDashboard-fetchEdgesFromPostgres",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'fetchEdgesFromPostgres.lambda_handler',
      timeout: cdk.Duration.seconds(300),
      role: lambdaRole,
      memorySize: 512,
      vpc: vpcStack.vpc,
      code: lambda.Code.fromAsset('lambda/fetchEdgesFromPostgres'),
      layers: [dataFetchStack.psycopg2]
    });

    const getSharedPublications = new lambda.Function(this, 'expertiseDashboard-getSharedPublications', {
      functionName: "expertiseDashboard-getSharedPublications",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'getSharedPublications.lambda_handler',
      timeout: cdk.Duration.seconds(300),
      role: lambdaRole,
      memorySize: 512,
      vpc: vpcStack.vpc,
      code: lambda.Code.fromAsset('lambda/getSharedPublications'),
      layers: [dataFetchStack.psycopg2]
    });

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
                        resources: [opensearchStack.opensearchFunction.functionArn, 
                                    queryDbFunction.functionArn,
                                    fetchResearcherNodes.functionArn,
                                    getSimilarResearchers.functionArn,
                                    fetchResearcherInformation.functionArn,
                                    fetchEdgesFromPostgres.functionArn,
                                    getSharedPublications.functionArn]
                    })
                ]
            }),
        },
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

    //Create Knowledge Graph Appsync Data Sources
    const fetchResearcherNodesDataSource = new appsync.CfnDataSource(this, 'fetchResearcherNodesDataSource', {
      apiId: APIID,
      name: "fetchResearcherNodesDataSource",
      type: "AWS_LAMBDA",
      lambdaConfig: {
        lambdaFunctionArn: fetchResearcherNodes.functionArn
      },
      serviceRoleArn: appsyncLambdaServiceRole.roleArn
    });

    const getSimilarResearchersDataSource = new appsync.CfnDataSource(this, 'getSimilarResearchersDataSource', {
      apiId: APIID,
      name: "getSimilarResearchersDataSource",
      type: "AWS_LAMBDA",
      lambdaConfig: {
        lambdaFunctionArn: getSimilarResearchers.functionArn
      },
      serviceRoleArn: appsyncLambdaServiceRole.roleArn
    });

    const fetchResearcherInformationDataSource = new appsync.CfnDataSource(this, 'fetchResearcherInformationDataSource', {
      apiId: APIID,
      name: "fetchResearcherInformationDataSource",
      type: "AWS_LAMBDA",
      lambdaConfig: {
        lambdaFunctionArn: fetchResearcherInformation.functionArn
      },
      serviceRoleArn: appsyncLambdaServiceRole.roleArn
    });

    const fetchEdgesFromPostgresDataSource = new appsync.CfnDataSource(this, 'fetchEdgesFromPostgresDataSource', {
      apiId: APIID,
      name: "fetchEdgesFromPostgresDataSource",
      type: "AWS_LAMBDA",
      lambdaConfig: {
        lambdaFunctionArn: fetchEdgesFromPostgres.functionArn
      },
      serviceRoleArn: appsyncLambdaServiceRole.roleArn
    });

    const getSharedPublicationsDataSource = new appsync.CfnDataSource(this, 'getSharedPublicationsDataSource', {
      apiId: APIID,
      name: "getSharedPublicationsDataSource",
      type: "AWS_LAMBDA",
      lambdaConfig: {
        lambdaFunctionArn: getSharedPublications.functionArn
      },
      serviceRoleArn: appsyncLambdaServiceRole.roleArn
    });
    
    //Upload the right schema to appsync
    const apiSchema = new appsync.CfnGraphQLSchema(this, 'MyCfnGraphQLSchema', {
      apiId: APIID,

      definition: `
      type Catagories {
        researcherCount: Int
        publicationCount: Int
        grantCount: Int
        patentCount: Int
      }
      
      type Department {
        prime_department: String
      }
      
      type Edge {
        attributes: EdgeAttributes
        key: String
        source: String
        target: String
        undirected: Boolean
      }
      
      type EdgeAttributes {
        color: String
        sharedPublications: [String]
        size: Float
      }
      
      type Faculty {
        prime_faculty: String
      }
      
      type Impact {
        h_index: Float
        num_citations: Int
        preferred_name: String
        prime_department: String
        prime_faculty: String
        scopus_id: String
        total_grant_amount: Int
        researcher_id: String
      }
      
      type Links {
        key: String!
        numPublications: Int!
        source: String!
        target: String!
      }
      
      type PotentialResearcher {
        firstName: String
        lastName: String
        id: String
        faculty: String
        sharedKeywords: [String]
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
      
      type PublicationForGraph {
        authors: String
        journal: String
        link: String
        title: String
        yearPublished: String
      }
      
      type Researcher {
        researcher_id: String
        institution_user_id: String
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
      
      type ResearcherAttributes {
        color: String!
        label: String
      }
      
      type ResearcherElsevier {
        h_index: Float
        id: ID!
        num_citations: Int
        num_documents: Int
      }
      
      type ResearcherForGraph {
        department: String!
        email: String!
        faculty: String!
        firstName: String!
        id: String!
        keywords: String!
        lastName: String!
        rank: String!
      }
      
      type ResearcherFull {
        areas_of_interest: String
        campus: String
        email: String
        first_name: String
        h_index: Float
        merged_keywords: String
        job_stream: String
        keywords: String!
        last_name: String
        last_updated: String
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
      }
      
      type ResearcherNode {
        attributes: ResearcherAttributes
        key: String
      }
      
      type ResearcherOpenSearch {
        researcher_id: String
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
      
      type grant {
        assigned_id: String!
        agency: String!
        amount: Int
        department: String
        end_date: String
        grant_program: String
        keywords: String
        name: String!
        project_title: String
        start_date: String
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
      
      type lastUpdated {
        last_updated: String
        preferred_name: String
      }
      
      type patent {
        patent_title: String
        patent_sponsors: String
        patent_classification: String
        patent_family_number: String
        patent_inventors: String
        patent_number: String
        patent_publication_date: String
        inventors_assigned_ids: String
        matched_inventors_names: String
      }
      
      type pubsPerYear {
        count: String
        year_published: String
      }
      
      type totalPubsPerFaculty {
        faculty: String
        sum: Int
      }
      
      type updatePublicationsLogType {
        date_updated: String
        number_of_publications_updated: Int
      }
      
      type wordCloud {
        text: String
        value: Int
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
      
      type Query {
        advancedSearchGrants(
          includeAllTheseWords: String!,
          includeAnyOfTheseWords: String!,
          includeTheseExactWordsOrPhrases: String!,
          noneOfTheseWords: String!,
          table: String!
        ): [grant]
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
        allPublicationsPerFacultyQuery: [totalPubsPerFaculty]
        facultyMetrics(faculty: String!): [facultyMetric]
        getAllDepartments: [String]
        getAllDistinctJournals: [String]
        getAllFaculty: [String]
        getAllResearchersImpacts: [Impact]
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
        searchPublications(search_value: String!, journalsToFilterBy: [String]!): [Publication]
        searchResearcher(search_value: String!, departmentsToFilterBy: [String]!, facultiesToFilterBy: [String]!): [ResearcherOpenSearch]
        similarResearchers(researcher_id: String!): [ResearcherOpenSearch]
        totalPublicationPerYear: [pubsPerYear]
        wordCloud(gte: Int!, lte: Int!): [wordCloud]
        changeScopusId(oldScopusId: String!, newScopusId: String!): Boolean
        lastUpdatedResearchersList: [lastUpdated]
        getUpdatePublicationsLogs: [updatePublicationsLogType]
        searchGrants(search_value: String!, grantAgenciesToFilterBy: [String]!): [grant]
        searchPatents(search_value: String!, patentClassificationFilter: [String]!): [patent]
        otherResearchersWithKeyword(keyword: String!): [ResearcherOpenSearch]
        getAllGrantAgencies: [String]
        getFlaggedIds: [[Researcher]]
        getResearcherImpactsByDepartment(prime_department: String!): [Impact]
        getResearcherImpactsByFaculty(prime_faculty: String!): [Impact]
        getResearcherPatents(id: ID!): [patent]
        getResearcherGrants(id: ID!): [grant]
        getCatagoriesCount: Catagories
        getEdges(facultiesToFilterOn: [String], keyword: String): [Edge]
        getResearcherForGraph(id: String!): ResearcherForGraph
        getResearchers(facultiesToFilterOn: [String], keyword: String): [ResearcherNode]
        getSharedPublications(id1: String!, id2: String!): [PublicationForGraph]
        getSimilarResearchers(researcher_id: String!): [PotentialResearcher]
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
    SearchResearcherResolver.addDependency(opensearchDataSource);
    SearchResearcherResolver.addDependency(apiSchema);

    const SearchPublicationsResolver = new appsync.CfnResolver(this, 'searchPublications', {
      apiId: APIID,
      fieldName: 'searchPublications',
      typeName: 'Query',
      dataSourceName: opensearchDataSource.name,
    });
    SearchPublicationsResolver.addDependency(opensearchDataSource);
    SearchPublicationsResolver.addDependency(apiSchema);

    const SearchGrantsResolver = new appsync.CfnResolver(this, 'searchGrants', {
      apiId: APIID,
      fieldName: 'searchGrants',
      typeName: 'Query',
      dataSourceName: opensearchDataSource.name,
    });
    SearchGrantsResolver.addDependency(opensearchDataSource);
    SearchGrantsResolver.addDependency(apiSchema);

    const SearchPatentsResolver = new appsync.CfnResolver(this, 'searchPatents', {
      apiId: APIID,
      fieldName: 'searchPatents',
      typeName: 'Query',
      dataSourceName: opensearchDataSource.name,
    });
    SearchPatentsResolver.addDependency(opensearchDataSource);
    SearchPatentsResolver.addDependency(apiSchema);

    const SimilarResearchersResolver = new appsync.CfnResolver(this, 'similarResearchers', {
      apiId: APIID,
      fieldName: 'similarResearchers',
      typeName: 'Query',
      dataSourceName: opensearchDataSource.name,
    });
    SimilarResearchersResolver.addDependency(opensearchDataSource);
    SimilarResearchersResolver.addDependency(apiSchema);

    const AdvancedSearchResearchersResolver = new appsync.CfnResolver(this, 'advancedSearchResearchers', {
      apiId: APIID,
      fieldName: 'advancedSearchResearchers',
      typeName: 'Query',
      dataSourceName: opensearchDataSource.name,
    });
    AdvancedSearchResearchersResolver.addDependency(opensearchDataSource);
    AdvancedSearchResearchersResolver.addDependency(apiSchema);

    const AdvancedSearchPublicationsResolver = new appsync.CfnResolver(this, 'advancedSearchPublications', {
      apiId: APIID,
      fieldName: 'advancedSearchPublications',
      typeName: 'Query',
      dataSourceName: opensearchDataSource.name,
    });
    AdvancedSearchPublicationsResolver.addDependency(opensearchDataSource);
    AdvancedSearchPublicationsResolver.addDependency(apiSchema);

    const AdvancedSearchGrantsResolver = new appsync.CfnResolver(this, 'advancedSearchGrants', {
      apiId: APIID,
      fieldName: 'advancedSearchGrants',
      typeName: 'Query',
      dataSourceName: opensearchDataSource.name,
    });
    AdvancedSearchGrantsResolver.addDependency(opensearchDataSource);
    AdvancedSearchGrantsResolver.addDependency(apiSchema);

    const OtherResearchersWithKeywordResolver = new appsync.CfnResolver(this, 'otherResearchersWithKeyword', {
      apiId: APIID,
      fieldName: 'otherResearchersWithKeyword',
      typeName: 'Query',
      dataSourceName: opensearchDataSource.name,
    });
    OtherResearchersWithKeywordResolver.addDependency(opensearchDataSource);
    OtherResearchersWithKeywordResolver.addDependency(apiSchema);

    //Create all the Knowledge Graph resolvers for the schema
    const getResearchersResolver = new appsync.CfnResolver(this, 'getResearchers', {
      apiId: APIID,
      fieldName: 'getResearchers',
      typeName: 'Query',
      dataSourceName:fetchResearcherNodesDataSource.name,
    });
    getResearchersResolver.addDependency(fetchResearcherNodesDataSource);
    getResearchersResolver.addDependency(apiSchema);

    const getSimilarResearchersResolver = new appsync.CfnResolver(this, 'getSimilarResearchers', {
      apiId: APIID,
      fieldName: 'getSimilarResearchers',
      typeName: 'Query',
      dataSourceName:getSimilarResearchersDataSource.name,
    });
    getSimilarResearchersResolver.addDependency(getSimilarResearchersDataSource);
    getSimilarResearchersResolver.addDependency(apiSchema);
    
    const getResearcherForGraphResolver = new appsync.CfnResolver(this, 'getResearcherForGraph', {
      apiId: APIID,
      fieldName: 'getResearcherForGraph',
      typeName: 'Query',
      dataSourceName:fetchResearcherInformationDataSource.name,
    });
    getResearcherForGraphResolver.addDependency(fetchResearcherInformationDataSource);
    getResearcherForGraphResolver.addDependency(apiSchema);

    const getEdgesResolver = new appsync.CfnResolver(this, 'getEdges', {
      apiId: APIID,
      fieldName: 'getEdges',
      typeName: 'Query',
      dataSourceName:fetchEdgesFromPostgresDataSource.name,
    });
    getEdgesResolver.addDependency(fetchEdgesFromPostgresDataSource);
    getEdgesResolver.addDependency(apiSchema);

    const getSharedPublicationsResolver = new appsync.CfnResolver(this, 'getSharedPublications', {
      apiId: APIID,
      fieldName: 'getSharedPublications',
      typeName: 'Query',
      dataSourceName:getSharedPublicationsDataSource.name,
    });
    getSharedPublicationsResolver.addDependency(getSharedPublicationsDataSource);
    getSharedPublicationsResolver.addDependency(apiSchema);

    //Create all the PostgreSQL resolvers
    let postgresqlDBQueryList = ["allPublicationsPerFacultyQuery", "facultyMetrics", "getAllDepartments",
    "getAllDistinctJournals", "getAllFaculty", "getAllResearchersImpacts", "getNumberOfResearcherPubsAllYears",
    "getNumberOfResearcherPubsLastFiveYears", "getPub", "getResearcher", "getResearcherElsevier", "getResearcherFull",
    "getResearcherOrcid", "getResearcherPubsByCitations", "getResearcherPubsByTitle", "getResearcherPubsByYear",
    "getResearcherImpactsByDepartment", "getResearcherImpactsByFaculty", "totalPublicationPerYear", "wordCloud",
    "changeScopusId", "lastUpdatedResearchersList", "getUpdatePublicationsLogs", "getFlaggedIds", "getResearcherGrants", 
    "getAllGrantAgencies", "getResearcherPatents", "getCatagoriesCount"];

    for(var i = 0; i<postgresqlDBQueryList.length; i++){
      const resolver = new appsync.CfnResolver(this, postgresqlDBQueryList[i], {
        apiId: APIID,
        fieldName: postgresqlDBQueryList[i],
        typeName: 'Query',
        dataSourceName: postgresqlDataSource.name,
      });
      resolver.addDependency(postgresqlDataSource);
      resolver.addDependency(apiSchema);
    }

    // Waf Firewall
    const waf = new wafv2.CfnWebACL(this, 'waf', {
      description: 'waf for Expertise Dashboard',
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: { 
        sampledRequestsEnabled: true, 
        cloudWatchMetricsEnabled: true,
        metricName: 'expertiseDashboard-firewall'
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
      resourceArn: `arn:aws:appsync:${this.region}:${this.account}:apis/${APIID}`,
      webAclArn: waf.attrArn
    });
  }
}