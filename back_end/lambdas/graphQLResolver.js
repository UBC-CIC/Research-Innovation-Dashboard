let AWS = require("aws-sdk");
let postgres = require("postgres");

let secretsManager = new AWS.SecretsManager();

let { SM_DB_CREDENTIALS, URL_RDS_PROXY } = process.env;

async function handler(event) {
  let sm = await secretsManager.getSecretValue({ SecretId: SM_DB_CREDENTIALS }).promise();
  let credentials = JSON.parse(sm.SecretString);

  let connectionConfig = {
    host: URL_RDS_PROXY,
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
  console.log(event);
  switch(event.info.fieldName) {
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
      console.log("getting research publications in last 5 years");
      let date = new Date(); //Current Date
      let currentYear = date.getFullYear();
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
    case "getAllDepartments":
      console.log("getting all distinct departments");
      let allDepartments = await sql `SELECT DISTINCT prime_department FROM researcher_data ORDER BY prime_department ASC`
      let departmentsArray = [];
      for(let i = 0; i<Object.keys(allDepartments).length; i++){
        departmentsArray[i] = allDepartments[i.toString()];
      }
      payload = departmentsArray;
      break;
    case "getAllFaculty":
      console.log("getting all distinct Faculty");
      let allFaculty = await sql `SELECT DISTINCT prime_faculty FROM researcher_data ORDER BY prime_faculty ASC`
      let facultyArray = [];
      for(let i = 0; i<Object.keys(allFaculty).length; i++){
        facultyArray[i] = allFaculty[i.toString()];
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

  }

  await sql.end({ timeout: 0 });
  console.log(payload);
  return payload;
}

module.exports = { handler };
