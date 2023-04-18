const { Client, Connection } = require("@opensearch-project/opensearch");
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const aws4 = require("aws4");


exports.handler = async (event) => {
var host = 'https://' + process.env.OPENSEARCH_ENDPOINT

const createAwsConnector = (credentials, region) => {
  class AmazonConnection extends Connection {
      buildRequestObject(params) {
          const request = super.buildRequestObject(params);
          request.service = 'es';
          request.region = region;
          request.headers = request.headers || {};
          request.headers['host'] = request.hostname;

          return aws4.sign(request, credentials);
      }
  }
  return {
      Connection: AmazonConnection
  };
};

const getClient = async () => {
  const credentials = await defaultProvider()();
  return new Client({
      ...createAwsConnector(credentials, 'ca-central-1'),
      node: host,
  });
}

async function search(query, index, numberOfResults) {

  // Initialize the client.
  var client = await getClient();

  var response = await client.search({
    index: index,
    body: query,
    size: numberOfResults
  });
  return response.body.hits.hits;
}

let stringSplitArray;
let queryArray = [];
let filters = [];
let searchResult;
let query;

switch(event.info.fieldName) {
  case "otherResearchersWithKeyword":
    query = {
      query: {
        match_phrase_prefix: {
          keywords: {
              "query": event.arguments.keyword,
          }
        }
      }
    }
    
    searchResult = await search(query, "researcher_data", 50);
    break;
  
  case "searchResearcher":
    let researcherMultiQuery = {
      multi_match: {
        "query": event.arguments.search_value,
        "fields": ["preferred_name^20", "prime_department^10", "prime_faculty^10"],
        "operator": "and",
      }
    }
    
    let keywordQuery = {
      match_phrase: {
        "keywords": event.arguments.search_value
      }
    }
    
    queryArray.push(researcherMultiQuery);
    queryArray.push(keywordQuery);
    
    //Create Researcher Filters
    let departmentsToInclude = event.arguments.departmentsToFilterBy;
    let facultiesToInclude = event.arguments.facultiesToFilterBy;
    
    if(departmentsToInclude.length != 0){
      let queryString = '"' + departmentsToInclude[0] + '"';
      for(let i = 1; i<departmentsToInclude.length; i++){
        queryString += ' | "' +  departmentsToInclude[i] + '"';
      }
      let departmentsFilter = {
        simple_query_string: {
          "query": queryString,
          "fields": ["prime_department"]
        }
      }
      filters.push(departmentsFilter);
    }
    if(facultiesToInclude.length != 0){
      let queryString = '"' + facultiesToInclude[0] + '"';
      for(let i = 1; i<facultiesToInclude.length; i++){
        queryString += ' | "' +  facultiesToInclude[i] + '"';
      }
      let facultyFilter = {
        simple_query_string: {
          "query": queryString,
          "fields": ["prime_faculty"]
        }
      }
      filters.push(facultyFilter);
    }
    
    if(event.arguments.search_value.length == 0){
      queryArray = [{match_all: {}}]
    }
    
    query = {
      query: {
        bool: {
          should: queryArray,
          minimum_should_match: 1,
          filter: filters
        }
      },
    };
    
    console.log(query);
    
    searchResult = await search(query, "researcher_data", 50);
    break;
    
  case "searchPublications":
    let publicationMultiQuery = {
      multi_match: {
        "query": event.arguments.search_value,
        "fields": ["title^30", "journal^20", "author_names^15"],
        "operator": "and",
      }
    }

    let keywordQueryPublications = {
      match_phrase: {
        "keywords": event.arguments.search_value
      }
    }

    queryArray.push(publicationMultiQuery);
    queryArray.push(keywordQueryPublications);
    
    //Create Publication Filters
    let journalsToInclude = event.arguments.journalsToFilterBy;
    
    if(journalsToInclude.length != 0){
      let queryString = '"' + journalsToInclude[0] + '"';
      for(let i = 1; i<journalsToInclude.length; i++){
        queryString += ' | "' +  journalsToInclude[i] + '"';
      }
      let journalsFilter = {
        simple_query_string: {
          "query": queryString,
          "fields": ["journal"]
        }
      }
      filters.push(journalsFilter);
    }
    
    if(event.arguments.search_value.length == 0){
      queryArray = [{match_all: {}}]
    }
    
    query = {
      query: {
        bool: {
          should: queryArray,
          minimum_should_match: 1,
          filter: filters
        }
      },
    };

    searchResult = await search(query, "publication_data", 200);
    console.log(searchResult)
    break;
    
  case "similarResearchers":
    
    console.log(event.arguments.researcher_id)
    
    
    let scopusIDQuery = {
      query: {
        match_phrase: {
          "researcher_id": event.arguments.researcher_id
        }
      }
    }
    
    searchResult = await search(scopusIDQuery, "researcher_data", 10);
    
    let keyWords = searchResult[0]._source.keywords.split(", ");
    
    console.log(keyWords)

    let keywordHashmap = new Map();
    
    for(let i = 0; i<keyWords.length; i++){
      if(keywordHashmap.get(keyWords[i])) {
        keywordHashmap.set(keyWords[i], keywordHashmap.get(keyWords[i]) + 1);
      }
      else {
        keywordHashmap.set(keyWords[i], 1);
      }
    }
    let j = 0;
    
    for (const [key, value] of keywordHashmap) {
      if(j == 1000){
        break;
      }
      let keywordPhraseMatch = {
        match_phrase: {
          keywords: {
            "query": key,
            "boost": value
          }
        }
      };
      queryArray.push(keywordPhraseMatch);
      j++;
    }

    query = {
      query: {
        bool: {
          should: queryArray,
          minimum_should_match: 1,
          must_not: [
            {
              match: {
                researcher_id: event.arguments.researcher_id
              }
            }
          ]
        }
      },
    };
    
    searchResult = await search(query, "researcher_data", 10);
    break;

  case "searchGrants":
    let grantMultiQuery = {
      multi_match: {
        "query": event.arguments.search_value,
        "fields": ["name^4", "project_title^3", "grant_program^2"],
        "operator": "and",
      }
    }

    let keywordQueryGrants = {
      match_phrase: {
        "keywords": event.arguments.search_value
      }
    }
    
    queryArray.push(grantMultiQuery);
    queryArray.push(keywordQueryGrants);
    
    //Create Grant Filters
    let grantsToInclude = event.arguments.grantAgenciesToFilterBy;
    
    if(grantsToInclude.length != 0){
      let queryString = '"' + grantsToInclude[0] + '"';
      for(let i = 1; i<grantsToInclude.length; i++){
        queryString += ' | "' +  grantsToInclude[i] + '"';
      }
      let grantsFilter = {
        simple_query_string: {
          "query": queryString,
          "fields": ["agency"]
        }
      }
      filters.push(grantsFilter);
    }
    
    if(event.arguments.search_value.length == 0){
      queryArray = [{match_all: {}}]
    }

    query = {
      query: {
        bool: {
          should: queryArray,
          minimum_should_match: 1,
          filter: filters
        }
      },
    };

    searchResult = await search(query, "grant_data", 25);
    
    break;
  
  case "searchPatents":
    let patentMultiQuery = {
      multi_match: {
        "query": event.arguments.search_value,
        "fields": ["patent_family_number^100", "patent_number^100", "patent_title^10", "patent_inventors^5", "patent_sponsors"],
        "operator": "and",
      }
    }
    
    queryArray.push(patentMultiQuery);
    
    //Create Patent Filters
    let classificationsToInclude = event.arguments.patentClassificationFilter;
    
    if(classificationsToInclude.length != 0){
      let theQueryString = '"' + classificationsToInclude[0] + '"';
      for(let i = 1; i<classificationsToInclude.length; i++){
        theQueryString += ' | "' +  classificationsToInclude[i] + '"';
      }
      let grantsFilter = {
        simple_query_string: {
          "query": theQueryString,
          "fields": ["patent_classification"]
        }
      }
      filters.push(grantsFilter);
    }
    
    if(event.arguments.search_value.length == 0){
      queryArray = [{match_all: {}}]
    }
    
    query = {
      query: {
        bool: {
          should: queryArray,
          minimum_should_match: 1,
          filter: filters
        }
      },
    };
    searchResult = await search(query, "patent_data", 25);
    break;
}

console.log("HERE2")

if(event.info.fieldName == "advancedSearchResearchers" || event.info.fieldName == "advancedSearchPublications" || event.info.fieldName == "advancedSearchGrants"){
  console.log("HERE")
  let table = event.arguments.table
  let mustContainWords = event.arguments.includeAllTheseWords;
    
    while(mustContainWords.charAt(0) == " " && mustContainWords.length != 0) {
      mustContainWords = mustContainWords.substring(1);
    }
    while(mustContainWords.charAt(mustContainWords.length-1) == " " && mustContainWords.length != 0) {
      mustContainWords = mustContainWords.substring(0, mustContainWords.length - 1);
    }
    
    mustContainWords = mustContainWords.replaceAll(" ","+");
    
    let mustContainPhrases = event.arguments.includeTheseExactWordsOrPhrases;
    while(mustContainPhrases.charAt(0) != "\"" && mustContainPhrases.length != 0) {
      mustContainPhrases = mustContainPhrases.substring(1);
    }
    while(mustContainPhrases.charAt(mustContainPhrases.length-1) != "\"" && mustContainPhrases.length != 0) {
      mustContainPhrases = mustContainPhrases.substring(0, mustContainPhrases.length - 1);
    }
    let isThereAFirstQuote = false;
    let amountOfStringToKeep = -1;
    
     for(var i = 0; i<mustContainPhrases.length; i++){
      if(mustContainPhrases.charAt(i) == "\"") {
        if(isThereAFirstQuote) {
          amountOfStringToKeep = i
          isThereAFirstQuote = false
        }
        else {
          //false
          isThereAFirstQuote = true;
        }
      }
    }
    mustContainPhrases = mustContainPhrases.substring(0, amountOfStringToKeep+1);
    //what if the entered string contains " "? Is that acceptable?
    mustContainPhrases = mustContainPhrases.replaceAll("\" \"", "\"+\"");

    
    let noneOfTheseWords = event.arguments.noneOfTheseWords;
    
    while(noneOfTheseWords.charAt(0) == " " && noneOfTheseWords.length != 0) {
      noneOfTheseWords = noneOfTheseWords.substring(1);
    }
    while(noneOfTheseWords.charAt(noneOfTheseWords.length-1) == " " && noneOfTheseWords.length != 0) {
      noneOfTheseWords = noneOfTheseWords.substring(0, noneOfTheseWords.length - 1);
    }
    let noneOfTheseWordsArray = noneOfTheseWords.split(" ");
    noneOfTheseWords = "";
    for(var i = 0; i<noneOfTheseWordsArray.length; i++){
      if(noneOfTheseWordsArray[i].charAt(0) == "-"){
        noneOfTheseWords = noneOfTheseWords+"+"+noneOfTheseWordsArray[i];
      }
    }
    noneOfTheseWords = noneOfTheseWords.substring(1);

    
    let allAndPhrases = mustContainWords;
    
    if(mustContainPhrases.length != 0) {
      if(allAndPhrases.length != 0){
        allAndPhrases = allAndPhrases+"+";
      }
      allAndPhrases = allAndPhrases+mustContainPhrases;
    }
    if(noneOfTheseWords.length != 0) {
      if(allAndPhrases.length != 0){
        allAndPhrases = allAndPhrases+"+";
      }
      allAndPhrases = allAndPhrases+noneOfTheseWords;
    }

    console.log(allAndPhrases);
    
    let anyOfTheseWords = event.arguments.includeAnyOfTheseWords;
    
    while(anyOfTheseWords.charAt(0) == " " && anyOfTheseWords.length != 0) {
      anyOfTheseWords = anyOfTheseWords.substring(1);
    }
    
    while(anyOfTheseWords.charAt(anyOfTheseWords.length-1) == " " && anyOfTheseWords.length != 0) {
      anyOfTheseWords = anyOfTheseWords.substring(0, anyOfTheseWords.length - 1);
    }
    
    anyOfTheseWords = anyOfTheseWords.replaceAll(" ","|");
    console.log(anyOfTheseWords);
    
    
    console.log(allAndPhrases);
    let fields = [];
    if(event.arguments.table == "researcher_data") {
      fields =  ["preferred_name", "prime_department", "prime_faculty", "keywords", "campus"];
    }
    if(event.arguments.table == "publication_data") {
      fields =  ["title", "journal", "author_names", "keywords"];
    }
    if(event.arguments.table == "grant_data") {
      fields = ["name", "project_title", "grant_program", "keywords"]
    }
    
    let filters = []
    
    if(event.info.fieldName == "advancedSearchPublications") {
          let pubRange = {
                  "range": {
                    "year_published": {
                      "gte": event.arguments.year_gte,
                      "lte": event.arguments.year_lte
                    }
                  }
                }
        let journal = {
                  "match_phrase": {
                    journal: event.arguments.journal
                  }
                }
        filters.push(pubRange);
        
        if(event.arguments.journal != "All Journals"){
          filters.push(journal);
        }
    }
    
    if(event.info.fieldName == "advancedSearchResearchers") {
      let department = {
        "match_phrase": {
          prime_department: event.arguments.prime_department
        }
      }
      let faculty = {
        "match_phrase": {
          prime_faculty: event.arguments.prime_faculty
        }
      }
      if(event.arguments.prime_department != "All Departments"){
        filters.push(department);
      }
      if(event.arguments.prime_faculty != "All Faculties"){
        filters.push(faculty);
      }
    }
    
    //Add filters for grants
    if(event.info.fieldName == "advancedSearchGrants") {

    }
    
    query = {
      query: {
        bool: {
          must: [
            {
              "simple_query_string": {
              "query": allAndPhrases,
              "fields": fields
              }
            }
          ],
          should: [
            {
              "simple_query_string": {
              "query": anyOfTheseWords,
              "fields":fields
              }
            }
          ],
          filter: filters
        }
      },
    };
    
    if(allAndPhrases.length == 0 && anyOfTheseWords.length == 0){
      query = {
      query: {
        bool: {
          must: [
            {
              "match_all": {}
            }
          ],
          filter: filters
        }
      },
    };
    }
    
    searchResult = await search(query, table, 25);
    console.log('SEARCH RESULTS');
    console.log(searchResult);
}

let result = [];

for(var i = 0; i<searchResult.length; i++) {
  result.push(searchResult[i]._source);
}

return result;
};