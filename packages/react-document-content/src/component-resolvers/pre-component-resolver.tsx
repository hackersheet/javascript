import React from 'react';

import type { Document } from '@hackersheet/core';
import type { Element, Text } from 'hast';
import type { FC, ReactNode } from 'react';
import type { ExtraProps } from 'react-markdown';

export type CodeBlockComponentProps = {
  code: string;
  language: string;
  document: Document;
  children?: ReactNode;
};

export type MermaidComponentProps = {
  code: string;
  language: string;
  document: Document;
  children?: ReactNode;
};

export type KifuComponentProps = {
  code: string;
  language: string;
  document: Document;
  children?: ReactNode;
};

export type PreComponentResolverProps = JSX.IntrinsicElements['pre'] &
  ExtraProps & {
    document: Document;
    CodeBlockComponent: FC<CodeBlockComponentProps>;
    MermaidComponent?: FC<MermaidComponentProps>;
    KifuComponent?: FC<KifuComponentProps>;
  };

export default function PreComponentResolver({
  children,
  node,
  document,
  CodeBlockComponent,
  MermaidComponent,
  KifuComponent,
}: PreComponentResolverProps) {
  const childrenElm = <>{children}</>;

  if (!node) {
    return childrenElm;
  }

  const code = node['children'][0] as Element;

  if (code['type'] !== 'element' || code['tagName'] !== 'code') {
    return childrenElm;
  }

  const text = code['children'][0] as Text;

  if (text['type'] !== 'text') {
    return childrenElm;
  }

  const className = code.properties.className as string;
  const codeValue = text.value;

  const match = /language-(.+)/.exec(className || '');
  const language = match && match[1] ? (match[1] as string) : '';

  const isMermaid = /^mermaid(:.*$|$)/.test(language);
  const isKifu = /^kifu(:.*$|$)/.test(language);

  const props = {
    code: codeValue,
    language: language,
    document: document,
    children: children,
  };

  if (isMermaid && MermaidComponent) return <MermaidComponent {...props} />;
  if (isKifu && KifuComponent) return <KifuComponent {...props} />;

  return <CodeBlockComponent {...props} />;
}
