'use client';

import { JKFPlayer } from 'json-kifu-format';
import { IMoveMoveFormat } from 'json-kifu-format/dist/src/Formats';
import React from 'react';
import { Piece, Color } from 'shogi.js';

type Props = {
  size?: number;
  boardColor?: string;
  lineColor?: string;
  fontFamily?: string;
  fontSizeRatio?: number;
  pieces: Piece[][];
  isSente?: boolean; // 先手目線かどうか
  currentMove?: IMoveMoveFormat;
};

// ------------------------
// ユーティリティ関数
// ------------------------
const getCanvasDimensions = (size: number) => {
  const dpr = window.devicePixelRatio || 1;
  return { width: size * dpr, height: size * dpr, dpr };
};

const getBoardLayout = (size: number) => {
  const margin = size * 0.06;
  const boardSize = size - margin * 2;
  const cell = boardSize / 9;
  return { margin, boardSize, cell };
};

// ------------------------
// 描画関数
// ------------------------
const drawBackground = (ctx: CanvasRenderingContext2D, size: number, boardColor: string) => {
  ctx.fillStyle = boardColor;
  ctx.fillRect(0, 0, size, size);
};

const drawBoard = (ctx: CanvasRenderingContext2D, margin: number, boardSize: number, lineColor: string) => {
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2; // 外枠
  ctx.strokeRect(margin, margin, boardSize, boardSize);

  ctx.lineWidth = 1; // 内部格子線
  Array.from({ length: 8 }).forEach((_, i) => {
    const offset = (i + 1) * (boardSize / 9);
    ctx.beginPath();
    ctx.moveTo(margin + offset, margin);
    ctx.lineTo(margin + offset, margin + boardSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(margin, margin + offset);
    ctx.lineTo(margin + boardSize, margin + offset);
    ctx.stroke();
  });
};

const drawPieces = (
  ctx: CanvasRenderingContext2D,
  pieces: Piece[][],
  margin: number,
  cell: number,
  fontFamily: string,
  fontSizeRatio: number,
  isSente: boolean,
  currentMove?: IMoveMoveFormat
) => {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  pieces.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      if (!piece) return;

      const x = isSente ? 8 - rowIndex : rowIndex;
      const y = isSente ? colIndex : 8 - colIndex;

      const px = margin + x * cell + cell / 2;
      const py = margin + y * cell + cell / 2;

      ctx.save();
      ctx.translate(px, py);

      // 駒の回転は、常に駒自身の方向に従う
      if (isSente && piece.color === Color.White) {
        ctx.rotate(Math.PI);
      } else if (!isSente && piece.color === Color.Black) {
        ctx.rotate(Math.PI);
      }

      const kan = JKFPlayer.kindToKan(piece.kind);
      ctx.fillStyle = '#000';

      if (currentMove) {
        // 今回の手番の駒をハイライト表示
        const to = currentMove.to;
        if (to && to.x === rowIndex + 1 && to.y === colIndex + 1) {
          ctx.fillStyle = 'red';
        }
      }

      if (kan.length === 2) {
        // 2文字 → 横長にして縦並び
        const baseFontSize = cell * fontSizeRatio * 0.5; // 1文字のときと同じサイズ
        ctx.font = `${baseFontSize}px ${fontFamily}`;

        // 横だけ拡大するスケール値
        const scaleX = 2.0;
        const scaleY = 1.0;

        // 上下オフセット（2文字をセル内に均等に配置）
        const offsetY = cell * 0.18;

        // 1文字目
        ctx.save();
        ctx.scale(scaleX, scaleY);
        ctx.fillText(kan[0], 0 / scaleX, -offsetY / scaleY);
        ctx.restore();

        // 2文字目
        ctx.save();
        ctx.scale(scaleX, scaleY);
        ctx.fillText(kan[1], 0 / scaleX, offsetY / scaleY);
        ctx.restore();
      } else {
        // 1文字のときそのまま中央に
        const fontSize = cell * fontSizeRatio;
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillText(kan, 0, 0);
      }

      ctx.restore();
    });
  });
};

const drawCoordinates = (
  ctx: CanvasRenderingContext2D,
  margin: number,
  boardSize: number,
  cell: number,
  fontFamily: string,
  isSente: boolean
) => {
  ctx.fillStyle = '#000';
  ctx.font = `${cell * 0.35}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 上側横座標
  Array.from({ length: 9 }).forEach((_, i) => {
    const x = margin + i * cell + cell / 2;
    const y = margin / 2;
    const label = isSente ? (9 - i).toString() : (i + 1).toString();
    ctx.fillText(label, x, y);
  });

  // 右側縦座標
  const kanji = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
  kanji.forEach((k, i) => {
    const x = margin + boardSize + margin / 2;
    const y = margin + i * cell + cell / 2;
    const label = isSente ? k : kanji[8 - i];
    ctx.fillText(label, x, y);
  });
};

// ------------------------
// メインコンポーネント
// ------------------------
const ShogiBoardCanvas: React.FC<Props> = ({
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

    drawBackground(ctx, size, boardColor);
    drawBoard(ctx, margin, boardSize, lineColor);
    drawPieces(ctx, pieces, margin, cell, fontFamily, fontSizeRatio, isSente, currentMove);
    drawCoordinates(ctx, margin, boardSize, cell, fontFamily, isSente);
  }, [size, boardColor, lineColor, fontFamily, fontSizeRatio, pieces, isSente, currentMove]);

  return <canvas ref={canvasRef} width={size} height={size} />;
};

export default ShogiBoardCanvas;
