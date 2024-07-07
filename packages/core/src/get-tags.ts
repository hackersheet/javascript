import { OperationResult } from '@urql/core';

import { graphql } from './gql';
import { QueryTagsArgs, TagsQuery } from './gql/graphql';
import { TagList } from './types';
import { toArrayFromEdges } from './utils';

graphql(`
  query tags($sort: ConnectionSort) {
    tags(sort: $sort) {
      totalCount
      edges {
        node {
          id
          name
          documentCount
          documentCountInPublished
        }
      }
    }
  }
`);

export function createGetTagsResponse(result: OperationResult<TagsQuery, QueryTagsArgs>) {
  const tags: TagList = toArrayFromEdges(result.data?.tags?.edges);
  const totalCount = result.data?.tags?.totalCount || 0;
  const isEmpty = totalCount === 0;
  const error = result.error;

  return { tags, totalCount, isEmpty, error } as const;
}
