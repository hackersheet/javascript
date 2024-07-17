import React from 'react';

import type { Document } from '@hackersheet/core';
import type { FC, ReactNode } from 'react';
import type { ExtraProps } from 'react-markdown';

export type LinkComponentProps = {
  href: string;
  id?: string;
  children?: ReactNode;
};

export type AComponentResolverProps = JSX.IntrinsicElements['a'] &
  ExtraProps & {
    document: Document;
    LinkComponent: FC<LinkComponentProps>;
  };

export default function AComponentResolver({ href, id, children, LinkComponent }: AComponentResolverProps) {
  if (!href) {
    return <>{children}</>;
  }

  return <LinkComponent href={href} id={id} children={children} />;
}
