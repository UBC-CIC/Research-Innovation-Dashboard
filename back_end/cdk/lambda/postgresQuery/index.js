let AWS = require("aws-sdk");
let postgres = require("postgres");

let secretsManager = new AWS.SecretsManager();

let { SM_DB_CREDENTIALS } = process.env;

async function handler(event) {
  let sm = await secretsManager.getSecretValue({ SecretId: SM_DB_CREDENTIALS }).promise();
  let credentials = JSON.parse(sm.SecretString);

  let connectionConfig = {
    host: credentials.host,
    port: credentials.port,
    username: credentials.username,
    password: credentials.password,
    database: credentials.dbname,
    ssl: true,
  };
  
  let sql = postgres(connectionConfig);
  let payload = {};
  /*
  if (event.info.parentTypeName === "Mutation") {
    let newPublication = event.arguments.input;
    let [publication] = await sql`INSERT INTO public.publication_data ${sql(newPublication)}`;
    return publication;
  }
  */
  let date = new Date(); //Current Date
  let currentYear = date.getFullYear();
  console.log(event);
    switch(event.info.fieldName) {
    case "getUpdatePublicationsLogs":
      
      let updatePublicationsLogs = await sql`SELECT * FROM update_publications_logs`
      
      payload = updatePublicationsLogs;
      
      break;
      
    case "lastUpdatedResearchersList":
      let researcherList = await sql`SELECT preferred_name, last_updated FROM researcher_data ORDER BY last_updated DESC`
      
      payload = researcherList;
      
      break;
      
    case "changeScopusId":
      let oldScopusId = event.arguments.oldScopusId;
      let newScopusId = event.arguments.newScopusId;
      
      //Update Elsevier Data
      
      await sql `UPDATE elsevier_data SET id=${newScopusId}, num_citations=0, num_documents=0, h_index=0 WHERE id = ${oldScopusId}`
      
      //Update Orchid Data
      
      //Update Researcher Data
      
      //Get keywords for new researcher scopus_id of publications already in the database
      let allPublications = await sql`SELECT * FROM publication_data WHERE ${newScopusId} = ANY(author_ids)`

      console.log(allPublications);
      
      let keywordString = "";
      
      for(let i = 0; i<allPublications.length; i++){
        if(allPublications[i].keywords.length > 0) {
          keywordString = keywordString + allPublications[i].keywords + ", ";
        }
      }
      
      // remove the last two characters which will be ", "
      keywordString = keywordString.slice(0, -2);
      
      console.log(keywordString);
      
      //Update researcher_data for the new scopus_id
      await sql `UPDATE researcher_data SET scopus_id=${newScopusId}, keywords = ${keywordString} WHERE ${oldScopusId} = scopus_id`
      
      break;
    case "getPub":
      console.log("Getting Pub");
      let [publication] = await sql`SELECT * FROM public.publication_data WHERE id = ${event.arguments.id}`;
      payload = { ...publication };
      break;
    case "getResearcherPubsByCitations":
      console.log("Getting Pubs");
      let publications_result;
      let publications = []
      publications_result = await sql`SELECT * FROM public.publication_data WHERE ${event.arguments.id} = ANY (author_ids) ORDER BY cited_by DESC`;
      for (let i = 0; i < Object.keys(publications_result).length; i++) {
        publications[i] = publications_result[i.toString()];
      }
      console.log(publications)
      payload = publications;
      break;
    case "getResearcherPubsByYear":
      console.log("Getting Pubs");
      let publications_result_year;
      let publications_year = []
      publications_result_year = await sql`SELECT * FROM public.publication_data WHERE ${event.arguments.id} = ANY (author_ids) ORDER BY year_published DESC`;
      for (let i = 0; i < Object.keys(publications_result_year).length; i++) {
        publications_year[i] = publications_result_year[i.toString()];
      }
      console.log(publications_year)
      payload = publications_year;
      break;
    case "getResearcherPubsByTitle":
      console.log("Getting Pubs");
      let publications_result_title;
      let publications_title = []
      publications_result_title = await sql`SELECT * FROM public.publication_data WHERE ${event.arguments.id} = ANY (author_ids) ORDER BY title ASC`;
      for (let i = 0; i < Object.keys(publications_result_title).length; i++) {
        publications_title[i] = publications_result_title[i.toString()];
      }
      console.log(publications_title)
      payload = publications_title;
      break;
    case "getResearcher":
      console.log("Getting Researcher");
      let [researcher] = await sql`SELECT * FROM public.researcher_data WHERE scopus_id = ${event.arguments.id}`;
      payload = { ...researcher };
      break;
    case "getResearcherElsevier":
      console.log("Getting Elsevier data");
      let [researcher_elsevier] = await sql`SELECT * FROM public.elsevier_data WHERE id = ${event.arguments.id}`;
      payload = { ...researcher_elsevier };
      break;
    case "getResearcherOrcid":
      console.log("Getting Orcid data");
      let [researcher_orcid] = await sql`SELECT * FROM public.orcid_data WHERE id = ${event.arguments.id}`;
      payload = { ...researcher_orcid };
      break;
    case "getResearcherFull":
      console.log("Getting Researcher Profile");
      let [ubc_data] = await sql`SELECT * FROM public.researcher_data WHERE scopus_id = ${event.arguments.id}`;
      let [elsevier_data] = await sql`SELECT * FROM public.elsevier_data WHERE id = ${ubc_data.scopus_id}`;
      let [orcid_data] = await sql`SELECT * FROM public.orcid_data WHERE id = ${ubc_data.scopus_id}`;
      payload = { ...ubc_data, ...elsevier_data, ...orcid_data };
      payload.last_updated = ubc_data.last_updated;
      delete payload.id;
      break;
    case "getResearcherRankingsByDepartment":
      console.log("Getting Rankings");
      let query_rankings = await sql`SELECT scopus_id, researcher_data.preferred_name, researcher_data.prime_department, elsevier_data.h_index, elsevier_data.num_citations
      FROM researcher_data FULL OUTER JOIN elsevier_data ON researcher_data.scopus_id = elsevier_data.id 
      WHERE researcher_data.prime_department=${event.arguments.prime_department} ORDER BY h_index DESC`;
      let rankings = [];
      for(let i = 0; i<Object.keys(query_rankings).length; i++){
        rankings[i] = query_rankings[i.toString()];
      }
      payload = rankings
      break;
    case "getResearcherRankingsByFaculty":
      console.log("Getting Rankings");
      let faculty_rankings = await sql`SELECT scopus_id, researcher_data.preferred_name, researcher_data.prime_faculty, elsevier_data.h_index, elsevier_data.num_citations, researcher_data.prime_department
      FROM researcher_data FULL OUTER JOIN elsevier_data ON researcher_data.scopus_id = elsevier_data.id 
      WHERE researcher_data.prime_faculty=${event.arguments.prime_faculty} ORDER BY h_index DESC`;
      let fRankings = [];
      for(let i = 0; i<Object.keys(faculty_rankings).length; i++){
        fRankings[i] = faculty_rankings[i.toString()];
      }
      payload = fRankings
      break;
    case "getNumberOfResearcherPubsLastFiveYears":
      let lastFiveYears = [(currentYear-4).toString(),(currentYear-3).toString(),(currentYear-2).toString(),(currentYear-1).toString(),(currentYear).toString()];
      let publicationsPerYear = ["0","0","0","0","0"];
      let theResult = await sql`SELECT  COUNT(*), year_published FROM public.publication_data WHERE ${event.arguments.id} = ANY (author_ids) AND year_published>${currentYear-5} GROUP BY year_published ORDER BY year_published ASC`;
      for(let i = 0; i<Object.keys(theResult).length; i++){
        console.log(theResult[i.toString()].count);
        for(let j = (currentYear-4); j<=currentYear; j++){
          if(j == theResult[i.toString()].year_published){
            publicationsPerYear[j-(currentYear-4)] = theResult[i.toString()].count
          }
        }
      }
      payload = {lastFiveYears: lastFiveYears, publicationsPerYear: publicationsPerYear};
      break;
    case "getNumberOfResearcherPubsAllYears":
      let pubsPerYear = [];
      let yearArray = [];

      let result = await sql`SELECT  COUNT(*), year_published FROM public.publication_data WHERE ${event.arguments.id} = ANY (author_ids) GROUP BY year_published ORDER BY year_published ASC`;
      
      let firstYearPublished = parseInt(result[0].year_published);
      
      while(firstYearPublished<=currentYear){
        yearArray.push(firstYearPublished.toString());
        pubsPerYear.push(0);
        firstYearPublished++;
      }
      
      firstYearPublished = parseInt(result[0].year_published);
      
      for(let i = 0; i<result.length; i++){
        pubsPerYear[parseInt(result[i].year_published)-firstYearPublished] = result[i].count;
      }

      payload = {allyears: yearArray, publicationsPerYear: pubsPerYear};
      break;
    case "getAllDepartments":
      console.log("getting all distinct departments");
      let allDepartments = await sql `SELECT DISTINCT prime_department FROM researcher_data ORDER BY prime_department ASC`
      let departmentsArray = [];
      for(let i = 0; i<allDepartments.length; i++){
        departmentsArray.push(allDepartments[i].prime_department)
      }
      
      for(let i = 0; i<Object.keys(allDepartments).length; i++){
        departmentsArray[i] = allDepartments[i.toString()].prime_department;
      }
      payload = departmentsArray;
      break;
    case "getAllFaculty":
      console.log("getting all distinct Faculty");
      let allFaculty = await sql `SELECT DISTINCT prime_faculty FROM researcher_data ORDER BY prime_faculty ASC`
      let facultyArray = [];
      for(let i = 0; i<allFaculty.length; i++){
        facultyArray.push(allFaculty[i].prime_faculty);
      }
      payload = facultyArray;
      break;
    case "getAllResearchersRankings":
      let allResearchers = await sql `SELECT DISTINCT scopus_id, researcher_data.preferred_name, researcher_data.prime_faculty, researcher_data.prime_department, elsevier_data.h_index, elsevier_data.num_citations
                                      FROM researcher_data FULL OUTER JOIN elsevier_data ON researcher_data.scopus_id = elsevier_data.id 
                                      ORDER BY h_index DESC`
      let allResearchersArray = [];
      for(let i = 0; i<Object.keys(allResearchers).length; i++){
        allResearchersArray[i] = allResearchers[i.toString()];
      }
      payload = allResearchersArray;
      break;
    case "getAllDistinctJournals":
      let distinctJournals = await sql `SELECT DISTINCT journal FROM publication_data ORDER BY journal ASC`
      let distinctJournalsArray = []
      
      for(let i = 0; i<distinctJournals.length; i++){
        distinctJournalsArray.push(distinctJournals[i].journal);
      }

      payload = distinctJournalsArray;
      break;
      
    case "wordCloud":
      const keywordMap = new Map();
      
      let publicationsKeyowrdList = await sql`SELECT keywords from publication_data WHERE year_published BETWEEN ${event.arguments.gte} AND ${event.arguments.lte}`;
      
      for(let i = 0; i<publicationsKeyowrdList.length; i++) {
        if(publicationsKeyowrdList[i].keywords.length != 0) {
          let keywords = publicationsKeyowrdList[i].keywords.split(", ");
          for(let j = 0; j<keywords.length; j++) {
            if(keywordMap.get(keywords[j])){
              keywordMap.set(keywords[j], keywordMap.get(keywords[j])+1)
            }
            else {
              keywordMap.set(keywords[j], 1);
            }
          }
        }
      }
      
      const keywordMapDescending = new Map([...keywordMap].sort((a, b) => b[1] - a[1]));
      
      let top100KeywordsList = [];
      
      let k = 0;
      
      for (var [key, value] of keywordMapDescending.entries()) {
        let wordCloudObject = {text: key, value: value}
        top100KeywordsList.push(wordCloudObject);
        k++;
        if(k == 100){
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
      
      let metrics = await sql`SELECT * FROM faculty_data WHERE faculty=${event.arguments.faculty} ORDER BY year DESC`;
      let resultArray = [];
      
      for(let i = 0; i<metrics.length; i++){
        let object = {faculty: metrics[i].faculty, year: metrics[i].year, num_publications: metrics[i].num_publications}
        resultArray.push(object);
      }
      
      payload = resultArray;
      
      break;
      
    case "totalPublicationPerYear":
      let totalPubsPerYear = await sql`SELECT year_published, COUNT(id) FROM publication_data
                                        GROUP BY year_published
                                        ORDER BY year_published DESC`;
                                        
      payload = totalPubsPerYear;
      
      break;
      
    case "allPublicationsPerFacultyQuery":
      payload = await sql`SELECT faculty, SUM(num_publications) FROM faculty_data
                          GROUP BY faculty
                          ORDER BY SUM(num_publications) DESC`;
                          
      break;
  }

  await sql.end({ timeout: 0 });
  
  return payload;
}

module.exports = { handler };
