'use client';

import React from 'react';

import { getCanvasDimensions, getHandsLayout } from './canvas-utils';
import { drawHandsBackground, drawHandsFrame, drawHandsPieces } from './hands-renderer';
import { ShogiHandsCanvasProps } from './types';

/**
 * Canvas component for rendering captured pieces (hands)
 *
 * @component
 * @param props - Component props
 * @returns Canvas element displaying the hands (captured pieces area)
 *
 * @example
 * ```tsx
 * <ShogiHandsCanvas
 *   size={360}
 *   hands={capturedPieces}
 *   isSente={true}
 *   isTop={true}
 * />
 * ```
 */
const ShogiHandsCanvas: React.FC<ShogiHandsCanvasProps> = ({
  size = 360,
  boardColor = '#f9d27a',
  lineColor = '#000',
  fontFamily = 'serif',
  fontSizeRatio = 0.7,
  hands,
  isSente = true,
  isTop = false,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { margin, handsHeight, boardSize, cellSize } = getHandsLayout(size);
    const { width: canvasWidth, dpr } = getCanvasDimensions(size);

    canvas.width = canvasWidth;
    canvas.height = handsHeight * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${handsHeight}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, handsHeight);

    drawHandsBackground(ctx, size, handsHeight, boardColor);
    drawHandsFrame(ctx, margin, margin, boardSize, cellSize, lineColor, isTop);
    drawHandsPieces(ctx, hands, margin, boardSize, cellSize, fontFamily, fontSizeRatio, isSente, isTop);
  }, [size, boardColor, lineColor, fontFamily, fontSizeRatio, isSente, hands, isTop]);

  return <canvas ref={canvasRef} />;
};

export default ShogiHandsCanvas;
