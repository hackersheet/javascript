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

  const current = 0 === props.tesuu ? ' bg-amber-600' : '';

  return (
    <div className="absolute overflow-y-auto h-full w-full border-2 border-black text-black" ref={containerRef}>
      <div className="grid gap-0 text-xs">
        <div
          onClick={() => props.onTesuuChange && props.onTesuuChange(0)}
          className={'col-span-500 grid grid-cols-subgrid gap-2 py-1 px-2 cursor-pointer hover:bg-amber-100' + current}
        >
          <div>{0 === props.tesuu && <div ref={scrollRef}></div>}</div>
          <div>開始局面</div>
        </div>
        {moves.map((move, index) => {
          if (index === 0) return;

          const current = index === props.tesuu ? ' bg-amber-600' : '';

          return (
            <Fragment key={index}>
              <div
                className={
                  'col-span-500 grid grid-cols-subgrid border-black gap-2 border-t py-1 px-2 cursor-pointer hover:bg-amber-100' +
                  current
                }
                onClick={() => props.onTesuuChange && props.onTesuuChange(index)}
              >
                <div className="flex">
                  {index === props.tesuu && <div ref={scrollRef}></div>}
                  <div className="tabular-nums text-right flex-auto">{index}</div>
                </div>
                <div>{JKFPlayer.moveToReadableKifu(move)}</div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
