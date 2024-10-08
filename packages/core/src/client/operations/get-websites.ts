import { OperationResult } from '@urql/core';

import { graphql } from '../../gql';
import { QueryWebsitesArgs, WebsitesQuery } from '../../gql/graphql';
import { WebsiteListeItem } from '../../types';
import { toArrayFromEdges } from '../../utils';

graphql(`
  query websites(
    $after: String
    $before: String
    $first: Int
    $last: Int
    $filter: WorkspaceWebsiteConnectionFilter
    $sort: ConnectionSort
  ) {
    websites(after: $after, before: $before, first: $first, last: $last, filter: $filter, sort: $sort) {
      totalCount
      edges {
        node {
          id
          url
          domain
          title
          description
          ogSiteName
          ogTitle
          ogType
          ogUrl
          ogDescription
          ogLocale
          ogImage {
            id
            fileUrl
            width
            height
          }
          documents {
            edges {
              node {
                id
                draft
                title
                slug
              }
            }
          }
        }
      }
    }
  }
`);

export function makeGetWebsitesResponse(result: OperationResult<WebsitesQuery, QueryWebsitesArgs>) {
  const websites: WebsiteListeItem[] = toArrayFromEdges(result.data?.websites?.edges).map((website) => ({
    ...website,
    documents: toArrayFromEdges(website.documents?.edges),
  }));

  const totalCount = result.data?.websites?.totalCount || 0;
  const isEmpty = totalCount === 0;
  const error = result.error;

  return { websites, totalCount, isEmpty, error } as const;
}
