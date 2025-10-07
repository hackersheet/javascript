'use client';

import { JKFPlayer } from 'json-kifu-format';
import React from 'react';
import { Piece, Color } from 'shogi.js';

type Props = {
  size?: number;
  boardColor?: string;
  lineColor?: string;
  fontFamily?: string;
  fontSizeRatio?: number;
  hands: Piece[][];
  isSente?: boolean;
  isTop?: boolean;
};

// ------------------------
// ユーティリティ関数
// ------------------------
const getCanvasDimensions = (size: number) => {
  const dpr = window.devicePixelRatio || 1;
  return { width: size * dpr, height: size * dpr, dpr };
};

const getHandsLayout = (size: number) => {
  const margin = size * 0.06;
  const boardSize = size - margin * 2;
  const cellSize = boardSize / 9;
  const handsHeight = cellSize + margin + 2;
  return { margin, handsHeight, boardSize, cellSize };
};

// ------------------------
// 描画関数
// ------------------------
const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
};

const drawHandsFrame = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  lineColor: string,
  isTop: boolean
) => {
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  if (isTop) {
    ctx.strokeRect(x, y, width, height);
  } else {
    ctx.strokeRect(x, 2, width, height);
  }
};

const drawCoordinates = (ctx: CanvasRenderingContext2D, fontSize: number, fontFamily: string) => {
  ctx.fillStyle = '#000';
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
};

const drawPieces = (
  ctx: CanvasRenderingContext2D,
  hands: Piece[][],
  margin: number,
  boardSize: number,
  cell: number,
  fontFamily: string,
  fontSizeRatio: number,
  isSente: boolean,
  isTop: boolean
) => {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const pieces = (isSente && isTop) || (!isSente && !isTop) ? hands[Color.White] : hands[Color.Black];
  if (!pieces || pieces.length === 0) return;

  const grouped = pieces.reduce<Record<Piece['kind'], { count: number; color: Color }>>(
    (acc, piece) => {
      if (!piece) return acc;
      const key = piece.kind;
      if (!acc[key]) acc[key] = { count: 0, color: piece.color };
      acc[key].count += 1;
      return acc;
    },
    {} as Record<Piece['kind'], { count: number; color: Color }>
  );

  const order: Piece['kind'][] = ['OU', 'HI', 'KA', 'KI', 'GI', 'KE', 'KY', 'FU'];
  const kinds = order.filter((kind) => grouped[kind]);

  kinds.forEach((kind, index) => {
    const { count, color } = grouped[kind];
    const px = isTop ? margin + boardSize - (index * cell + cell / 2) : margin + index * cell + cell / 2;
    const py = isTop ? margin + cell / 2 : cell / 2 + 2;

    ctx.save();
    ctx.translate(px, py);

    if (isSente && color === Color.White) {
      ctx.rotate(Math.PI);
    } else if (!isSente && color === Color.Black) {
      ctx.rotate(Math.PI);
    }

    const fontSize = cell * fontSizeRatio;
    const kan = JKFPlayer.kindToKan(kind);
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillText(kan, 0, 0);

    if (count > 1) {
      ctx.font = `${fontSize * 0.5}px ${fontFamily}`;
      const countOffsetX = cell * 0;
      const countOffsetY = cell * 0.8;
      ctx.fillText(String(count), countOffsetX, countOffsetY);
    }

    ctx.restore();
  });
};

// ------------------------
// メインコンポーネント
// ------------------------
const ShogiHandsCanvas: React.FC<Props> = ({
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

    drawBackground(ctx, size, handsHeight, boardColor);
    drawHandsFrame(ctx, margin, margin, boardSize, cellSize, lineColor, isTop);
    drawCoordinates(ctx, cellSize * 0.35, fontFamily);
    drawPieces(ctx, hands, margin, boardSize, cellSize, fontFamily, fontSizeRatio, isSente, isTop);
  }, [size, boardColor, lineColor, fontFamily, fontSizeRatio, isSente, hands, isTop]);

  return <canvas ref={canvasRef} />;
};

export default ShogiHandsCanvas;
