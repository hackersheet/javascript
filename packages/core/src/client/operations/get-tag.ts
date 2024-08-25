import { OperationResult } from '@urql/core';

import { graphql } from '../../gql';
import { QueryTagArgs, TagQuery } from '../../gql/graphql';
import { toArrayFromEdges } from '../../utils';

import type { Tag } from '../../types';

graphql(`
  query tag($name: String) {
    tag(name: $name) {
      id
      name
      documentCount
      documentCountInPublished
      documentCountInDraft
      relatedTags {
        edges {
          node {
            id
            name
            documentCount
            documentCountInPublished
            documentCountInDraft
          }
        }
      }
    }
  }
`);

export function makeGetTagResponse(result: OperationResult<TagQuery, QueryTagArgs>) {
  const tmpTag = result.data?.tag;
  const tag: Tag | null = tmpTag ? { ...tmpTag, relatedTags: toArrayFromEdges(tmpTag.relatedTags?.edges) } : null;
  const error = result.error;

  return { tag, error } as const;
}
