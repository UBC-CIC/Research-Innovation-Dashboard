/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getPub = /* GraphQL */ `
  query GetPub($id: ID!) {
    getPub(id: $id) {
      id
      title
      keywords
      author_ids
      author_names
      journal
      cited_by
      year_published
      link
    }
  }
`;
export const getResearcherPubsByCitations = /* GraphQL */ `
  query GetResearcherPubsByCitations($id: ID!) {
    getResearcherPubsByCitations(id: $id) {
      id
      title
      keywords
      author_ids
      author_names
      journal
      cited_by
      year_published
      link
    }
  }
`;
export const getResearcherPubsByYear = /* GraphQL */ `
  query GetResearcherPubsByYear($id: ID!) {
    getResearcherPubsByYear(id: $id) {
      id
      title
      keywords
      author_ids
      author_names
      journal
      cited_by
      year_published
      link
    }
  }
`;
export const getResearcherPubsByTitle = /* GraphQL */ `
  query GetResearcherPubsByTitle($id: ID!) {
    getResearcherPubsByTitle(id: $id) {
      id
      title
      keywords
      author_ids
      author_names
      journal
      cited_by
      year_published
      link
    }
  }
`;
export const getResearcher = /* GraphQL */ `
  query GetResearcher($id: ID!) {
    getResearcher(id: $id) {
      first_name
      preferred_name
      last_name
      email
      rank
      job_stream
      prime_department
      second_department
      prime_faculty
      second_faculty
      campus
      areas_of_interest
      scopus_id
      orcid_id
    }
  }
`;
export const getResearcherElsevier = /* GraphQL */ `
  query GetResearcherElsevier($id: ID!) {
    getResearcherElsevier(id: $id) {
      id
      num_citations
      num_documents
      h_index
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
export const getResearcherFull = /* GraphQL */ `
  query GetResearcherFull($id: ID!) {
    getResearcherFull(id: $id) {
      first_name
      preferred_name
      last_name
      email
      rank
      job_stream
      prime_department
      second_department
      prime_faculty
      second_faculty
      campus
      areas_of_interest
      scopus_id
      orcid_id
      num_citations
      num_documents
      h_index
      num_patents_filed
      keywords
    }
  }
`;
export const getResearcherRankingsByDepartment = /* GraphQL */ `
  query GetResearcherRankingsByDepartment($prime_department: String!) {
    getResearcherRankingsByDepartment(prime_department: $prime_department) {
      scopus_id
      preferred_name
      prime_department
      prime_faculty
      h_index
      num_citations
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
export const getAllDepartments = /* GraphQL */ `
  query GetAllDepartments {
    getAllDepartments
  }
`;
export const getAllResearchersRankings = /* GraphQL */ `
  query GetAllResearchersRankings {
    getAllResearchersRankings {
      scopus_id
      preferred_name
      prime_department
      prime_faculty
      h_index
      num_citations
    }
  }
`;
export const getAllFaculty = /* GraphQL */ `
  query GetAllFaculty {
    getAllFaculty
  }
`;
export const getResearcherRankingsByFaculty = /* GraphQL */ `
  query GetResearcherRankingsByFaculty($prime_faculty: String!) {
    getResearcherRankingsByFaculty(prime_faculty: $prime_faculty) {
      scopus_id
      preferred_name
      prime_department
      prime_faculty
      h_index
      num_citations
    }
  }
`;
export const searchResearcher = /* GraphQL */ `
  query SearchResearcher($search_value: String!) {
    searchResearcher(search_value: $search_value) {
      first_name
      preferred_name
      last_name
      email
      rank
      job_stream
      prime_department
      second_department
      prime_faculty
      second_faculty
      campus
      scopus_id
      keywords
    }
  }
`;
export const similarResearchers = /* GraphQL */ `
  query SimilarResearchers($keywordsString: String!, $scopus_id: String!) {
    similarResearchers(keywordsString: $keywordsString, scopus_id: $scopus_id) {
      first_name
      preferred_name
      last_name
      email
      rank
      job_stream
      prime_department
      second_department
      prime_faculty
      second_faculty
      campus
      scopus_id
      keywords
    }
  }
`;
export const searchPublications = /* GraphQL */ `
  query SearchPublications($search_value: String!) {
    searchPublications(search_value: $search_value) {
      id
      title
      keywords
      author_ids
      author_names
      journal
      cited_by
      year_published
      link
    }
  }
`;
export const advancedSearchResearchers = /* GraphQL */ `
  query AdvancedSearchResearchers(
    $includeAllTheseWords: String!
    $includeTheseExactWordsOrPhrases: String!
    $includeAnyOfTheseWords: String!
    $noneOfTheseWords: String!
    $prime_department: String!
    $prime_faculty: String!
    $table: String!
  ) {
    advancedSearchResearchers(
      includeAllTheseWords: $includeAllTheseWords
      includeTheseExactWordsOrPhrases: $includeTheseExactWordsOrPhrases
      includeAnyOfTheseWords: $includeAnyOfTheseWords
      noneOfTheseWords: $noneOfTheseWords
      prime_department: $prime_department
      prime_faculty: $prime_faculty
      table: $table
    ) {
      first_name
      preferred_name
      last_name
      email
      rank
      job_stream
      prime_department
      second_department
      prime_faculty
      second_faculty
      campus
      scopus_id
      keywords
    }
  }
`;
export const advancedSearchPublications = /* GraphQL */ `
  query AdvancedSearchPublications(
    $includeAllTheseWords: String!
    $includeTheseExactWordsOrPhrases: String!
    $includeAnyOfTheseWords: String!
    $noneOfTheseWords: String!
    $table: String!
    $year_lte: Int!
    $year_gte: Int!
    $journal: String!
  ) {
    advancedSearchPublications(
      includeAllTheseWords: $includeAllTheseWords
      includeTheseExactWordsOrPhrases: $includeTheseExactWordsOrPhrases
      includeAnyOfTheseWords: $includeAnyOfTheseWords
      noneOfTheseWords: $noneOfTheseWords
      table: $table
      year_lte: $year_lte
      year_gte: $year_gte
      journal: $journal
    ) {
      id
      title
      keywords
      author_ids
      author_names
      journal
      cited_by
      year_published
      link
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
export const getAllDistinctJournals = /* GraphQL */ `
  query GetAllDistinctJournals {
    getAllDistinctJournals
  }
`;
export const wordCloud = /* GraphQL */ `
  query WordCloud {
    wordCloud {
      text
      value
    }
  }
`;
export const facultyMetrics = /* GraphQL */ `
  query FacultyMetrics($faculty: String!) {
    facultyMetrics(faculty: $faculty) {
      faculty
      year
      num_publications
    }
  }
`;
export const totalPublicationPerYear = /* GraphQL */ `
  query TotalPublicationPerYear {
    totalPublicationPerYear {
      year_published
      count
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
