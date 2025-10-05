'use client';

import { JKFPlayer } from 'json-kifu-format';
import { IMoveFormat } from 'json-kifu-format/dist/src/Formats';
import React, { Fragment, useEffect, useRef } from 'react';

export type MovesAreaProps = {
  moves: IMoveFormat[];
  tesuu: number;
  onTesuuChange?: (tesuu: number) => void;
};

export function MovesArea(props: MovesAreaProps) {
  const moves = props.moves;
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollRect = scrollRef.current.getBoundingClientRect();

      const offset = scrollRect.top - containerRect.top + containerRef.current.scrollTop - 72;

      containerRef.current.scrollTo({
        top: offset,
        behavior: 'auto',
      });
    }
  }, [props.tesuu]);

  return (
    <div className="absolute overflow-y-auto h-full w-full border-2 border-black text-black" ref={containerRef}>
      <div className="w-full text-xs">
        {0 === props.tesuu && <div ref={scrollRef}></div>}
        <div
          onClick={() => props.onTesuuChange && props.onTesuuChange(0)}
          className={
            0 === props.tesuu ? 'bg-yellow-100 cursor-pointer flex p-2' : 'cursor-pointer hover:bg-amber-300 flex p-2'
          }
        >
          <div>開始局面</div>
        </div>
        {moves.map(
          (move, index) =>
            index > 0 && (
              <Fragment key={index}>
                {index === props.tesuu && <div ref={scrollRef}></div>}
                <div
                  className={
                    index === props.tesuu
                      ? 'bg-yellow-100 border-t border-black/60 cursor-pointer flex gap-2 p-2'
                      : 'border-t border-black/60 cursor-pointer hover:bg-amber-300 flex gap-2 p-2'
                  }
                  onClick={() => props.onTesuuChange && props.onTesuuChange(index)}
                >
                  <div className="w-4 text-right">
                    <div>{index}</div>
                  </div>
                  <div>{JKFPlayer.moveToReadableKifu(move)}</div>
                </div>
              </Fragment>
            )
        )}
      </div>
    </div>
  );
}
