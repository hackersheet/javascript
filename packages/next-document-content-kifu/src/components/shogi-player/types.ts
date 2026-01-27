import { Piece } from 'shogi.js';

/**
 * Library-independent move representation
 * @property from - Source position (optional for drops)
 * @property to - Destination position
 * @property color - Player color (0: sente/black, 1: gote/white)
 * @property piece - Piece type being moved
 * @property same - Whether the destination is the same as the previous move
 * @property promote - Whether the piece promotes
 * @property capture - Captured piece type (if any)
 * @property relative - Relative movement direction (for disambiguation)
 */
export interface Move {
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  color?: number;
  piece?: string;
  same?: boolean;
  promote?: boolean;
  capture?: string;
  relative?: string;
}

/**
 * Complete game state representation independent of external libraries
 * @property board - 9x9 board with pieces (or null for empty squares)
 * @property hands - Captured pieces for each player [sente, gote]
 * @property currentMoveIndex - Current position in the move sequence
 * @property maxMoveIndex - Total number of moves in the game
 * @property currentMove - The move at the current position
 * @property header - Game metadata (player names, date, etc.)
 * @property comments - Comments for the current position
 * @property readableMoves - Human-readable move strings (e.g., "☗７六歩")
 */
export interface GameState {
  board: (Piece | null)[][];
  hands: [Piece[], Piece[]];
  currentMoveIndex: number;
  maxMoveIndex: number;
  currentMove?: Move;
  header: { senteName: string; goteName: string; [key: string]: string };
  comments: string[];
  readableMoves: string[];
}

/**
 * Adapter interface for kifu parsing libraries
 * Wraps the underlying library and provides a clean interface for game navigation
 */
export interface KifuAdapter {
  /**
   * Move forward one step in the game
   * @returns Updated game state after the move
   */
  forward(): GameState;

  /**
   * Move backward one step in the game
   * @returns Updated game state after the move
   */
  backward(): GameState;

  /**
   * Jump to a specific move index
   * @param moveIndex - Target move index (0 = initial position)
   * @returns Updated game state after navigation
   */
  goto(moveIndex: number): GameState;

  /**
   * Get the current game state without navigation
   * @returns Current game state
   */
  getState(): GameState;

  /**
   * Clean up resources held by the adapter
   */
  dispose(): void;
}

/**
 * Factory function type for creating KifuAdapter instances
 * Used for dependency injection in tests
 */
export type KifuAdapterFactory = (kifuText: string) => KifuAdapter;

/**
 * Props for ShogiBoardCanvas component
 * @property size - Canvas size in CSS pixels (default: 360)
 * @property boardColor - Background color of the board (default: '#f9d27a')
 * @property lineColor - Color of board lines (default: '#000')
 * @property fontFamily - Font family for coordinates and pieces (default: 'serif')
 * @property fontSizeRatio - Font size ratio relative to cell size (default: 0.7)
 * @property pieces - 2D array of pieces on the board (null for empty squares)
 * @property isSente - Whether to display from black player's perspective (default: true)
 * @property currentMove - Current move to highlight on the board
 */
export type ShogiBoardCanvasProps = {
  size?: number;
  boardColor?: string;
  lineColor?: string;
  fontFamily?: string;
  fontSizeRatio?: number;
  pieces: (Piece | null)[][];
  isSente?: boolean;
  currentMove?: Move;
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
