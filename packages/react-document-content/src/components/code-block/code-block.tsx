import React from 'react';

import { CodeBlockComponentProps } from '../../component-resolvers';

export default function CodeBlock(props: CodeBlockComponentProps) {
  return (
    <div>
      <pre>{props.code}</pre>
    </div>
  );
}
