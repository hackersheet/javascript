import React from 'react';

import type { Document } from '@hackersheet/core';
import type { Element } from 'hast';
import type { FC, ReactNode } from 'react';
import type { ExtraProps } from 'react-markdown';

export type GistComponentProps = {
  gistId: string;
  filename?: string;
  url?: string;
  children?: ReactNode;
};

export type GistComponentResolverProps = { children: ReactNode } & ExtraProps & {
    document: Document;
    GistComponent: FC<GistComponentProps>;
  };

export default function GistComponentResolver({ children, node, GistComponent }: GistComponentResolverProps) {
  const childrenElm = <p>{children}</p>;

  if (!node) return childrenElm;

  const href = (node['children'][0] as Element).properties?.href;

  if (!href || typeof href !== 'string') return <p>{children}</p>;

  const gistId = getGistIdFromGistUrl(href);

  const filename = node.properties.filename ? String(node.properties.filename) : undefined;

  if (!gistId) return <p>{children}</p>;

  return <GistComponent gistId={gistId} filename={filename} url={href} children={children} />;
}

function getGistIdFromGistUrl(value: string) {
  try {
    const url = new URL(value);
    if (/(^|\.)gist.github.com$/.test(url.host)) {
      return url.pathname.match(/^\/.+\/(\w+)$/)?.[1];
    }
  } catch {
    return;
  }
}
