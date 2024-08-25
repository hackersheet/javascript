import { OperationResult } from '@urql/core';

import { graphql } from '../../gql';
import { DocumentQuery, QueryDocumentArgs } from '../../gql/graphql';
import { Document } from '../../types';
import { toArrayFromEdges } from '../../utils';

graphql(`
  query document($slug: String) {
    document(slug: $slug) {
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
      outboundLinkDocuments(sort: { by: "published_at", order: "desc" }) {
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
      inboundLinkDocuments(sort: { by: "published_at", order: "desc" }) {
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
      websites(sort: { by: "published_at", order: "desc" }) {
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
`);

export function makeGetDocumentResponse(result: OperationResult<DocumentQuery, QueryDocumentArgs>) {
  if (!result.data?.document) {
    return { document: null, error: result.error };
  }

  const tmpDoc = result.data?.document;

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
