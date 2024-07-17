import React from 'react';

import type { Document } from '@hackersheet/core';
import type { FC, ReactNode } from 'react';
import type { ExtraProps } from 'react-markdown';

export type KifuToComponentProps = {
  id: string;
  ply: string;
  label?: string;
  children?: ReactNode;
};

export type KifuToComponentResolverProps = { children: ReactNode } & ExtraProps &
  ExtraProps & {
    document: Document;
    KifuToComponent: FC<KifuToComponentProps>;
  };

export default function KifuToComponentResolver({ children, node, KifuToComponent }: KifuToComponentResolverProps) {
  const childrenElm = <>{children}</>;

  if (!node) return childrenElm;
  if (typeof children !== 'string') return childrenElm;

  const [id, ply] = children.split(':');
  const label = node.properties.label ? String(node.properties.label) : undefined;

  return <KifuToComponent id={id} ply={ply} label={label} children={children} />;
}
