import React from 'react';

import CodeBlockCopyButton from './code-block-copy-button';
import CodeBlockIcon from './code-block-icon';
import CodeBlockKifu from './code-block-kifu';
import CodeBlockMermaid from './code-block-mermaid';
import { highlighteCode } from './shiki';

import type { CodeBlockComponentProps } from '@hackersheet/react-document-content';

export default async function CodeBlock({ code, language }: CodeBlockComponentProps) {
  const [lang, filename] = language.split(':');

  const isMermaid = lang === 'mermaid';
  const isKifu = lang === 'kifu';

  if (isMermaid) return <CodeBlockMermaid code={code} />;
  if (isKifu) return <CodeBlockKifu kifu={code} filename={filename} />;

  const html = await highlighteCode(code, lang);

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
