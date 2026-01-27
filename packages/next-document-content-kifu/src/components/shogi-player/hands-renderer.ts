import { JKFPlayer } from 'json-kifu-format';
import { Piece, Color } from 'shogi.js';

/**
 * Draw the background of the hands area
 * Fills the canvas with a solid color
 *
 * @param ctx - Canvas rendering context
 * @param width - Width of the canvas
 * @param height - Height of the canvas
 * @param color - Background color hex code
 */
export function drawHandsBackground(ctx: CanvasRenderingContext2D, width: number, height: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw the frame border for the hands area
 * Creates a bordered rectangle around the hands display
 *
 * @param ctx - Canvas rendering context
 * @param x - X coordinate of the frame
 * @param y - Y coordinate of the frame
 * @param width - Width of the frame
 * @param height - Height of the frame
 * @param lineColor - Color of the border lines
 * @param isTop - Whether this is the top hands area (affects positioning)
 */
export function drawHandsFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  lineColor: string,
  isTop: boolean
): void {
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  if (isTop) {
    ctx.strokeRect(x, y, width, height);
  } else {
    ctx.strokeRect(x, 2, width, height);
  }
}

/**
 * Draw captured pieces (hands) on the canvas
 * Displays pieces grouped by type with counts for multiple captures
 *
 * @param ctx - Canvas rendering context
 * @param hands - 2D array of captured pieces
 * @param margin - Margin from canvas edge
 * @param boardSize - Width of the hands area
 * @param cell - Size of a single cell
 * @param fontFamily - Font family for piece names
 * @param fontSizeRatio - Font size ratio relative to cell size
 * @param isSente - Whether rendering from black player's perspective
 * @param isTop - Whether this is the top hands area
 */
export function drawHandsPieces(
  ctx: CanvasRenderingContext2D,
  hands: Piece[][],
  margin: number,
  boardSize: number,
  cell: number,
  fontFamily: string,
  fontSizeRatio: number,
  isSente: boolean,
  isTop: boolean
): void {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const pieces = (isSente && isTop) || (!isSente && !isTop) ? hands[Color.White] : hands[Color.Black];
  if (!pieces || pieces.length === 0) return;

  // Group pieces by kind and count
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

    // Rotate piece if it belongs to the opposite color relative to current perspective
    if (isSente && color === Color.White) {
      ctx.rotate(Math.PI);
    } else if (!isSente && color === Color.Black) {
      ctx.rotate(Math.PI);
    }

    const fontSize = cell * fontSizeRatio;
    const kan = JKFPlayer.kindToKan(kind);
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillText(kan, 0, 0);

    // Draw count number if more than one piece is captured
    if (count > 1) {
      ctx.font = `${fontSize * 0.5}px ${fontFamily}`;
      const countOffsetY = cell * 0.8;
      ctx.fillText(String(count), 0, countOffsetY);
    }

    ctx.restore();
  });
}
