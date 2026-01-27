'use client';

import { JKFPlayer } from 'json-kifu-format';
import { IMoveMoveFormat } from 'json-kifu-format/dist/src/Formats';
import React, { KeyboardEvent, useCallback, useEffect, useState } from 'react';

import Button from './button';
import MovesArea from './moves-area';
import ShogiBoardCanvas from './shogi-board-canvas';
import ShogiHandsCanvas from './shogi-hands-canvas';

/**
 * Props for the ShogiPlayer component
 * @property kifuText - KIF format kifu (game record) text
 * @property size - Canvas size in CSS pixels (default: 360)
 * @property tesuu - Initial move number to display
 */
export type ShogiPlayerProps = {
  kifuText: string;
  size?: number;
  tesuu?: number;
};

export default function ShogiPlayer(props: ShogiPlayerProps) {
  const [player] = useState(JKFPlayer.parse(props.kifuText.trim()));
  const [pieces, setPieces] = useState(player.shogi.board);
  const [hands, setHands] = useState(player.shogi.hands);
  const [moves, setMoves] = useState(player.kifu.moves);
  const [tesuu, setTesuu] = useState(player.tesuu);
  const [currentMove, setCurrentMove] = useState<IMoveMoveFormat | undefined>(player.getMove());
  const [isSente, setIsSente] = useState(true);
  const [maxTesuu, setMaxTesuu] = useState(player.getMaxTesuu());
  const [comments, setComments] = useState(player.getComments());

  const size = props.size ? props.size : 360;

  /**
   * Update all state variables from the current player state
   */
  const updateState = useCallback(() => {
    setPieces([...player.shogi.board]);
    setHands([...player.shogi.hands]);
    setMoves([...player.kifu.moves]);
    setCurrentMove(player.getMove());
    setMaxTesuu(player.getMaxTesuu());
    setComments(player.getComments());
    setTesuu(player.tesuu);
  }, [player]);

  const handleForward = useCallback(() => {
    player.forward();
    updateState();
  }, [updateState]);

  const handleBackward = useCallback(() => {
    player.backward();
    updateState();
  }, [updateState]);

  const handleGoto = useCallback(
    (tesuu: number) => {
      player.goto(tesuu);
      updateState();
    },
    [updateState]
  );

  const handleToggle = useCallback(() => {
    setIsSente(!isSente);
    updateState();
  }, [isSente, updateState]);

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
          handleGoto(maxTesuu);
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
    [maxTesuu, handleGoto, handleBackward, handleForward, handleToggle]
  );

  /**
   * Initialize move position based on the initial tesuu prop
   */
  useEffect(() => {
    if (props.tesuu !== undefined) {
      handleGoto(props.tesuu);
    }
  }, [props.tesuu, handleGoto]);

  return (
    <div
      className="flex flex-col sm:flex-row w-fit"
      tabIndex={0}
      role="application"
      aria-label="Shogi player - use arrow keys to navigate, space or right arrow to move forward, left arrow to move backward, 'r' to flip board"
      onKeyDown={handleKeydown}
    >
      <div className="flex flex-col">
        <div className="bg-[#f9d27a] text-black text-xs text-right p-1">
          {isSente ? '☖ ' + player.kifu.header['後手'] : '☗ ' + player.kifu.header['先手']}
        </div>
        <ShogiHandsCanvas size={size} hands={hands} isSente={isSente} isTop={true} />
        <ShogiBoardCanvas size={size} pieces={pieces} isSente={isSente} currentMove={currentMove} />
        <ShogiHandsCanvas size={size} hands={hands} isSente={isSente} isTop={false} />
        <div className="bg-[#f9d27a] text-black text-xs p-1">
          {isSente ? '☗ ' + player.kifu.header['先手'] : '☖ ' + player.kifu.header['後手']}
        </div>
      </div>
      <div className="flex flex-col sm:w-fit bg-[#f9d27a] p-4 gap-4">
        <div className="hidden sm:block flex-1 relative w-full">
          <MovesArea moves={moves} tesuu={tesuu} onTesuuChange={handleGoto} />
        </div>
        <div className="hidden sm:block text-black border-black border-2 p-1 text-xs max-h-40 w-0 min-w-full overflow-auto">
          {comments.map((comment, index) => (
            <div key={index}>{comment}</div>
          ))}
          {comments.length === 0 && tesuu !== 0 && <div>&nbsp;</div>}
          {tesuu === 0 &&
            Object.entries(player.kifu.header).map(([key, value], i) => (
              <div key={i} className="whitespace-nowrap">
                {key}: {value}
              </div>
            ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleGoto(0)}>最初</Button>
          <Button onClick={handleBackward}>前</Button>
          <Button onClick={handleForward}>次</Button>
          <Button onClick={() => handleGoto(maxTesuu)}>最後</Button>
          <Button onClick={handleToggle}>反転</Button>
        </div>
      </div>
    </div>
  );
}
