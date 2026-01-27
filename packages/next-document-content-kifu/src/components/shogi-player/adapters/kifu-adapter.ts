import { JKFPlayer } from 'json-kifu-format';
import { IMoveFormat } from 'json-kifu-format/dist/src/Formats';

import type { GameState, KifuAdapter, Move } from '../types';

/**
 * Convert IMoveFormat from json-kifu-format to internal Move type
 * @param move - Move format from the library
 * @returns Internal Move representation or undefined
 */
function convertToMove(move: IMoveFormat | undefined): Move | undefined {
  if (!move?.move) {
    return undefined;
  }

  const m = move.move;
  return {
    from: m.from ? { x: m.from.x, y: m.from.y } : undefined,
    to: m.to ? { x: m.to.x, y: m.to.y } : undefined,
    color: m.color,
    piece: m.piece,
    same: m.same,
    promote: m.promote,
    capture: m.capture,
    relative: m.relative,
  };
}

/**
 * JKFPlayer wrapper adapter implementation
 * Wraps JKFPlayer internally and extracts GameState after each operation
 */
class JKFPlayerAdapter implements KifuAdapter {
  private player: JKFPlayer;
  private readableMoves: string[];

  constructor(kifuText: string) {
    this.player = JKFPlayer.parse(kifuText.trim());
    this.readableMoves = this.buildReadableMoves();
  }

  /**
   * Pre-compute readable move strings for all moves
   */
  private buildReadableMoves(): string[] {
    const moves = this.player.kifu.moves;
    return moves.map((move, index) => {
      if (index === 0) {
        return '開始局面';
      }
      return JKFPlayer.moveToReadableKifu(move);
    });
  }

  /**
   * Extract current game state from JKFPlayer
   */
  private extractState(): GameState {
    const header = this.player.kifu.header;

    return {
      board: [...this.player.shogi.board],
      hands: [...this.player.shogi.hands] as [(typeof this.player.shogi.hands)[0], (typeof this.player.shogi.hands)[1]],
      currentMoveIndex: this.player.tesuu,
      maxMoveIndex: this.player.getMaxTesuu(),
      currentMove: convertToMove(this.player.kifu.moves[this.player.tesuu]),
      header: {
        senteName: header['先手'] || header['下手'] || '',
        goteName: header['後手'] || header['上手'] || '',
        ...header,
      },
      comments: this.player.getComments(),
      readableMoves: this.readableMoves,
    };
  }

  forward(): GameState {
    this.player.forward();
    return this.extractState();
  }

  backward(): GameState {
    this.player.backward();
    return this.extractState();
  }

  goto(moveIndex: number): GameState {
    this.player.goto(moveIndex);
    return this.extractState();
  }

  getState(): GameState {
    return this.extractState();
  }

  dispose(): void {
    // JKFPlayer doesn't have explicit cleanup, but this method
    // is provided for future compatibility and interface compliance
  }
}

/**
 * Factory function to create a KifuAdapter from KIF text
 * @param kifuText - KIF format game record text
 * @returns KifuAdapter instance
 */
export function createKifuAdapter(kifuText: string): KifuAdapter {
  return new JKFPlayerAdapter(kifuText);
}
