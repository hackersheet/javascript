'use client';

import { JKFPlayer } from 'json-kifu-format';
import { IMoveMoveFormat } from 'json-kifu-format/dist/src/Formats';
import React, { useEffect, useState } from 'react';

import Button from './button';
import { MovesArea } from './moves-area';
import ShogiBoardCanvas from './shogi-board-canvas';
import ShogiHandsCanvas from './shogi-hands-canvas';

export type ShogiPlayerProps = {
  kifuText: string;
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

  const size = 360;

  const updateState = () => {
    setPieces([...player.shogi.board]);
    setHands([...player.shogi.hands]);
    setMoves([...player.kifu.moves]);
    setCurrentMove(player.getMove());
    setMaxTesuu(player.getMaxTesuu());
    setComments(player.getComments());
    setTesuu(player.tesuu);
  };

  const handleForward = () => {
    player.forward();
    updateState();
  };

  const handleBackward = () => {
    player.backward();
    updateState();
  };

  const handleGoto = (tesuu: number) => {
    player.goto(tesuu);
    updateState();
  };

  const handeleToggle = () => {
    setIsSente(!isSente);
    updateState();
  };

  useEffect(() => {
    if (props.tesuu !== undefined) {
      handleGoto(props.tesuu);
    }
  }, [props.tesuu]);

  return (
    <div className="flex w-fit" tabIndex={1}>
      <div className="flex flex-col">
        <ShogiHandsCanvas size={size} hands={hands} isSente={isSente} isTop={true} />
        <ShogiBoardCanvas size={size} pieces={pieces} isSente={isSente} currentMove={currentMove} />
        <ShogiHandsCanvas size={size} hands={hands} isSente={isSente} isTop={false} />
      </div>
      <div className="flex flex-col w-fit bg-[#f9d27a] p-4 gap-4">
        <div className="flex-1 relative w-full">
          <MovesArea moves={moves} tesuu={tesuu} onTesuuChange={handleGoto} />
        </div>
        <div className="text-black border-black border-2 p-1 text-xs">
          {comments.map((comment, index) => (
            <div key={index}>{comment}</div>
          ))}
          {comments.length === 0 && <div>&nbsp;</div>}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleGoto(0)}>最初</Button>
          <Button onClick={handleBackward}>前</Button>
          <Button onClick={handleForward}>次</Button>
          <Button onClick={() => handleGoto(maxTesuu)}>最後</Button>
          <Button onClick={handeleToggle}>反転</Button>
        </div>
      </div>
    </div>
  );
}
