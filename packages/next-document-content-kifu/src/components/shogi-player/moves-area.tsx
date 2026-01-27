'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Props for the MovesArea component
 * @property readableMoves - Array of human-readable move strings (e.g., "☗７六歩")
 * @property tesuu - Current move number
 * @property onTesuuChange - Callback when the user selects a different move
 */
export type MovesAreaProps = {
  readableMoves: string[];
  tesuu: number;
  onTesuuChange?: (tesuu: number) => void;
};

/**
 * Scrollable list of moves showing the game record with current position highlighting
 *
 * @component
 * @param props - Component props
 * @returns A scrollable moves list with keyboard navigation support
 *
 * @example
 * ```tsx
 * <MovesArea
 *   readableMoves={['開始局面', '☗７六歩', '☖３四歩']}
 *   tesuu={1}
 *   onTesuuChange={(move) => setCurrentMove(move)}
 * />
 * ```
 */
export default function MovesArea(props: MovesAreaProps) {
  const scrollRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll to keep the current move visible in the viewport
   */
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

  const initialCurrent = 0 === props.tesuu ? ' bg-amber-600' : '';

  return (
    <div className="absolute overflow-y-auto h-full w-full border-2 border-black text-black" ref={containerRef}>
      <div className="grid gap-0 text-xs">
        <div
          onClick={() => props.onTesuuChange && props.onTesuuChange(0)}
          className={
            'col-span-500 grid grid-cols-subgrid gap-2 py-1 px-2 cursor-pointer hover:bg-amber-100' + initialCurrent
          }
        >
          <div>{0 === props.tesuu && <span ref={scrollRef} className="sr-only" aria-hidden="true" />}</div>
          <div>{props.readableMoves[0]}</div>
        </div>
        {props.readableMoves.slice(1).map((moveText, index) => {
          const moveIndex = index + 1;
          const moveCurrent = moveIndex === props.tesuu ? ' bg-amber-600' : '';

          return (
            <div
              key={moveIndex}
              className={
                'col-span-500 grid grid-cols-subgrid border-black gap-2 border-t py-1 px-2 cursor-pointer hover:bg-amber-100' +
                moveCurrent
              }
              onClick={() => props.onTesuuChange && props.onTesuuChange(moveIndex)}
            >
              <div className="flex">
                {moveIndex === props.tesuu && <span ref={scrollRef} className="sr-only" aria-hidden="true" />}
                <div className="tabular-nums text-right flex-auto">{moveIndex}</div>
              </div>
              <div>{moveText}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
