'use client';

import { KifuComponentProps } from '@hackersheet/react-document-content';
import { useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';

import { ShogiPlayer } from '../shogi-player';

export default function Kifu({ code, language }: KifuComponentProps) {
  const [, filename] = language.split(':');

  const searchParams = useSearchParams();
  const id = filename ? `user-content-${filename}` : undefined;

  useEffect(() => {
    const newPly = Number(searchParams.get('ply') ?? 0);
    const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#!?/, '') : '';
    if (hash === id) {
      console.log(newPly);
    }
  }, [searchParams, id]);

  return (
    <div className="kifu-block" id={id}>
      <ShogiPlayer kifuText={code} />
    </div>
  );
}
