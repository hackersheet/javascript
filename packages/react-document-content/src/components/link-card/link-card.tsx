import React from 'react';

import { LinkCardComponentProps } from '../../component-resolvers';

export default function LinkCard({ url, title }: LinkCardComponentProps) {
  return (
    <p>
      <a href={url}>{title}</a>
    </p>
  );
}
