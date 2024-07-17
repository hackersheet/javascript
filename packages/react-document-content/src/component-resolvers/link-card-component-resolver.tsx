import React from 'react';

import type { Document } from '@hackersheet/core';
import type { Element } from 'hast';
import type { FC, ReactNode } from 'react';
import type { ExtraProps } from 'react-markdown';

export type LinkCardComponentProps = {
  url: string;
  title: string;
  description: string;
  domain: string;
  imageUrl?: string;
  imageHeight?: number;
  imageWidth?: number;
  children?: ReactNode;
};

export type LinkCardComponentResolverProps = { children: ReactNode } & ExtraProps & {
    document: Document;
    LinkCardComponent: FC<LinkCardComponentProps>;
  };

export default function LinkCardComponentResolver({
  children,
  node,
  document,
  LinkCardComponent,
}: LinkCardComponentResolverProps) {
  if (!node) {
    return <p>{children}</p>;
  }

  const href = (node['children'][0] as Element).properties?.href;

  if (!href) {
    return <p>{children}</p>;
  }

  const website = document.websites.find((website) => website.url === href);

  if (!website) {
    return <p>{children}</p>;
  }

  return (
    <LinkCardComponent
      url={website.url}
      title={website.ogTitle || website.title || website.url}
      description={website.ogDescription || website.description}
      domain={website.domain}
      imageUrl={website.ogImage?.fileUrl ?? undefined}
      imageHeight={website.ogImage?.height}
      imageWidth={website.ogImage?.width}
      children={children}
    />
  );
}
