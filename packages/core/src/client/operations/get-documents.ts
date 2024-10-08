import { OperationResult } from '@urql/core';

import { graphql } from '../../gql';
import { DocumentsQuery, QueryDocumentsArgs } from '../../gql/graphql';
import { DocumentList } from '../../types';
import { toArrayFromEdges } from '../../utils';

graphql(`
  query documents(
    $after: String
    $before: String
    $first: Int
    $last: Int
    $filter: DocumentConnectionFilter
    $sort: ConnectionSort
  ) {
    documents(after: $after, before: $before, first: $first, last: $last, filter: $filter, sort: $sort) {
      totalCount
      edges {
        node {
          id
          slug
          emoji
          title
          draft
          path
          tags {
            edges {
              node {
                id
                name
              }
            }
          }
          preview {
            id
            width
            height
            path
            fileUrl
          }
          publishedAt
          modifiedAt
        }
      }
    }
  }
`);

export function makeGetDocumentsResponse(result: OperationResult<DocumentsQuery, QueryDocumentsArgs>) {
  if (!result.data || !result.data.documents) {
    return { documents: [], totalCount: 0, isEmpty: true, error: result.error };
  }

  const tmpDocs = result.data.documents;
  const documents: DocumentList = toArrayFromEdges(tmpDocs?.edges).map((document) => ({
    ...document,
    tags: toArrayFromEdges(document.tags?.edges),
  }));
  const totalCount = result.data?.documents?.totalCount || 0;
  const isEmpty = totalCount === 0;
  const error = result.error;

  return { documents, totalCount, isEmpty, error } as const;
}
