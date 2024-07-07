import { createClient as _createUrqlClient, cacheExchange, fetchExchange, type Client as UrqlClient } from '@urql/core';

import { createGetDocumentResponse } from './get-document';
import { createDocumentListResponse } from './get-documents';
import { createGetTagResponse } from './get-tag';
import { createGetTagsResponse } from './get-tags';
import { createGetWebsitesResponse } from './get-websites';
import {
  DocumentDocument,
  DocumentsDocument,
  QueryDocumentArgs,
  QueryDocumentsArgs,
  QueryTagArgs,
  QueryTagsArgs,
  QueryWebsitesArgs,
  TagDocument,
  TagsDocument,
  WebsitesDocument,
} from './gql/graphql';

export interface ClientOptions {
  url: string;
  accessKey: string;
  urqlClient?: UrqlClient;
}

export class Client {
  url: string;
  accessKey: string;
  urqlClient: UrqlClient;

  constructor(options: ClientOptions) {
    this.url = options.url;
    this.accessKey = options.accessKey;
    this.urqlClient = options.urqlClient ?? this.createUrqlClient();
  }

  async getDocument(args: QueryDocumentArgs) {
    const result = await this.urqlClient.query(DocumentDocument, args);
    return createGetDocumentResponse(result);
  }

  async getDocuments(args?: QueryDocumentsArgs) {
    const result = await this.urqlClient.query(DocumentsDocument, args ?? {});
    return createDocumentListResponse(result);
  }

  async getTag(args: QueryTagArgs) {
    const result = await this.urqlClient.query(TagDocument, args);
    return createGetTagResponse(result);
  }

  async getTags(args?: QueryTagsArgs) {
    const result = await this.urqlClient.query(TagsDocument, args ?? {});
    return createGetTagsResponse(result);
  }

  async getWebsites(args?: QueryWebsitesArgs) {
    const result = await this.urqlClient.query(WebsitesDocument, args ?? {});
    return createGetWebsitesResponse(result);
  }

  private createUrqlClient(): UrqlClient {
    return _createUrqlClient({
      url: this.url,
      exchanges: [cacheExchange, fetchExchange],
      fetchOptions: {
        headers: {
          Authorization: `bearer ${this.accessKey}`,
        },
        cache: 'no-store',
      },
    });
  }
}
