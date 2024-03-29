let AWS = require("aws-sdk");
let postgres = require("postgres");

let secretsManager = new AWS.SecretsManager();

let { SM_DB_CREDENTIALS } = process.env;

let sql; // Global variable to hold the database connection

async function initializeConnection() {
  // Retrieve the secret from AWS Secrets Manager
  const secret = await secretsManager
    .getSecretValue({ SecretId: SM_DB_CREDENTIALS })
    .promise();

  const credentials = JSON.parse(secret.SecretString);

  const connectionConfig = {
    host: credentials.host, // using the proxy endpoint instead of db host
    port: credentials.port,
    username: credentials.username,
    password: credentials.password,
    database: credentials.dbname,
    ssl: true,
  };

  // Create the PostgreSQL connection
  sql = postgres(connectionConfig);

  console.log("Database connection initialized");
}

async function handler(event) {
  
  // Initialize the database connection if not already initialized
  if (!sql) {
    await initializeConnection(); 
  }

  let payload = {};
  let scopusId;
  /*
  if (event.info.parentTypeName === "Mutation") {
    let newPublication = event.arguments.input;
    let [publication] = await sql`INSERT INTO public.publication_data ${sql(newPublication)}`;
    return publication;
  }
  */
  let date = new Date(); //Current Date
  let currentYear = date.getFullYear();
  let researcher_id;
  console.log(event);
  switch (event.info.fieldName) {
    case "getFlaggedIds":
      let flaggedResearchersArray = [];

      let flaggedResult =
        await sql`SELECT scopus_id, COUNT(scopus_id) FROM researcher_data
                                    GROUP BY scopus_id
                                    HAVING COUNT(scopus_id) > 1
                                    ORDER BY COUNT(scopus_id) DESC`;

      console.log(flaggedResult);

      for (let i = 0; i < flaggedResult.length; i++) {
        let flaggedResearchersResult =
          await sql`SELECT * FROM researcher_data WHERE scopus_id = ${flaggedResult[i].scopus_id}`;
        console.log(flaggedResearchersResult);
        flaggedResearchersArray.push(flaggedResearchersResult);
      }

      payload = flaggedResearchersArray;

      break;

    case "getUpdatePublicationsLogs":
      let updatePublicationsLogs =
        await sql`SELECT * FROM update_publications_logs`;

      payload = updatePublicationsLogs;

      break;

    case "lastUpdatedResearchersList":
      let researcherList =
        await sql`SELECT preferred_name, last_updated FROM researcher_data ORDER BY last_updated DESC`;

      payload = researcherList;

      break;

    case "changeScopusId":
      let oldScopusId = event.arguments.oldScopusId;
      let newScopusId = event.arguments.newScopusId;

      //Update Elsevier Data

      await sql`UPDATE elsevier_data SET id=${newScopusId}, num_citations=0, num_documents=0, h_index=0 WHERE id = ${oldScopusId}`;

      //Update Orchid Data

      //Update Researcher Data

      //Get keywords for new researcher scopus_id of publications already in the database
      let allPublications =
        await sql`SELECT * FROM publication_data WHERE ${newScopusId} = ANY(author_ids)`;

      console.log(allPublications);

      let keywordString = "";

      for (let i = 0; i < allPublications.length; i++) {
        if (allPublications[i].keywords.length > 0) {
          keywordString = keywordString + allPublications[i].keywords + ", ";
        }
      }

      // remove the last two characters which will be ", "
      keywordString = keywordString.slice(0, -2);

      console.log(keywordString);

      //Update researcher_data for the new scopus_id
      await sql`UPDATE researcher_data SET scopus_id=${newScopusId}, keywords = ${keywordString} WHERE ${oldScopusId} = scopus_id`;

      break;
    case "getPub":
      console.log("Getting Pub");
      let [publication] =
        await sql`SELECT * FROM public.publication_data WHERE id = ${event.arguments.id}`;
      payload = { ...publication };
      break;
    case "getResearcherPubsByCitations":
      console.log("Getting Pubs");
      scopusId = await sql`SELECT scopus_id FROM researcher_data WHERE ${event.arguments.id} = researcher_id`
      let publications_result;
      let publications = []
      publications_result = await sql`SELECT * FROM public.publication_data WHERE ${scopusId[0].scopus_id} = ANY (author_ids) ORDER BY cited_by DESC`;
      for (let i = 0; i < Object.keys(publications_result).length; i++) {
        publications[i] = publications_result[i.toString()];
      }
      console.log(publications);
      payload = publications;
      break;
    case "getResearcherPubsByYear":
      scopusId = await sql`SELECT scopus_id FROM researcher_data WHERE ${event.arguments.id} = researcher_id`
      let publications_result_year;
      let publications_year = []
      publications_result_year = await sql`SELECT * FROM public.publication_data WHERE ${scopusId[0].scopus_id} = ANY (author_ids) ORDER BY year_published DESC`;
      for (let i = 0; i < Object.keys(publications_result_year).length; i++) {
        publications_year[i] = publications_result_year[i.toString()];
      }
      console.log(publications_year);
      payload = publications_year;
      break;
    case "getResearcherPubsByTitle":
      scopusId = await sql`SELECT scopus_id FROM researcher_data WHERE ${event.arguments.id} = researcher_id`
      console.log("Getting Pubs");
      let publications_result_title;
      let publications_title = []
      publications_result_title = await sql`SELECT * FROM public.publication_data WHERE ${scopusId[0].scopus_id} = ANY (author_ids) ORDER BY title ASC`;
      for (let i = 0; i < Object.keys(publications_result_title).length; i++) {
        publications_title[i] = publications_result_title[i.toString()];
      }
      console.log(publications_title);
      payload = publications_title;
      break;
    case "getResearcher":
      console.log("Getting Researcher");
      let [researcher] =
        await sql`SELECT * FROM public.researcher_data WHERE scopus_id = ${event.arguments.id}`;
      payload = { ...researcher };
      break;
    case "getResearcherElsevier":
      console.log("Getting Elsevier data");
      let [researcher_elsevier] =
        await sql`SELECT * FROM public.elsevier_data WHERE id = ${event.arguments.id}`;
      payload = { ...researcher_elsevier };
      break;
    case "getResearcherOrcid":
      console.log("Getting Orcid data");
      let [researcher_orcid] =
        await sql`SELECT * FROM public.orcid_data WHERE id = ${event.arguments.id}`;
      payload = { ...researcher_orcid };
      break;
    case "getResearcherFull":
      console.log("Getting Researcher Profile");
      let [data] = await sql`SELECT * FROM public.researcher_data WHERE researcher_id = ${event.arguments.id}`;
      let [elsevier_data] = await sql`SELECT * FROM public.elsevier_data WHERE id = ${data.scopus_id}`;
      let [orcid_data] = await sql`SELECT * FROM public.orcid_data WHERE id = ${data.scopus_id}`;
      data.keywords = data.keywords.toLowerCase();
      payload = { ...data, ...elsevier_data, ...orcid_data };
      payload.last_updated = data.last_updated;
      delete payload.id;
      break;
    case "getResearcherImpactsByDepartment":
      console.log("Getting Rankings");
      let query_rankings =
      //   await sql`SELECT scopus_id, researcher_data.preferred_name, researcher_data.prime_department, elsevier_data.h_index, elsevier_data.num_citations
      // FROM researcher_data FULL OUTER JOIN elsevier_data ON researcher_data.scopus_id = elsevier_data.id
      // WHERE researcher_data.prime_department=${event.arguments.prime_department} ORDER BY h_index DESC`;
      await sql `SELECT scopus_id, researcher_data.preferred_name, researcher_data.prime_department, elsevier_data.h_index, elsevier_data.num_citations, gd.total_grant_amount, researcher_data.researcher_id
          FROM researcher_data FULL OUTER JOIN elsevier_data ON researcher_data.scopus_id = elsevier_data.id
          LEFT JOIN (
                      SELECT CAST (assigned_id AS text), SUM(amount) AS total_grant_amount
                      FROM grant_data
                      WHERE LEFT(grant_data.year, 4) >= ${(currentYear-4).toString()} AND LEFT(grant_data.year, 4) <= ${currentYear.toString()}
                      GROUP BY assigned_id
                    ) gd ON CAST(researcher_data.researcher_id AS text) = gd.assigned_id
          WHERE researcher_data.prime_department=${event.arguments.prime_department} ORDER BY h_index DESC`;
          
      let rankings = [];
      for (let i = 0; i < Object.keys(query_rankings).length; i++) {
        rankings[i] = query_rankings[i.toString()];
      }
      payload = rankings;
      break;
    case "getResearcherImpactsByFaculty":
      console.log("Getting Rankings");
      let faculty_rankings =
      //   await sql`SELECT scopus_id, researcher_data.preferred_name, researcher_data.prime_faculty, elsevier_data.h_index, elsevier_data.num_citations, researcher_data.prime_department
      // FROM researcher_data FULL OUTER JOIN elsevier_data ON researcher_data.scopus_id = elsevier_data.id 
      // WHERE researcher_data.prime_faculty=${event.arguments.prime_faculty} ORDER BY h_index DESC`;
      
      await sql`SELECT scopus_id, researcher_data.preferred_name, researcher_data.prime_faculty, elsevier_data.h_index, elsevier_data.num_citations, researcher_data.prime_department, gd.total_grant_amount, researcher_data.researcher_id
      FROM researcher_data FULL OUTER JOIN elsevier_data ON researcher_data.scopus_id = elsevier_data.id
      LEFT JOIN (
                      SELECT CAST (assigned_id AS text), SUM(amount) AS total_grant_amount
                      FROM grant_data
                      WHERE LEFT(grant_data.year, 4) >= ${(currentYear-4).toString()} AND LEFT(grant_data.year, 4) <= ${currentYear.toString()}
                      GROUP BY assigned_id
                    ) gd ON CAST(researcher_data.researcher_id AS text) = gd.assigned_id
      WHERE researcher_data.prime_faculty=${event.arguments.prime_faculty} ORDER BY h_index DESC`;
      
      let Rankings = [];
      for (let i = 0; i < Object.keys(faculty_rankings).length; i++) {
        Rankings[i] = faculty_rankings[i.toString()];
      }
      payload = Rankings;
      break;
    case "getNumberOfResearcherPubsLastFiveYears":
      scopusId = await sql`SELECT scopus_id FROM researcher_data WHERE ${event.arguments.id} = researcher_id`
      let lastFiveYears = [(currentYear-4).toString(),(currentYear-3).toString(),(currentYear-2).toString(),(currentYear-1).toString(),(currentYear).toString()];
      let publicationsPerYear = ["0","0","0","0","0"];
      let theResult = await sql`SELECT  COUNT(*), year_published FROM public.publication_data WHERE ${scopusId[0].scopus_id} = ANY (author_ids) AND year_published>${currentYear-5} GROUP BY year_published ORDER BY year_published ASC`;
      for(let i = 0; i<Object.keys(theResult).length; i++){
        console.log(theResult[i.toString()].count);
        for (let j = currentYear - 4; j <= currentYear; j++) {
          if (j == theResult[i.toString()].year_published) {
            publicationsPerYear[j - (currentYear - 4)] =
              theResult[i.toString()].count;
          }
        }
      }
      payload = {
        lastFiveYears: lastFiveYears,
        publicationsPerYear: publicationsPerYear,
      };
      break;
    case "getNumberOfResearcherPubsAllYears":
      let pubsPerYear = [];
      let yearArray = [];
      scopusId = await sql`SELECT scopus_id FROM researcher_data WHERE ${event.arguments.id} = researcher_id`
      let result = await sql`SELECT  COUNT(*), year_published FROM public.publication_data WHERE ${scopusId[0].scopus_id} = ANY (author_ids) GROUP BY year_published ORDER BY year_published ASC`;
      
      let firstYearPublished = parseInt(result[0].year_published);

      while (firstYearPublished <= currentYear) {
        yearArray.push(firstYearPublished.toString());
        pubsPerYear.push(0);
        firstYearPublished++;
      }

      firstYearPublished = parseInt(result[0].year_published);

      for (let i = 0; i < result.length; i++) {
        pubsPerYear[parseInt(result[i].year_published) - firstYearPublished] =
          result[i].count;
      }

      payload = { allyears: yearArray, publicationsPerYear: pubsPerYear };
      break;
    case "getAllDepartments":
      console.log("getting all distinct departments");
      let allDepartments =
        await sql`SELECT DISTINCT prime_department FROM researcher_data ORDER BY prime_department ASC`;
      let departmentsArray = [];
      for (let i = 0; i < allDepartments.length; i++) {
        departmentsArray.push(allDepartments[i].prime_department);
      }

      for (let i = 0; i < Object.keys(allDepartments).length; i++) {
        departmentsArray[i] = allDepartments[i.toString()].prime_department;
      }
      payload = departmentsArray;
      break;
    case "getAllFaculty":
      console.log("getting all distinct Faculty");
      let allFaculty =
        await sql`SELECT DISTINCT prime_faculty FROM researcher_data ORDER BY prime_faculty ASC`;
      let facultyArray = [];
      for (let i = 0; i < allFaculty.length; i++) {
        facultyArray.push(allFaculty[i].prime_faculty);
      }
      payload = facultyArray;
      break;
    case "getAllResearchersImpacts":
      let allResearchers =
        // await sql`SELECT DISTINCT scopus_id, researcher_data.preferred_name, researcher_data.prime_faculty, researcher_data.prime_department, elsevier_data.h_index, elsevier_data.num_citations
        //                               FROM researcher_data FULL OUTER JOIN elsevier_data ON researcher_data.scopus_id = elsevier_data.id 
        //                               ORDER BY h_index DESC`;
        await sql `SELECT DISTINCT scopus_id, researcher_data.preferred_name, researcher_data.prime_faculty, 
                               researcher_data.prime_department, elsevier_data.h_index, elsevier_data.num_citations, 
                               gd.total_grant_amount, researcher_data.researcher_id
               FROM researcher_data
               FULL OUTER JOIN elsevier_data ON researcher_data.scopus_id = elsevier_data.id
               LEFT JOIN (
                              SELECT CAST (assigned_id AS text), SUM(amount) AS total_grant_amount
                              FROM grant_data
                              WHERE LEFT(grant_data.year, 4) >= ${(currentYear-4).toString()} AND LEFT(grant_data.year, 4) <= ${currentYear.toString()}
                              GROUP BY assigned_id
                            ) gd ON CAST(researcher_data.researcher_id AS text) = gd.assigned_id
               ORDER BY h_index DESC`
      let allResearchersArray = [];
      for (let i = 0; i < Object.keys(allResearchers).length; i++) {
        allResearchersArray[i] = allResearchers[i.toString()];
      }
      payload = allResearchersArray;
      break;
    case "getAllDistinctJournals":
      let distinctJournals =
        await sql`SELECT DISTINCT journal FROM publication_data ORDER BY journal ASC`;
      let distinctJournalsArray = [];

      for (let i = 0; i < distinctJournals.length; i++) {
        distinctJournalsArray.push(distinctJournals[i].journal);
      }

      payload = distinctJournalsArray;
      break;

    case "wordCloud":
      const keywordMap = new Map();

      let publicationsKeyowrdList =
        await sql`SELECT keywords from publication_data WHERE year_published BETWEEN ${event.arguments.gte} AND ${event.arguments.lte}`;

      for (let i = 0; i < publicationsKeyowrdList.length; i++) {
        if (publicationsKeyowrdList[i].keywords.length != 0) {
          let keywords = publicationsKeyowrdList[i].keywords.split(", ");
          for (let j = 0; j < keywords.length; j++) {
            if (keywordMap.get(keywords[j])) {
              keywordMap.set(keywords[j], keywordMap.get(keywords[j]) + 1);
            } else {
              keywordMap.set(keywords[j], 1);
            }
          }
        }
      }

      const keywordMapDescending = new Map(
        [...keywordMap].sort((a, b) => b[1] - a[1])
      );

      let top100KeywordsList = [];

      let k = 0;

      for (var [key, value] of keywordMapDescending.entries()) {
        let wordCloudObject = { text: key, value: value };
        top100KeywordsList.push(wordCloudObject);
        k++;
        if (k == 100) {
          break;
        }
      }

      payload = top100KeywordsList;

      break;

    case "facultiesPercentageOfPublications":
      const departmentMap = new Map();

      let researchers = await sql`SELECT COUNT(id), prime_department 
                                  FROM researcher_data 
                                  JOIN publication_data
                                  ON researcher_data.scopus_id = ANY(publication_data.author_ids)
                                  GROUP BY prime_department
                                  ORDER BY COUNT(id) DESC`;

      payload = [];

      break;

    case "facultyMetrics":
      let metrics =
        await sql`SELECT * FROM faculty_data WHERE faculty=${event.arguments.faculty} ORDER BY year DESC`;
      let resultArray = [];

      for (let i = 0; i < metrics.length; i++) {
        let object = {
          faculty: metrics[i].faculty,
          year: metrics[i].year,
          num_publications: metrics[i].num_publications,
        };
        resultArray.push(object);
      }

      payload = resultArray;

      break;

    case "totalPublicationPerYear":
      let totalPubsPerYear =
        await sql`SELECT year_published, COUNT(id) FROM publication_data
                                        GROUP BY year_published
                                        ORDER BY year_published DESC`;

      payload = totalPubsPerYear;

      break;

    case "allPublicationsPerFacultyQuery":
      payload =
        await sql`SELECT faculty, SUM(num_publications) FROM faculty_data
                          GROUP BY faculty
                          ORDER BY SUM(num_publications) DESC`;

      break;

    case "getResearcherGrants":
      //Get our owned id of the researcher in researcher data table
      // Currently the column is mis named it has been fixed.
      let grantResults = await sql`SELECT * from grant_data WHERE assigned_id=${event.arguments.id}`
      
      payload = grantResults
      
      break;

    case "getAllGrantAgencies":
      let agencies = await sql`SELECT DISTINCT agency FROM grant_data`;

      console.log(agencies);

      payload = [];

      for (let i = 0; i < agencies.length; i++) {
        payload.push(agencies[i].agency);
      }
      break;

    case "getCatagoriesCount":
      let researcherCount = await sql`SELECT COUNT(researcher_id) FROM researcher_data`
      let publicationCount = await sql`SELECT COUNT(id) FROM publication_data`
      let grantCount = await sql`SELECT COUNT(grant_id) FROM grant_data`
      let patentCount = await sql`SELECT COUNT(patent_id) FROM patent_data`

      payload = {
        researcherCount: researcherCount[0].count,
        publicationCount: publicationCount[0].count,
        grantCount: grantCount[0].count,
        patentCount: patentCount[0].count
      }

      break;
    
    case "getResearcherPatents":
      researcher_id = await sql`SELECT researcher_id FROM researcher_data WHERE researcher_id=${event.arguments.id}`
      
      researcher_id[0].researcher_id = '%'+researcher_id[0].researcher_id+'%'
      
      let patenetResults = await sql`SELECT * from patent_data WHERE patent_data.inventors_assigned_ids LIKE ${researcher_id[0].researcher_id}`
      
      let patentsObject = {};
      
      let dateCoverterObject = {
        'Jan': 0,
        'Feb': 1,
        'Mar': 2,
        'Apr': 3,
        'May': 4,
        'Jun': 5,
        'Jul': 6,
        'Aug': 7,
        'Sep': 8,
        'Oct': 9,
        'Nov': 10,
        'Dec': 11,
      }
      
      for(let i = 0; i<patenetResults.length; i++) {
        //If the patent family number is in the object update the information
        //Otherwise store it
        
        if(patentsObject[patenetResults[i].patent_family_number]) {
          //If the current stored date is 
          
          let currentStoredDate = patentsObject[patenetResults[i].patent_family_number].patent_publication_date;
          currentStoredDate = currentStoredDate.split("-");
          currentStoredDate = new Date( currentStoredDate[0], dateCoverterObject[currentStoredDate[1]], currentStoredDate[2]);
          
          let newDate = patenetResults[i].patent_publication_date
          newDate = newDate.split("-");
          newDate = new Date( newDate[0], dateCoverterObject[newDate[1]], newDate[2]);
          //If the new date is closer to the present store that data instead
          if(newDate > currentStoredDate) {
            let currentPatentNumberList = patentsObject[patenetResults[i].patent_family_number].patent_number
            patenetResults[i].patent_number = currentPatentNumberList + ", " + patenetResults[i].patent_number
            patentsObject[patenetResults[i].patent_family_number] = patenetResults[i];
          }
        }
        else {
          patentsObject[patenetResults[i].patent_family_number] = patenetResults[i]
        }
      }
      
      patenetResults = []
      
      for (const patent in patentsObject) {
        patenetResults.push(patentsObject[patent])
      }
      
      payload = patenetResults
      
      break;
  
    default:
      console.log("Unexpected Query!")
  }

  //await sql.end({ timeout: 0 });

  return payload;
}

module.exports = { handler };
