import React from 'react';

import { GistComponentProps } from '../../component-resolvers';

export default function Gist({ children }: GistComponentProps) {
  return <div>{children}</div>;
}
