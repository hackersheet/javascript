import { OperationResult } from '@urql/core';

import { graphql } from '../../gql';
import { TreeNodeDocumentQuery, TreeNodeDocumentQueryVariables } from '../../gql/graphql';
import { Document } from '../../types';
import { toArrayFromEdges } from '../../utils';

graphql(`
  query treeNodeDocument($treeSlug: String, $nodeFullSlug: String!, $variant: String) {
    tree(slug: $treeSlug) {
      id
      node(fullSlug: $nodeFullSlug) {
        id
        nodeDocument(variant: $variant) {
          document {
            id
            slug
            emoji
            title
            draft
            content
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
            assets {
              edges {
                node {
                  id
                  path
                  name
                  fileUrl
                  height
                  width
                }
              }
            }
            outboundLinkDocuments {
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
                  publishedAt
                  modifiedAt
                }
              }
            }
            inboundLinkDocuments {
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
                  publishedAt
                  modifiedAt
                }
              }
            }
            websites {
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
                }
              }
            }
          }
        }
      }
    }
  }
`);

export function makeGetTreeNodeDocumentResponse(
  result: OperationResult<TreeNodeDocumentQuery, TreeNodeDocumentQueryVariables>
) {
  if (!result.data?.tree?.node?.nodeDocument?.document) {
    return { document: null, error: result.error };
  }

  const tmpDoc = result.data?.tree.node?.nodeDocument?.document;

  const document: Document = {
    ...tmpDoc,
    tags: toArrayFromEdges(tmpDoc.tags?.edges),
    assets: toArrayFromEdges(tmpDoc.assets?.edges),
    outboundLinkDocuments: toArrayFromEdges(tmpDoc.outboundLinkDocuments?.edges).map((doc) => ({
      ...doc,
      tags: toArrayFromEdges(doc.tags?.edges),
    })),
    inboundLinkDocuments: toArrayFromEdges(tmpDoc.inboundLinkDocuments?.edges).map((doc) => ({
      ...doc,
      tags: toArrayFromEdges(doc.tags?.edges),
    })),
    websites: toArrayFromEdges(tmpDoc.websites?.edges),
  };

  const error = result.error;

  return { document, error } as const;
}
