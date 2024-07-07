import { OperationResult } from '@urql/core';

import { graphql } from './gql';
import { QueryTagArgs, TagQuery } from './gql/graphql';
import { TagListItem } from './types';

graphql(`
  query tag($name: String) {
    tag(name: $name) {
      id
      name
      documentCount
      documentCountInPublished
    }
  }
`);

export function createGetTagResponse(result: OperationResult<TagQuery, QueryTagArgs>) {
  const tag: TagListItem | null = result.data?.tag ?? null;
  const error = result.error;

  return { tag, error } as const;
}
