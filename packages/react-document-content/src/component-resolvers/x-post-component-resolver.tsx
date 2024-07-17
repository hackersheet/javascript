import React from 'react';

import type { Document } from '@hackersheet/core';
import type { Element } from 'hast';
import type { FC, ReactNode } from 'react';
import type { ExtraProps } from 'react-markdown';

export type XPostComponentProps = {
  id: string;
  children?: ReactNode;
};

export type XPostComponentResolverProps = { children: ReactNode } & ExtraProps & {
    document: Document;
    XPostComponent: FC<XPostComponentProps>;
  };

export default function XPostComponentResolver({ children, node, XPostComponent }: XPostComponentResolverProps) {
  const childrenElm = <p>{children}</p>;

  if (!node) return childrenElm;

  const href = (node['children'][0] as Element).properties?.href;

  if (!href || typeof href !== 'string') return <p>{children}</p>;

  const id = getIdFromTwitterUrl(href);

  if (!id) return <p>{children}</p>;

  return <XPostComponent id={id} children={children} />;
}

function getIdFromTwitterUrl(value: string) {
  try {
    const url = new URL(value);
    if (/(^|\.)(twitter|x).com$/.test(url.host)) {
      return url.pathname.match(/\/status(es)?\/(\d+)/)?.[2];
    }
  } catch {
    return;
  }
}
