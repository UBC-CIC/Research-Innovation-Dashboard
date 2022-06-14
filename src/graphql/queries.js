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
    getAllDepartments {
      prime_department
    }
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
    getAllFaculty {
      prime_faculty
    }
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
