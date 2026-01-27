'use client';

import React, { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';

import { createKifuAdapter } from './adapters/kifu-adapter';
import Button from './button';
import MovesArea from './moves-area';
import ShogiBoardCanvas from './shogi-board-canvas';
import ShogiHandsCanvas from './shogi-hands-canvas';

import type { GameState, KifuAdapterFactory } from './types';

/**
 * Props for the ShogiPlayer component
 * @property kifuText - KIF format kifu (game record) text
 * @property size - Canvas size in CSS pixels (default: 360)
 * @property tesuu - Initial move number to display
 * @property adapterFactory - Factory function for creating KifuAdapter (for DI/testing)
 */
export type ShogiPlayerProps = {
  kifuText: string;
  size?: number;
  tesuu?: number;
  adapterFactory?: KifuAdapterFactory;
};

/**
 * Shogi game viewer component with board, hands, and move navigation
 *
 * @component
 * @param props - Component props
 * @returns Interactive shogi player with keyboard and button navigation
 *
 * @example
 * ```tsx
 * <ShogiPlayer kifuText={kifString} tesuu={10} />
 * ```
 */
export default function ShogiPlayer(props: ShogiPlayerProps) {
  const factory = props.adapterFactory ?? createKifuAdapter;
  const adapterRef = useRef(factory(props.kifuText));
  const [gameState, setGameState] = useState<GameState>(() => adapterRef.current.getState());
  const [isSente, setIsSente] = useState(true);

  const size = props.size ?? 360;

  const handleForward = useCallback(() => {
    const newState = adapterRef.current.forward();
    setGameState(newState);
  }, []);

  const handleBackward = useCallback(() => {
    const newState = adapterRef.current.backward();
    setGameState(newState);
  }, []);

  const handleGoto = useCallback((tesuu: number) => {
    const newState = adapterRef.current.goto(tesuu);
    setGameState(newState);
  }, []);

  const handleToggle = useCallback(() => {
    setIsSente((prev) => !prev);
  }, []);

  /**
   * Handle keyboard input for board navigation and actions
   */
  const handleKeydown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      switch (event.key) {
        case 'Up':
        case 'ArrowUp':
          handleGoto(0);
          break;
        case 'Down':
        case 'ArrowDown':
          handleGoto(gameState.maxMoveIndex);
          break;
        case 'Left':
        case 'ArrowLeft':
          handleBackward();
          break;
        case ' ':
        case 'Right':
        case 'ArrowRight':
          handleForward();
          break;
        case 'r':
          handleToggle();
          break;
      }
    },
    [gameState.maxMoveIndex, handleGoto, handleBackward, handleForward, handleToggle]
  );

  /**
   * Initialize move position based on the initial tesuu prop
   */
  useEffect(() => {
    if (props.tesuu !== undefined) {
      handleGoto(props.tesuu);
    }
  }, [props.tesuu, handleGoto]);

  /**
   * Cleanup adapter on unmount
   */
  useEffect(() => {
    return () => {
      adapterRef.current.dispose();
    };
  }, []);

  const topPlayerName = isSente ? `☖ ${gameState.header.goteName}` : `☗ ${gameState.header.senteName}`;
  const bottomPlayerName = isSente ? `☗ ${gameState.header.senteName}` : `☖ ${gameState.header.goteName}`;

  return (
    <div
      className="flex flex-col sm:flex-row w-fit"
      tabIndex={0}
      role="application"
      aria-label="Shogi player - use arrow keys to navigate, space or right arrow to move forward, left arrow to move backward, 'r' to flip board"
      onKeyDown={handleKeydown}
    >
      <div className="flex flex-col">
        <div className="bg-[#f9d27a] text-black text-xs text-right p-1">{topPlayerName}</div>
        <ShogiHandsCanvas size={size} hands={gameState.hands} isSente={isSente} isTop={true} />
        <ShogiBoardCanvas size={size} pieces={gameState.board} isSente={isSente} currentMove={gameState.currentMove} />
        <ShogiHandsCanvas size={size} hands={gameState.hands} isSente={isSente} isTop={false} />
        <div className="bg-[#f9d27a] text-black text-xs p-1">{bottomPlayerName}</div>
      </div>
      <div className="flex flex-col sm:w-fit bg-[#f9d27a] p-4 gap-4">
        <div className="hidden sm:block flex-1 relative w-full">
          <MovesArea
            readableMoves={gameState.readableMoves}
            tesuu={gameState.currentMoveIndex}
            onTesuuChange={handleGoto}
          />
        </div>
        <div className="hidden sm:block text-black border-black border-2 p-1 text-xs max-h-40 w-0 min-w-full overflow-auto">
          {gameState.comments.map((comment, index) => (
            <div key={index}>{comment}</div>
          ))}
          {gameState.comments.length === 0 && gameState.currentMoveIndex !== 0 && <div>&nbsp;</div>}
          {gameState.currentMoveIndex === 0 &&
            Object.entries(gameState.header).map(([key, value], i) => (
              <div key={i} className="whitespace-nowrap">
                {key}: {value}
              </div>
            ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleGoto(0)}>最初</Button>
          <Button onClick={handleBackward}>前</Button>
          <Button onClick={handleForward}>次</Button>
          <Button onClick={() => handleGoto(gameState.maxMoveIndex)}>最後</Button>
          <Button onClick={handleToggle}>反転</Button>
        </div>
      </div>
    </div>
  );
}
