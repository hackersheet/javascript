import { createClient as _createUrqlClient, cacheExchange, fetchExchange, type Client as UrqlClient } from '@urql/core';

import {
  makeGetDocumentResponse,
  makeGetDocumentsResponse,
  makeGetTagResponse,
  makeGetTagsResponse,
  makeGetWebsitesResponse,
} from './operations';
import { makeGetTreeResponse } from './operations/get-tree';
import {
  DocumentDocument,
  DocumentsDocument,
  QueryDocumentArgs,
  QueryDocumentsArgs,
  QueryTagArgs,
  QueryTagsArgs,
  QueryTreeArgs,
  QueryWebsitesArgs,
  TagDocument,
  TagsDocument,
  TreeDocument,
  WebsitesDocument,
} from '../gql/graphql';

export type ClientOptions = {
  url: string;
  accessKey: string;
  urqlClient?: UrqlClient;
};

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
    return makeGetDocumentResponse(result);
  }

  async getDocuments(args?: QueryDocumentsArgs) {
    const result = await this.urqlClient.query(DocumentsDocument, args ?? {});
    return makeGetDocumentsResponse(result);
  }

  async getTag(args: QueryTagArgs) {
    const result = await this.urqlClient.query(TagDocument, args);
    return makeGetTagResponse(result);
  }

  async getTags(args?: QueryTagsArgs) {
    const result = await this.urqlClient.query(TagsDocument, args ?? {});
    return makeGetTagsResponse(result);
  }

  async getWebsites(args?: QueryWebsitesArgs) {
    const result = await this.urqlClient.query(WebsitesDocument, args ?? {});
    return makeGetWebsitesResponse(result);
  }

  async getTree(args?: QueryTreeArgs) {
    const result = await this.urqlClient.query(TreeDocument, args ?? {});
    return makeGetTreeResponse(result);
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
