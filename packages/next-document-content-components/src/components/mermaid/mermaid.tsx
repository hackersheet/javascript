import React from 'react';

import MermaidClient from './mermaid-client';
import { highlighteCode } from '../code-block/shiki';

import type { MermaidComponentProps } from '@hackersheet/react-document-content';

/**
 * Mermaid diagram component that renders diagrams using beautiful-mermaid.
 *
 * This is a Server Component that:
 * - Pre-renders syntax highlighting for the code view using Shiki
 * - Delegates interactive rendering to MermaidClient
 *
 * @remarks
 * - Uses Shiki for syntax highlighting in the code view
 * - Falls back to a sandboxed iframe renderer if beautiful-mermaid fails
 * - Automatically switches between light and dark themes based on the current theme
 * - Supports toggling between diagram and code view
 *
 * @param props - The component props
 * @param props.code - The mermaid diagram code to render
 * @returns The rendered mermaid component
 */
export default async function Mermaid({ code }: MermaidComponentProps) {
  const highlightedHtml = await highlighteCode(code, 'mermaid');

  return <MermaidClient code={code} highlightedHtml={highlightedHtml} />;
}
