'use client';

import React, { memo, useCallback, useState } from 'react';

import { MermaidDiagramContent } from './mermaid-diagram-content';
import { MermaidFullscreenModal } from './mermaid-fullscreen-modal';
import { MermaidZoomControls } from './mermaid-zoom-controls';
import { usePanZoom } from './use-pan-zoom';

/**
 * Props for the MermaidDiagramView component.
 */
export type MermaidDiagramViewProps = {
  /** The rendered SVG string */
  svg: string;
  /** Callback to toggle between diagram and code view */
  onToggleViewMode: () => void;
};

/**
 * Component for displaying Mermaid diagrams with pan and zoom functionality.
 *
 * @remarks
 * This component provides:
 * - Zoom in/out using mouse wheel (Ctrl/Cmd + wheel) or buttons
 * - Pan by dragging when zoomed in
 * - Double-click to reset zoom
 * - Keyboard shortcuts (+/- for zoom, Ctrl+0 for reset)
 * - Fullscreen modal view
 * - Resizable container
 *
 * @param props - The component props
 * @param props.svg - The rendered SVG string
 * @param props.onToggleViewMode - Callback to toggle view mode
 * @returns The rendered diagram view with pan/zoom controls
 */
function MermaidDiagramViewComponent({ svg, onToggleViewMode }: MermaidDiagramViewProps) {
  const { containerRef, contentRef, state, zoomIn, zoomOut, reset, isDragging, isZoomed } = usePanZoom();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const cursorStyle = isDragging ? 'grabbing' : isZoomed ? 'grab' : 'default';

  const openFullscreen = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  return (
    <div className="mermaid-block mermaid-diagram-view">
      <div ref={containerRef} className="mermaid-pan-zoom-container" tabIndex={0} style={{ cursor: cursorStyle }}>
        <div
          ref={contentRef}
          className="mermaid-pan-zoom-content"
          style={{
            transform: `translate(${state.position.x}px, ${state.position.y}px) scale(${state.scale})`,
          }}
        >
          <MermaidDiagramContent svg={svg} />
        </div>
      </div>
      <div className="mermaid-controls">
        <MermaidZoomControls
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={reset}
          isZoomed={isZoomed}
          onFullscreen={openFullscreen}
        />
        <button
          type="button"
          onClick={onToggleViewMode}
          className="mermaid-toggle-btn"
          title="Show code"
          aria-label="Show code"
        >
          Code
        </button>
      </div>
      {isFullscreen ? <MermaidFullscreenModal svg={svg} onClose={closeFullscreen} /> : null}
    </div>
  );
}

export const MermaidDiagramView = memo(MermaidDiagramViewComponent);

export default MermaidDiagramView;
