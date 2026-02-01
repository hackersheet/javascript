/**
 * Mermaid diagram component and utilities.
 * @module
 */

export { default } from './mermaid';
export { default as Mermaid } from './mermaid';
export { default as MermaidClient } from './mermaid-client';
export { hasValidSvgDimensions, normalizeCode } from './mermaid-utils';
export { renderWithBeautifulMermaid } from './mermaid-renderer';
export { destroyIframe, renderWithIframe } from './mermaid-iframe-renderer';
export type { MermaidRenderResult } from './mermaid-renderer';
export type { MermaidClientProps } from './mermaid-client';
