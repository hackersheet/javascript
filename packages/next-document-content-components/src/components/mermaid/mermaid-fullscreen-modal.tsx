'use client';

import React, { memo, useCallback } from 'react';

import { MermaidDiagramContent } from './mermaid-diagram-content';
import { MermaidZoomControls } from './mermaid-zoom-controls';
import { useBodyScrollLock } from './use-body-scroll-lock';
import { useEscapeKey } from './use-escape-key';
import { usePanZoom } from './use-pan-zoom';

/**
 * Props for the MermaidFullscreenModal component.
 */
export type MermaidFullscreenModalProps = {
  /** The rendered SVG string */
  svg: string;
  /** Callback to close the modal */
  onClose: () => void;
};

/**
 * Fullscreen modal for viewing Mermaid diagrams with pan and zoom.
 *
 * @remarks
 * This component provides:
 * - Full viewport modal overlay with position: fixed
 * - Pan and zoom controls
 * - ESC key to close
 * - Click outside to close
 * - Body scroll lock when open
 *
 * Renders inline (no Portal) to use CSS Module styles from parent.
 * position: fixed works regardless of DOM hierarchy.
 *
 * @param props - The component props
 * @param props.svg - The rendered SVG string
 * @param props.onClose - Callback to close the modal
 * @returns The fullscreen modal element
 */
function MermaidFullscreenModalComponent({ svg, onClose }: MermaidFullscreenModalProps) {
  const { containerRef, contentRef, state, zoomIn, zoomOut, reset, isDragging, isZoomed } = usePanZoom();

  const cursorStyle = isDragging ? 'grabbing' : isZoomed ? 'grab' : 'default';

  // Custom hooks for modal behavior
  useEscapeKey(onClose);
  useBodyScrollLock();

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div className="mermaid-fullscreen-modal" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="mermaid-fullscreen-content">
        <div
          ref={containerRef}
          className="mermaid-fullscreen-pan-zoom-container"
          tabIndex={0}
          style={{ cursor: cursorStyle }}
        >
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
        <div className="mermaid-fullscreen-controls">
          <MermaidZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} isZoomed={isZoomed} />
          <button type="button" onClick={onClose} className="mermaid-fullscreen-close-btn" aria-label="Close">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export const MermaidFullscreenModal = memo(MermaidFullscreenModalComponent);

export default MermaidFullscreenModal;
