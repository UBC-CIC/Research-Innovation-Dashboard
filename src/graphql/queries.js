/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const advancedSearchPublications = /* GraphQL */ `
  query AdvancedSearchPublications(
    $includeAllTheseWords: String!
    $includeAnyOfTheseWords: String!
    $includeTheseExactWordsOrPhrases: String!
    $journal: String!
    $noneOfTheseWords: String!
    $table: String!
    $year_gte: Int!
    $year_lte: Int!
  ) {
    advancedSearchPublications(
      includeAllTheseWords: $includeAllTheseWords
      includeAnyOfTheseWords: $includeAnyOfTheseWords
      includeTheseExactWordsOrPhrases: $includeTheseExactWordsOrPhrases
      journal: $journal
      noneOfTheseWords: $noneOfTheseWords
      table: $table
      year_gte: $year_gte
      year_lte: $year_lte
    ) {
      author_ids
      author_names
      cited_by
      id
      journal
      keywords
      link
      title
      year_published
    }
  }
`;
export const advancedSearchResearchers = /* GraphQL */ `
  query AdvancedSearchResearchers(
    $includeAllTheseWords: String!
    $includeAnyOfTheseWords: String!
    $includeTheseExactWordsOrPhrases: String!
    $noneOfTheseWords: String!
    $prime_department: String!
    $prime_faculty: String!
    $table: String!
  ) {
    advancedSearchResearchers(
      includeAllTheseWords: $includeAllTheseWords
      includeAnyOfTheseWords: $includeAnyOfTheseWords
      includeTheseExactWordsOrPhrases: $includeTheseExactWordsOrPhrases
      noneOfTheseWords: $noneOfTheseWords
      prime_department: $prime_department
      prime_faculty: $prime_faculty
      table: $table
    ) {
      campus
      email
      first_name
      job_stream
      keywords
      last_name
      preferred_name
      prime_department
      prime_faculty
      rank
      scopus_id
      second_department
      second_faculty
    }
  }
`;
export const allPublicationsPerFacultyQuery = /* GraphQL */ `
  query AllPublicationsPerFacultyQuery {
    allPublicationsPerFacultyQuery {
      faculty
      sum
    }
  }
`;
export const facultyMetrics = /* GraphQL */ `
  query FacultyMetrics($faculty: String!) {
    facultyMetrics(faculty: $faculty) {
      faculty
      num_publications
      year
    }
  }
`;
export const getAllDepartments = /* GraphQL */ `
  query GetAllDepartments {
    getAllDepartments
  }
`;
export const getAllDistinctJournals = /* GraphQL */ `
  query GetAllDistinctJournals {
    getAllDistinctJournals
  }
`;
export const getAllFaculty = /* GraphQL */ `
  query GetAllFaculty {
    getAllFaculty
  }
`;
export const getAllResearchersRankings = /* GraphQL */ `
  query GetAllResearchersRankings {
    getAllResearchersRankings {
      h_index
      num_citations
      preferred_name
      prime_department
      prime_faculty
      scopus_id
    }
  }
`;
export const getNumberOfResearcherPubsAllYears = /* GraphQL */ `
  query GetNumberOfResearcherPubsAllYears($id: ID!) {
    getNumberOfResearcherPubsAllYears(id: $id) {
      allyears
      publicationsPerYear
    }
  }
`;
export const getNumberOfResearcherPubsLastFiveYears = /* GraphQL */ `
  query GetNumberOfResearcherPubsLastFiveYears($id: ID!) {
    getNumberOfResearcherPubsLastFiveYears(id: $id) {
      lastFiveYears
      publicationsPerYear
    }
  }
`;
export const getPub = /* GraphQL */ `
  query GetPub($id: ID!) {
    getPub(id: $id) {
      author_ids
      author_names
      cited_by
      id
      journal
      keywords
      link
      title
      year_published
    }
  }
`;
export const getResearcher = /* GraphQL */ `
  query GetResearcher($id: ID!) {
    getResearcher(id: $id) {
      areas_of_interest
      campus
      email
      first_name
      job_stream
      last_name
      orcid_id
      preferred_name
      prime_department
      prime_faculty
      rank
      scopus_id
      second_department
      second_faculty
    }
  }
`;
export const getResearcherElsevier = /* GraphQL */ `
  query GetResearcherElsevier($id: ID!) {
    getResearcherElsevier(id: $id) {
      h_index
      id
      num_citations
      num_documents
    }
  }
`;
export const getResearcherFull = /* GraphQL */ `
  query GetResearcherFull($id: ID!) {
    getResearcherFull(id: $id) {
      areas_of_interest
      campus
      email
      first_name
      h_index
      job_stream
      keywords
      last_name
      num_citations
      num_documents
      num_patents_filed
      orcid_id
      preferred_name
      prime_department
      prime_faculty
      rank
      scopus_id
      second_department
      second_faculty
    }
  }
`;
export const getResearcherOrcid = /* GraphQL */ `
  query GetResearcherOrcid($id: ID!) {
    getResearcherOrcid(id: $id) {
      id
      num_patents_filed
    }
  }
`;
export const getResearcherPubsByCitations = /* GraphQL */ `
  query GetResearcherPubsByCitations($id: ID!) {
    getResearcherPubsByCitations(id: $id) {
      author_ids
      author_names
      cited_by
      id
      journal
      keywords
      link
      title
      year_published
    }
  }
`;
export const getResearcherPubsByTitle = /* GraphQL */ `
  query GetResearcherPubsByTitle($id: ID!) {
    getResearcherPubsByTitle(id: $id) {
      author_ids
      author_names
      cited_by
      id
      journal
      keywords
      link
      title
      year_published
    }
  }
`;
export const getResearcherPubsByYear = /* GraphQL */ `
  query GetResearcherPubsByYear($id: ID!) {
    getResearcherPubsByYear(id: $id) {
      author_ids
      author_names
      cited_by
      id
      journal
      keywords
      link
      title
      year_published
    }
  }
`;
export const getResearcherRankingsByDepartment = /* GraphQL */ `
  query GetResearcherRankingsByDepartment($prime_department: String!) {
    getResearcherRankingsByDepartment(prime_department: $prime_department) {
      h_index
      num_citations
      preferred_name
      prime_department
      prime_faculty
      scopus_id
    }
  }
`;
export const getResearcherRankingsByFaculty = /* GraphQL */ `
  query GetResearcherRankingsByFaculty($prime_faculty: String!) {
    getResearcherRankingsByFaculty(prime_faculty: $prime_faculty) {
      h_index
      num_citations
      preferred_name
      prime_department
      prime_faculty
      scopus_id
    }
  }
`;
export const searchPublications = /* GraphQL */ `
  query SearchPublications($search_value: String!) {
    searchPublications(search_value: $search_value) {
      author_ids
      author_names
      cited_by
      id
      journal
      keywords
      link
      title
      year_published
    }
  }
`;
export const searchResearcher = /* GraphQL */ `
  query SearchResearcher($search_value: String!) {
    searchResearcher(search_value: $search_value) {
      campus
      email
      first_name
      job_stream
      keywords
      last_name
      preferred_name
      prime_department
      prime_faculty
      rank
      scopus_id
      second_department
      second_faculty
    }
  }
`;
export const similarResearchers = /* GraphQL */ `
  query SimilarResearchers($keywordsString: String!, $scopus_id: String!) {
    similarResearchers(keywordsString: $keywordsString, scopus_id: $scopus_id) {
      campus
      email
      first_name
      job_stream
      keywords
      last_name
      preferred_name
      prime_department
      prime_faculty
      rank
      scopus_id
      second_department
      second_faculty
    }
  }
`;
export const totalPublicationPerYear = /* GraphQL */ `
  query TotalPublicationPerYear {
    totalPublicationPerYear {
      count
      year_published
    }
  }
`;
export const wordCloud = /* GraphQL */ `
  query WordCloud($gte: Int!, $lte: Int!) {
    wordCloud(gte: $gte, lte: $lte) {
      text
      value
    }
  }
`;
