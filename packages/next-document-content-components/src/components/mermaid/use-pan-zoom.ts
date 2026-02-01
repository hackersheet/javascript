'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Minimum scale value for zoom.
 */
const MIN_SCALE = 0.5;

/**
 * Maximum scale value for zoom.
 */
const MAX_SCALE = 3;

/**
 * Scale step for zoom in/out operations.
 */
const SCALE_STEP = 0.25;

/**
 * Scale step for wheel zoom operations.
 */
const WHEEL_SCALE_STEP = 0.1;

/**
 * Position coordinates for pan operations.
 */
export interface Position {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
}

/**
 * State of the pan/zoom functionality.
 */
export interface PanZoomState {
  /** Current scale value (1 = 100%) */
  scale: number;
  /** Current position offset */
  position: Position;
}

/**
 * Return type for the usePanZoom hook.
 */
export interface UsePanZoomReturn {
  /** Ref to attach to the container element */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Ref to attach to the content element */
  contentRef: React.RefObject<HTMLDivElement | null>;
  /** Current pan/zoom state */
  state: PanZoomState;
  /** Zoom in by one step */
  zoomIn: () => void;
  /** Zoom out by one step */
  zoomOut: () => void;
  /** Reset to initial state */
  reset: () => void;
  /** Whether the user is currently dragging */
  isDragging: boolean;
  /** Whether zoom controls should be visible */
  isZoomed: boolean;
}

/**
 * Clamps a value between min and max.
 *
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns The clamped value
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Rounds a number to two decimal places.
 *
 * @param value - The value to round
 * @returns The rounded value
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Custom hook for adding pan and zoom functionality to an element.
 *
 * @remarks
 * This hook provides:
 * - Mouse wheel zoom (centered on pointer position)
 * - Drag to pan (only when zoomed in)
 * - Double-click to reset
 * - Zoom in/out/reset functions for control buttons
 * - Boundary constraints to keep content visible
 *
 * @returns Pan/zoom state and control functions
 *
 * @example
 * ```tsx
 * const { containerRef, contentRef, state, zoomIn, zoomOut, reset, isDragging, isZoomed } = usePanZoom();
 *
 * return (
 *   <div ref={containerRef} style={{ overflow: 'hidden' }}>
 *     <div
 *       ref={contentRef}
 *       style={{
 *         transform: `translate(${state.position.x}px, ${state.position.y}px) scale(${state.scale})`,
 *         cursor: isDragging ? 'grabbing' : isZoomed ? 'grab' : 'default'
 *       }}
 *     >
 *       {content}
 *     </div>
 *   </div>
 * );
 * ```
 */
export function usePanZoom(): UsePanZoomReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [state, setState] = useState<PanZoomState>({
    scale: 1,
    position: { x: 0, y: 0 },
  });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<Position | null>(null);
  const lastPositionRef = useRef<Position>({ x: 0, y: 0 });

  const isZoomed = state.scale > 1;

  /**
   * Constrains position to keep content visible within container bounds.
   */
  const constrainPosition = useCallback((position: Position): Position => {
    const container = containerRef.current;
    const content = contentRef.current;

    if (!container || !content) {
      return position;
    }

    const containerRect = container.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();

    const scaledWidth = contentRect.width;
    const scaledHeight = contentRect.height;

    // Calculate max movement based on how much content exceeds container
    const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2);
    const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2);

    return {
      x: clamp(position.x, -maxX, maxX),
      y: clamp(position.y, -maxY, maxY),
    };
  }, []);

  /**
   * Zooms to a specific scale, optionally centered on a point.
   */
  const zoomTo = useCallback(
    (newScale: number, centerPoint?: Position) => {
      setState((prev) => {
        const clampedScale = clamp(roundToTwoDecimals(newScale), MIN_SCALE, MAX_SCALE);

        if (clampedScale === prev.scale) {
          return prev;
        }

        let newPosition = prev.position;

        // If a center point is provided, adjust position to zoom towards that point
        if (centerPoint && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const containerCenterX = containerRect.width / 2;
          const containerCenterY = containerRect.height / 2;

          // Calculate offset from center
          const offsetX = centerPoint.x - containerCenterX;
          const offsetY = centerPoint.y - containerCenterY;

          // Calculate scale ratio
          const scaleRatio = clampedScale / prev.scale;

          // Adjust position to zoom towards pointer
          newPosition = {
            x: prev.position.x - offsetX * (scaleRatio - 1),
            y: prev.position.y - offsetY * (scaleRatio - 1),
          };
        }

        // If zooming back to 1 or less, reset position
        if (clampedScale <= 1) {
          newPosition = { x: 0, y: 0 };
        } else {
          newPosition = constrainPosition(newPosition);
        }

        return {
          scale: clampedScale,
          position: newPosition,
        };
      });
    },
    [constrainPosition]
  );

  const zoomIn = useCallback(() => {
    zoomTo(state.scale + SCALE_STEP);
  }, [state.scale, zoomTo]);

  const zoomOut = useCallback(() => {
    zoomTo(state.scale - SCALE_STEP);
  }, [state.scale, zoomTo]);

  const reset = useCallback(() => {
    setState({
      scale: 1,
      position: { x: 0, y: 0 },
    });
  }, []);

  // Handle wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Only zoom with Ctrl/Cmd key or if already zoomed
      if (!e.ctrlKey && !e.metaKey && state.scale === 1) {
        return;
      }

      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const centerPoint: Position = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      const delta = e.deltaY > 0 ? -WHEEL_SCALE_STEP : WHEEL_SCALE_STEP;
      zoomTo(state.scale + delta, centerPoint);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [state.scale, zoomTo]);

  // Handle drag for panning
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only allow panning when zoomed in
      if (state.scale <= 1) return;

      // Ignore if clicking on a button
      if ((e.target as HTMLElement).closest('button')) return;

      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      lastPositionRef.current = state.position;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      const newPosition = constrainPosition({
        x: lastPositionRef.current.x + deltaX,
        y: lastPositionRef.current.y + deltaY,
      });

      setState((prev) => ({
        ...prev,
        position: newPosition,
      }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [state.scale, state.position, isDragging, constrainPosition]);

  // Handle double-click to reset
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleDoubleClick = (e: MouseEvent) => {
      // Ignore if clicking on a button
      if ((e.target as HTMLElement).closest('button')) return;

      e.preventDefault();
      reset();
    };

    container.addEventListener('dblclick', handleDoubleClick);
    return () => container.removeEventListener('dblclick', handleDoubleClick);
  }, [reset]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle when container or its children are focused
      if (!container.contains(document.activeElement) && document.activeElement !== container) {
        return;
      }

      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            reset();
          }
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, reset]);

  return {
    containerRef,
    contentRef,
    state,
    zoomIn,
    zoomOut,
    reset,
    isDragging,
    isZoomed,
  };
}

export default usePanZoom;
