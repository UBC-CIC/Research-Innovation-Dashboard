/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const putPub = /* GraphQL */ `
  mutation PutPub(
    $id: ID!
    $title: String!
    $keywords: [String]
    $authors: [String!]
    $journal: String
  ) {
    putPub(
      id: $id
      title: $title
      keywords: $keywords
      authors: $authors
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
    }
  }
`;
