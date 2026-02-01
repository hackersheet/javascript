'use client';

import React, { memo } from 'react';

/**
 * Props for the MermaidDiagramContent component.
 */
export type MermaidDiagramContentProps = {
  /** The rendered SVG string */
  svg: string;
};

/**
 * Component for rendering the Mermaid diagram SVG.
 *
 * @remarks
 * This component is memoized to prevent unnecessary re-renders
 * when only the SVG content matters. Uses dangerouslySetInnerHTML
 * to render the pre-rendered SVG string from Mermaid.
 *
 * @param props - The component props
 * @param props.svg - The rendered SVG string
 * @returns The diagram content
 */
function MermaidDiagramContentComponent({ svg }: MermaidDiagramContentProps) {
  return <div className="mermaid-diagram" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export const MermaidDiagramContent = memo(MermaidDiagramContentComponent);

export default MermaidDiagramContent;
