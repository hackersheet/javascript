'use client';

import React from 'react';

import {
  drawBoardBackground,
  drawBoardGrid,
  drawBoardPieces,
  drawBoardCoordinates,
  drawHighlightedCell,
} from './board-renderer';
import { getCanvasDimensions, getBoardLayout } from './canvas-utils';
import { ShogiBoardCanvasProps } from './types';

/**
 * Canvas component for rendering the shogi board with pieces
 *
 * @component
 * @param props - Component props
 * @returns Canvas element displaying the shogi board
 *
 * @example
 * ```tsx
 * <ShogiBoardCanvas
 *   size={360}
 *   pieces={boardState}
 *   isSente={true}
 *   currentMove={lastMove}
 * />
 * ```
 */
const ShogiBoardCanvas: React.FC<ShogiBoardCanvasProps> = ({
  size = 360,
  boardColor = '#f9d27a',
  lineColor = '#000',
  fontFamily = 'serif',
  fontSizeRatio = 0.7,
  pieces,
  isSente = true,
  currentMove,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, dpr } = getCanvasDimensions(size);
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);

    const { margin, boardSize, cell } = getBoardLayout(size);

    drawBoardBackground(ctx, size, boardColor);
    drawBoardGrid(ctx, margin, boardSize, lineColor);
    drawHighlightedCell(ctx, margin, cell, isSente, currentMove);
    drawBoardPieces(ctx, pieces, margin, cell, fontFamily, fontSizeRatio, isSente);
    drawBoardCoordinates(ctx, margin, boardSize, cell, fontFamily, isSente);
  }, [size, boardColor, lineColor, fontFamily, fontSizeRatio, pieces, isSente, currentMove]);

  return <canvas ref={canvasRef} width={size} height={size} />;
};

export default ShogiBoardCanvas;
