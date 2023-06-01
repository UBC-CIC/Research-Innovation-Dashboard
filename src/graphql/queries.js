/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const advancedSearchGrants = /* GraphQL */ `
  query AdvancedSearchGrants(
    $includeAllTheseWords: String!
    $includeAnyOfTheseWords: String!
    $includeTheseExactWordsOrPhrases: String!
    $noneOfTheseWords: String!
    $table: String!
  ) {
    advancedSearchGrants(
      includeAllTheseWords: $includeAllTheseWords
      includeAnyOfTheseWords: $includeAnyOfTheseWords
      includeTheseExactWordsOrPhrases: $includeTheseExactWordsOrPhrases
      noneOfTheseWords: $noneOfTheseWords
      table: $table
    ) {
      assigned_id
      agency
      amount
      department
      end_date
      grant_program
      keywords
      name
      project_title
      start_date
      year
    }
  }
`;
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
      researcher_id
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
export const getAllResearchersImpacts = /* GraphQL */ `
  query GetAllResearchersImpacts {
    getAllResearchersImpacts {
      h_index
      num_citations
      preferred_name
      prime_department
      prime_faculty
      scopus_id
      total_grant_amount
      researcher_id
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
      researcher_id
      employee_id
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
      merged_keywords
      job_stream
      keywords
      last_name
      last_updated
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
export const searchPublications = /* GraphQL */ `
  query SearchPublications(
    $search_value: String!
    $journalsToFilterBy: [String]!
  ) {
    searchPublications(
      search_value: $search_value
      journalsToFilterBy: $journalsToFilterBy
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
export const searchResearcher = /* GraphQL */ `
  query SearchResearcher(
    $search_value: String!
    $departmentsToFilterBy: [String]!
    $facultiesToFilterBy: [String]!
  ) {
    searchResearcher(
      search_value: $search_value
      departmentsToFilterBy: $departmentsToFilterBy
      facultiesToFilterBy: $facultiesToFilterBy
    ) {
      researcher_id
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
  query SimilarResearchers($researcher_id: String!) {
    similarResearchers(researcher_id: $researcher_id) {
      researcher_id
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
export const changeScopusId = /* GraphQL */ `
  query ChangeScopusId($oldScopusId: String!, $newScopusId: String!) {
    changeScopusId(oldScopusId: $oldScopusId, newScopusId: $newScopusId)
  }
`;
export const lastUpdatedResearchersList = /* GraphQL */ `
  query LastUpdatedResearchersList {
    lastUpdatedResearchersList {
      last_updated
      preferred_name
    }
  }
`;
export const getUpdatePublicationsLogs = /* GraphQL */ `
  query GetUpdatePublicationsLogs {
    getUpdatePublicationsLogs {
      date_updated
      number_of_publications_updated
    }
  }
`;
export const searchGrants = /* GraphQL */ `
  query SearchGrants(
    $search_value: String!
    $grantAgenciesToFilterBy: [String]!
  ) {
    searchGrants(
      search_value: $search_value
      grantAgenciesToFilterBy: $grantAgenciesToFilterBy
    ) {
      assigned_id
      agency
      amount
      department
      end_date
      grant_program
      keywords
      name
      project_title
      start_date
      year
    }
  }
`;
export const searchPatents = /* GraphQL */ `
  query SearchPatents(
    $search_value: String!
    $patentClassificationFilter: [String]!
  ) {
    searchPatents(
      search_value: $search_value
      patentClassificationFilter: $patentClassificationFilter
    ) {
      patent_title
      patent_sponsors
      patent_classification
      patent_family_number
      patent_inventors
      patent_number
      patent_publication_date
      inventors_assigned_ids
      matched_inventors_names
    }
  }
`;
export const otherResearchersWithKeyword = /* GraphQL */ `
  query OtherResearchersWithKeyword($keyword: String!) {
    otherResearchersWithKeyword(keyword: $keyword) {
      researcher_id
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
export const getAllGrantAgencies = /* GraphQL */ `
  query GetAllGrantAgencies {
    getAllGrantAgencies
  }
`;
export const getFlaggedIds = /* GraphQL */ `
  query GetFlaggedIds {
    getFlaggedIds {
      researcher_id
      employee_id
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
export const getResearcherImpactsByDepartment = /* GraphQL */ `
  query GetResearcherImpactsByDepartment($prime_department: String!) {
    getResearcherImpactsByDepartment(prime_department: $prime_department) {
      h_index
      num_citations
      preferred_name
      prime_department
      prime_faculty
      scopus_id
      total_grant_amount
      researcher_id
    }
  }
`;
export const getResearcherImpactsByFaculty = /* GraphQL */ `
  query GetResearcherImpactsByFaculty($prime_faculty: String!) {
    getResearcherImpactsByFaculty(prime_faculty: $prime_faculty) {
      h_index
      num_citations
      preferred_name
      prime_department
      prime_faculty
      scopus_id
      total_grant_amount
      researcher_id
    }
  }
`;
export const getResearcherPatents = /* GraphQL */ `
  query GetResearcherPatents($id: ID!) {
    getResearcherPatents(id: $id) {
      patent_title
      patent_sponsors
      patent_classification
      patent_family_number
      patent_inventors
      patent_number
      patent_publication_date
      inventors_assigned_ids
      matched_inventors_names
    }
  }
`;
export const getResearcherGrants = /* GraphQL */ `
  query GetResearcherGrants($id: ID!) {
    getResearcherGrants(id: $id) {
      assigned_id
      agency
      amount
      department
      end_date
      grant_program
      keywords
      name
      project_title
      start_date
      year
    }
  }
`;
export const getCatagoriesCount = /* GraphQL */ `
  query GetCatagoriesCount {
    getCatagoriesCount {
      researcherCount
      publicationCount
      grantCount
      patentCount
    }
  }
`;
