import React from 'react';

import type { Document } from '@hackersheet/core';
import type { FC, ReactNode } from 'react';
import type { ExtraProps } from 'react-markdown';

type HeadingTagType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type HeadingComponentProps = {
  HeadingTag: HeadingTagType;
  id?: string;
  children?: ReactNode;
};

export type HeadingComponentResolverProps = React.ClassAttributes<HTMLHeadingElement> &
  React.HTMLAttributes<HTMLHeadingElement> &
  ExtraProps & {
    document: Document;
    HeadingComponent: FC<HeadingComponentProps>;
  };

export default function HeadingComponentResolver({
  node,
  HeadingComponent,
  id,
  children,
}: HeadingComponentResolverProps) {
  const isHeadingTag = (tagName: unknown): tagName is HeadingTagType => {
    return typeof tagName === 'string' && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName);
  };

  const HeadingTag: HeadingTagType = isHeadingTag(node?.tagName) ? node?.tagName : 'h2';

  return <HeadingComponent HeadingTag={HeadingTag} id={id} children={children} />;
}
