/**
 * Mermaid diagram component and utilities.
 * @module
 */

export { default } from './mermaid';
export { default as Mermaid } from './mermaid';
export { getErrorMessage, hasValidSvgDimensions, normalizeCode } from './mermaid-utils';
export { renderWithBeautifulMermaid, renderWithMermaidFallback, withSafeJsonStringify } from './mermaid-renderer';
export type { MermaidRenderResult } from './mermaid-renderer';
