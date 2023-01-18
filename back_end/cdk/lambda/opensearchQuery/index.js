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
  case "searchResearcher":
    stringSplitArray = event.arguments.search_value.split(" ");
    for(var i = 0; i<stringSplitArray.length;i++){
      let nameQueryObject = {
        match_phrase_prefix: {
          preferred_name: {
            "query": stringSplitArray[i],
            "boost": 20
          }
        }
      };
      let departmentQueryObject = {
        match_phrase_prefix: {
          prime_department: {
            "query": stringSplitArray[i],
            "boost": 10
          }
        }
      };
      let facultyQueryObject = {
        match_phrase_prefix: {
          prime_faculty: {
            "query": stringSplitArray[i],
            "boost": 10
          }
        }
      };
      let keywordQueryObject = {
        match: {
          keywords: {
            "query": stringSplitArray[i],
            "boost": 1
          }
        }
      };
      
      queryArray.push(nameQueryObject);
      queryArray.push(departmentQueryObject);
      queryArray.push(facultyQueryObject);
      queryArray.push(keywordQueryObject);
    }
    
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
    stringSplitArray = event.arguments.search_value.split(" ");
    console.log(stringSplitArray);
    let fullPhraseMatchOnTitle = {
      match_phrase: {
        title: {
          query: event.arguments.search_value,
          boost: 30
        }
      }
    }
    let fullPhraseMatchOnJournel = {
      match_phrase: {
        journal: {
          query: event.arguments.search_value,
          boost: 20
        }
      }
    }
    let fullPhraseMatchOnAuthorNames = {
      match_phrase: {
        author_names: {
          query: event.arguments.search_value,
          boost: 15
        }
      }
    }
    let fullPhraseMatchOnKeywords = {
      match_phrase: {
        keywords: {
          query: event.arguments.search_value,
          boost: 15
        }
      }
    }
    
    queryArray.push(fullPhraseMatchOnTitle);
    queryArray.push(fullPhraseMatchOnJournel);
    queryArray.push(fullPhraseMatchOnAuthorNames);
    queryArray.push(fullPhraseMatchOnKeywords);
    
    for(var i = 0; i<stringSplitArray.length;i++){
      let matchTitle = {
        "match": {
          "title": {
            "query": stringSplitArray[i],
            "boost": 4
          }
        }
      }
      let matchJournal = {
        "match": {
          "journal": {
            "query": stringSplitArray[i],
            "boost": 3
          }
        }
      }
      let matchAuthorNames = {
        "match": {
          "author_names": {
            "query": stringSplitArray[i],
            "boost": 2
          }
        }
      }
      let matchKeyword = {
        "match": {
          "keyword": {
            "query": stringSplitArray[i],
            "boost": 1
          }
        }
      }
      queryArray.push(matchTitle);
      queryArray.push(matchJournal);
      queryArray.push(matchAuthorNames);
      queryArray.push(matchKeyword);
    }
    
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
    break;
    
  case "similarResearchers":
    
    
    let scopusIDQuery = {
      query: {
        match_phrase: {
          "scopus_id": event.arguments.scopus_id
        }
      }
    }
    
    searchResult = await search(scopusIDQuery, "researcher_data", 10);
    
    let keyWords = searchResult[0]._source.keywords.split(", ");

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
      console.log(key, value);
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
                scopus_id: event.arguments.scopus_id
              }
            }
          ]
        }
      },
    };
    
    searchResult = await search(query, "researcher_data", 10);
    break;

  case "searchGrants":
    stringSplitArray = event.arguments.search_value.split(" ");
    
    for(let i = 0; i<stringSplitArray.length; i++){
      let matchName = {
        "match": {
          "name": {
            "query": stringSplitArray[i],
            "boost": 4
          }
        }
      }
      let matchProjectTitle = {
        "match": {
          "project_title": {
            "query": stringSplitArray[i],
            "boost": 3
          }
        }
      }
      let matchGrantProgram = {
        "match": {
          "grant_program": {
            "query": stringSplitArray[i],
            "boost": 2
          }
        }
      }
      let matchKeywords = {
        "match": {
          "keywords": {
            "query": stringSplitArray[i],
            "boost": 1
          }
        }
      }
      queryArray.push(matchName);
      queryArray.push(matchProjectTitle);
      queryArray.push(matchGrantProgram);
      queryArray.push(matchKeywords);
    }
    
    //Create Publication Filters
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

    searchResult = await search(query, "grant_data", 200);
    
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
    
    searchResult = await search(query, table, 50);
    console.log('SEARCH RESULTS');
    console.log(searchResult);
}

let result = [];

for(var i = 0; i<searchResult.length; i++) {
  result.push(searchResult[i]._source);
}

return result;
};