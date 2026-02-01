import React from 'react';

/**
 * Props for the CodeBlockCode component.
 */
export type CodeBlockCodeProps = {
  /** The raw source code to display as fallback */
  code: string;
  /** Pre-rendered HTML from Shiki highlighter */
  highlightedHtml?: string | null;
};

/**
 * A component that renders code with optional syntax highlighting.
 *
 * If `highlightedHtml` is provided, it renders the pre-highlighted HTML.
 * Otherwise, it falls back to displaying the raw code in a `<pre>` block.
 *
 * @param props - The component props
 * @param props.code - The raw source code to display as fallback
 * @param props.highlightedHtml - Pre-rendered HTML from Shiki highlighter
 * @returns The rendered code element
 */
export default function CodeBlockCode({ code, highlightedHtml }: CodeBlockCodeProps) {
  if (highlightedHtml) {
    return <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />;
  }
  return (
    <pre>
      <code>{code}</code>
    </pre>
  );
}
