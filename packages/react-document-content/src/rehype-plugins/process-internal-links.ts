import path from 'path';

import Mustache from 'mustache';
import { visit } from 'unist-util-visit';

import { isUrl } from '../utils';

import type { Document } from '@hackersheet/core';
import type { Element } from 'hast';
import type { Parent } from 'unist';

export interface ProcessInternalLinksArgs {
  document: Document;
  permaLinkFormat: string;
}

export default function processInternalLinks({ document, permaLinkFormat }: ProcessInternalLinksArgs) {
  return (tree: Parent) => {
    visit(tree, 'element', (element: Element) => {
      const link = element.properties.href || element.properties.src;
      const tagName = element.tagName;

      if (!link || typeof link !== 'string' || isUrl(link) || !document.path) {
        return;
      }

      const baseDirname = `/${path.dirname(document.path)}`;
      const fullPath = path.resolve(baseDirname, decodeURI(link)).replace(/^\//, '');

      if (tagName === 'a') {
        const doc = document.outboundLinkDocuments.find((doc) => doc.path === fullPath);
        if (doc) {
          element.properties.href = Mustache.render(permaLinkFormat, doc);
        }
      }

      if (tagName === 'img') {
        const asset = document.assets.find((asset) => asset.path === fullPath);
        if (asset) {
          element.properties.src = asset.fileUrl;
          element.properties.height = asset.height;
          element.properties.width = asset.width;
          element.properties.alt = element.properties.alt || asset.name;
        }
      }
    });
  };
}
