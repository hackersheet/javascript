import React from 'react';

import { LinkComponentProps } from '../../component-resolvers/a-component-resolver';

export default function Link({ href, id, children }: LinkComponentProps) {
  return (
    <a href={href} id={id}>
      {children}
    </a>
  );
}
