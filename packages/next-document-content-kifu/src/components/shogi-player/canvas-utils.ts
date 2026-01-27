import { BoardLayout, CanvasDimensions, HandsLayout } from './types';

/**
 * Calculate canvas dimensions based on device pixel ratio
 * Adjusts canvas resolution for crisp rendering on HiDPI displays
 *
 * @param size - Base size in CSS pixels
 * @returns Canvas dimensions with DPR applied for high-quality rendering
 */
export function getCanvasDimensions(size: number): CanvasDimensions {
  const dpr = window.devicePixelRatio || 1;
  return { width: size * dpr, height: size * dpr, dpr };
}

/**
 * Calculate board layout dimensions
 * Computes margins and cell size based on canvas size
 *
 * @param size - Base size in CSS pixels
 * @returns Layout object containing margin, total board size, and individual cell size
 */
export function getBoardLayout(size: number): BoardLayout {
  const margin = size * 0.06;
  const boardSize = size - margin * 2;
  const cell = boardSize / 9;
  return { margin, boardSize, cell };
}

/**
 * Calculate hands (captured pieces) layout dimensions
 * Computes layout for the area displaying captured pieces
 *
 * @param size - Base size in CSS pixels
 * @returns Layout object with margins, height, and cell size for the hands area
 */
export function getHandsLayout(size: number): HandsLayout {
  const margin = size * 0.06;
  const boardSize = size - margin * 2;
  const cellSize = boardSize / 9;
  const handsHeight = cellSize + margin + 2;
  return { margin, handsHeight, boardSize, cellSize };
}
