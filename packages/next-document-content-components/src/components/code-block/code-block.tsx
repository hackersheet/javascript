import React from 'react';

import CodeBlockCopyButton from './code-block-copy-button';
import CodeBlockIcon from './code-block-icon';
import { highlighteCode } from './shiki';

import type { CodeBlockComponentProps } from '@hackersheet/react-document-content';

export default async function CodeBlock({ code, ...props }: CodeBlockComponentProps) {
  const [language, filename] = props.language.split(':');

  const html = await highlighteCode(code, language);

  return (
    <div className="code-block">
      <div className="code-block-header">
        <div>
          <CodeBlockIcon language={language} />
        </div>
        <div className="code-block-filename">{filename}</div>
        <div>
          <CodeBlockCopyButton code={code} />
        </div>
      </div>
      {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
      {!html && <pre>{code}</pre>}
    </div>
  );
}
