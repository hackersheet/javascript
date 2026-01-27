import { JKFPlayer } from 'json-kifu-format';
import { IMoveMoveFormat } from 'json-kifu-format/dist/src/Formats';
import { Piece, Color } from 'shogi.js';

/**
 * Draw the board background
 * Fills the entire canvas with the board color
 *
 * @param ctx - Canvas rendering context
 * @param size - Canvas size in CSS pixels
 * @param boardColor - Background color hex code
 */
export function drawBoardBackground(ctx: CanvasRenderingContext2D, size: number, boardColor: string): void {
  ctx.fillStyle = boardColor;
  ctx.fillRect(0, 0, size, size);
}

/**
 * Draw the board grid (lines and outer frame)
 * Creates the 9x9 grid structure with outer border
 *
 * @param ctx - Canvas rendering context
 * @param margin - Margin from canvas edge
 * @param boardSize - Total size of the board area
 * @param lineColor - Color of the lines
 */
export function drawBoardGrid(
  ctx: CanvasRenderingContext2D,
  margin: number,
  boardSize: number,
  lineColor: string
): void {
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2; // Outer frame
  ctx.strokeRect(margin, margin, boardSize, boardSize);

  ctx.lineWidth = 1; // Inner grid lines
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
}

/**
 * Draw all pieces on the board
 * Renders pieces with proper rotation based on perspective
 *
 * @param ctx - Canvas rendering context
 * @param pieces - 2D array of pieces on the board
 * @param margin - Margin from canvas edge
 * @param cell - Size of a single cell
 * @param fontFamily - Font family for piece characters
 * @param fontSizeRatio - Font size ratio relative to cell size
 * @param isSente - Whether rendering from black player's perspective
 */
export function drawBoardPieces(
  ctx: CanvasRenderingContext2D,
  pieces: Piece[][],
  margin: number,
  cell: number,
  fontFamily: string,
  fontSizeRatio: number,
  isSente: boolean
): void {
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

      // Rotate piece if it belongs to the opposite color relative to current perspective
      if (isSente && piece.color === Color.White) {
        ctx.rotate(Math.PI);
      } else if (!isSente && piece.color === Color.Black) {
        ctx.rotate(Math.PI);
      }

      const kan = JKFPlayer.kindToKan(piece.kind);
      ctx.fillStyle = '#000';

      if (kan.length === 2) {
        // 2-character pieces: display vertically
        const baseFontSize = cell * fontSizeRatio * 0.5;
        ctx.font = `${baseFontSize}px ${fontFamily}`;

        const scaleX = 2.0;
        const scaleY = 1.0;
        const offsetY = cell * 0.18;

        // First character
        ctx.save();
        ctx.scale(scaleX, scaleY);
        ctx.fillText(kan[0], 0 / scaleX, -offsetY / scaleY);
        ctx.restore();

        // Second character
        ctx.save();
        ctx.scale(scaleX, scaleY);
        ctx.fillText(kan[1], 0 / scaleX, offsetY / scaleY);
        ctx.restore();
      } else {
        // Single character: render centered
        const fontSize = cell * fontSizeRatio;
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillText(kan, 0, 0);
      }

      ctx.restore();
    });
  });
}

/**
 * Draw board coordinates (row and column labels)
 * Displays numbers and kanji labels around the board
 *
 * @param ctx - Canvas rendering context
 * @param margin - Margin from canvas edge
 * @param boardSize - Total size of the board area
 * @param cell - Size of a single cell
 * @param fontFamily - Font family for labels
 * @param isSente - Whether rendering from black player's perspective
 */
export function drawBoardCoordinates(
  ctx: CanvasRenderingContext2D,
  margin: number,
  boardSize: number,
  cell: number,
  fontFamily: string,
  isSente: boolean
): void {
  ctx.fillStyle = '#000';
  ctx.font = `${cell * 0.35}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Top horizontal coordinates
  Array.from({ length: 9 }).forEach((_, i) => {
    const x = margin + i * cell + cell / 2;
    const y = margin / 2;
    const label = isSente ? JKFPlayer.numToZen(9 - i) : JKFPlayer.numToZen(i + 1);
    ctx.fillText(label, x, y);
  });

  // Right side vertical coordinates
  Array.from({ length: 9 }).forEach((_, i) => {
    const x = margin + boardSize + margin / 2;
    const y = margin + i * cell + cell / 2;
    const label = isSente ? JKFPlayer.numToKan(i + 1) : JKFPlayer.numToKan(9 - i);
    ctx.fillText(label, x, y);
  });
}

/**
 * Highlight the destination and source cells of the current move
 * Uses red semi-transparent rectangles to indicate move locations
 *
 * @param ctx - Canvas rendering context
 * @param margin - Margin from canvas edge
 * @param cell - Size of a single cell
 * @param isSente - Whether rendering from black player's perspective
 * @param currentMove - Current move data, undefined means no highlight
 */
export function drawHighlightedCell(
  ctx: CanvasRenderingContext2D,
  margin: number,
  cell: number,
  isSente: boolean,
  currentMove?: IMoveMoveFormat
): void {
  if (!currentMove) return;

  // Highlight destination cell in red
  if (currentMove.to) {
    const toRow = currentMove.to.x - 1;
    const toCol = currentMove.to.y - 1;
    const toX = isSente ? 8 - toRow : toRow;
    const toY = isSente ? toCol : 8 - toCol;

    ctx.fillStyle = 'rgba(255,0,0,0.1)';
    ctx.fillRect(margin + toX * cell, margin + toY * cell, cell, cell);
  }

  // Highlight source cell in red
  if (currentMove.from) {
    const fromRow = currentMove.from.x - 1;
    const fromCol = currentMove.from.y - 1;
    const fromX = isSente ? 8 - fromRow : fromRow;
    const fromY = isSente ? fromCol : 8 - fromCol;

    ctx.fillStyle = 'rgba(255,0,0,0.1)';
    ctx.fillRect(margin + fromX * cell, margin + fromY * cell, cell, cell);
  }
}
