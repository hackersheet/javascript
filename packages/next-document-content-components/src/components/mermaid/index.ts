/**
 * Mermaid diagram component and utilities.
 * @module
 */

// Main components
export { default } from './mermaid';
export { default as Mermaid } from './mermaid';
export { default as MermaidClient } from './mermaid-client';

// Sub-components
export { MermaidDiagramView } from './mermaid-diagram-view';
export { MermaidDiagramContent } from './mermaid-diagram-content';
export { MermaidFullscreenModal } from './mermaid-fullscreen-modal';
export { MermaidZoomControls } from './mermaid-zoom-controls';

// Utilities
export { hasValidSvgDimensions, normalizeCode } from './mermaid-utils';
export { renderWithBeautifulMermaid } from './mermaid-renderer';
export { destroyIframe, renderWithIframe } from './mermaid-iframe-renderer';

// Hooks
export { usePanZoom } from './use-pan-zoom';
export { useBodyScrollLock } from './use-body-scroll-lock';
export { useEscapeKey } from './use-escape-key';

// Types
export type { MermaidRenderResult } from './mermaid-renderer';
export type { MermaidClientProps } from './mermaid-client';
export type { MermaidDiagramViewProps } from './mermaid-diagram-view';
export type { MermaidDiagramContentProps } from './mermaid-diagram-content';
export type { MermaidFullscreenModalProps } from './mermaid-fullscreen-modal';
export type { MermaidZoomControlsProps } from './mermaid-zoom-controls';
export type { PanZoomState, Position, UsePanZoomReturn } from './use-pan-zoom';
