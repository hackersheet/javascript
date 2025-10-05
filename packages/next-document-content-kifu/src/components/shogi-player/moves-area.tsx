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
  const scrollRef = useRef<HTMLTableRowElement>(null);
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
      <table className="w-full text-xs" style={{ margin: 0 }}>
        <tbody>
          {0 === props.tesuu && <tr ref={scrollRef}></tr>}
          <tr
            onClick={() => props.onTesuuChange && props.onTesuuChange(0)}
            className={0 === props.tesuu ? 'bg-yellow-100 cursor-pointer' : 'cursor-pointer hover:bg-amber-300'}
          >
            <th className="text-right p-1 pl-0"></th>
            <td className="p-1 pr-0">開始局面</td>
          </tr>
          {moves.map(
            (move, index) =>
              index > 0 && (
                <Fragment key={index}>
                  {index === props.tesuu && <tr ref={scrollRef}></tr>}
                  <tr
                    className={
                      index === props.tesuu
                        ? 'bg-yellow-100 border-t border-black/60 cursor-pointer'
                        : 'border-t border-black/60 cursor-pointer hover:bg-amber-300'
                    }
                    onClick={() => props.onTesuuChange && props.onTesuuChange(index)}
                  >
                    <th className="text-right p-1 pl-2 w-0" style={{ width: 0 }}>
                      <div>{index}</div>
                    </th>
                    <td className="p-1 pr-0">{JKFPlayer.moveToReadableKifu(move)}</td>
                  </tr>
                </Fragment>
              )
          )}
        </tbody>
      </table>
    </div>
  );
}
