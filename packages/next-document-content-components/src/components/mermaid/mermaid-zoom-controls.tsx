'use client';

import React, { memo } from 'react';

/**
 * Props for the MermaidZoomControls component.
 */
export type MermaidZoomControlsProps = {
  /** Callback to zoom in */
  onZoomIn: () => void;
  /** Callback to zoom out */
  onZoomOut: () => void;
  /** Callback to reset zoom */
  onReset: () => void;
  /** Whether the diagram is currently zoomed */
  isZoomed: boolean;
  /** Callback to open fullscreen modal */
  onFullscreen?: () => void;
};

/**
 * Zoom control buttons for Mermaid diagrams.
 *
 * @remarks
 * Provides zoom in, zoom out, reset, and optional fullscreen buttons.
 * Memoized to prevent unnecessary re-renders when parent state changes.
 *
 * @param props - The component props
 * @returns The zoom controls component
 */
function MermaidZoomControlsComponent({
  onZoomIn,
  onZoomOut,
  onReset,
  isZoomed,
  onFullscreen,
}: MermaidZoomControlsProps) {
  return (
    <div className="mermaid-zoom-controls">
      <button type="button" onClick={onZoomIn} className="mermaid-zoom-btn" title="Zoom in (+)" aria-label="Zoom in">
        +
      </button>
      <button type="button" onClick={onZoomOut} className="mermaid-zoom-btn" title="Zoom out (-)" aria-label="Zoom out">
        −
      </button>
      <button
        type="button"
        onClick={onReset}
        className="mermaid-zoom-btn mermaid-zoom-reset-btn"
        title="Reset zoom (Ctrl+0)"
        aria-label="Reset zoom"
        disabled={!isZoomed}
      >
        ⟳
      </button>
      {onFullscreen ? (
        <button
          type="button"
          onClick={onFullscreen}
          className="mermaid-zoom-btn"
          title="Fullscreen"
          aria-label="Open fullscreen"
        >
          ⤢
        </button>
      ) : null}
    </div>
  );
}

export const MermaidZoomControls = memo(MermaidZoomControlsComponent);

export default MermaidZoomControls;
