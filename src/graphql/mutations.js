/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const putPub = /* GraphQL */ `
  mutation PutPub(
    $authors: [String!]
    $id: ID!
    $journal: String
    $keywords: [String]
    $title: String!
  ) {
    putPub(
      authors: $authors
      id: $id
      journal: $journal
      keywords: $keywords
      title: $title
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
      author_ids_string
    }
  }
`;
