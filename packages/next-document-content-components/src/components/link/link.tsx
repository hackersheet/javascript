import NextLink from 'next/link';
import React from 'react';

import type { LinkComponentProps } from '@hackersheet/react-document-content';

export default function Link({ href, id, children }: LinkComponentProps) {
  return (
    <NextLink href={href} id={id}>
      {children}
    </NextLink>
  );
}
