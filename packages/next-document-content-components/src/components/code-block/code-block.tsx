import React from 'react';

import CodeBlockCode from './code-block-code';
import CodeBlockHeader from './code-block-header';
import CodeBlockIcon from './code-block-icon';
import { highlighteCode } from './shiki';

import type { CodeBlockComponentProps } from '@hackersheet/react-document-content';

/**
 * A component that renders a syntax-highlighted code block.
 *
 * The header displays a language icon, optional filename (extracted from the
 * colon-delimited language string), and a copy button.
 *
 * Uses Shiki for syntax highlighting. Falls back to a plain `<pre>` block
 * if highlighting fails.
 *
 * @param props - The component props
 * @param props.code - The source code to display
 * @param props.language - Language identifier, optionally with filename (e.g., "typescript:example.ts")
 * @returns The rendered code block element
 */
export default async function CodeBlock({ code, ...props }: CodeBlockComponentProps) {
  const [language, filename] = props.language.split(':');

  const html = await highlighteCode(code, language);

  return (
    <div className="code-block">
      <CodeBlockHeader icon={<CodeBlockIcon language={language} />} filename={filename} code={code} />
      <CodeBlockCode code={code} highlightedHtml={html} />
    </div>
  );
}
