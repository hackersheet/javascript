import { IMoveMoveFormat } from 'json-kifu-format/dist/src/Formats';
import { Piece } from 'shogi.js';

/**
 * Props for ShogiBoardCanvas component
 * @property size - Canvas size in CSS pixels (default: 360)
 * @property boardColor - Background color of the board (default: '#f9d27a')
 * @property lineColor - Color of board lines (default: '#000')
 * @property fontFamily - Font family for coordinates and pieces (default: 'serif')
 * @property fontSizeRatio - Font size ratio relative to cell size (default: 0.7)
 * @property pieces - 2D array of pieces on the board
 * @property isSente - Whether to display from black player's perspective (default: true)
 * @property currentMove - Current move to highlight on the board
 */
export type ShogiBoardCanvasProps = {
  size?: number;
  boardColor?: string;
  lineColor?: string;
  fontFamily?: string;
  fontSizeRatio?: number;
  pieces: Piece[][];
  isSente?: boolean;
  currentMove?: IMoveMoveFormat;
};

/**
 * Props for ShogiHandsCanvas component
 * @property size - Canvas size in CSS pixels (default: 360)
 * @property boardColor - Background color (default: '#f9d27a')
 * @property lineColor - Color of frame lines (default: '#000')
 * @property fontFamily - Font family for piece names (default: 'serif')
 * @property fontSizeRatio - Font size ratio relative to cell size (default: 0.7)
 * @property hands - 2D array of captured pieces
 * @property isSente - Whether to display from black player's perspective (default: true)
 * @property isTop - Whether this is the top hands area (default: false)
 */
export type ShogiHandsCanvasProps = {
  size?: number;
  boardColor?: string;
  lineColor?: string;
  fontFamily?: string;
  fontSizeRatio?: number;
  hands: Piece[][];
  isSente?: boolean;
  isTop?: boolean;
};

/**
 * Canvas rendering dimensions including device pixel ratio
 * @property width - Actual canvas width in device pixels
 * @property height - Actual canvas height in device pixels
 * @property dpr - Device pixel ratio for HiDPI displays
 */
export type CanvasDimensions = {
  width: number;
  height: number;
  dpr: number;
};

/**
 * Layout information for the shogi board
 * @property margin - Margin from canvas edge
 * @property boardSize - Total size of the 9x9 board area
 * @property cell - Size of a single cell in the board
 */
export type BoardLayout = {
  margin: number;
  boardSize: number;
  cell: number;
};

/**
 * Layout information for the hands (captured pieces) area
 * @property margin - Margin from canvas edge
 * @property handsHeight - Total height of the hands canvas
 * @property boardSize - Width of the hands area (same as board width)
 * @property cellSize - Size of a single cell in the hands area
 */
export type HandsLayout = {
  margin: number;
  handsHeight: number;
  boardSize: number;
  cellSize: number;
};
