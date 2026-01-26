'use client';

import { KifuComponentProps } from '@hackersheet/react-document-content';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import ShogiPlayer from '../shogi-player/shogi-player';

export default function Kifu({ code, language }: KifuComponentProps) {
  const [ply, setPly] = useState(0);
  const [, filename] = language.split(':');
  const searchParams = useSearchParams();
  const id = filename ? `user-content-${filename}` : undefined;

  useEffect(() => {
    const newPly = Number(searchParams.get('ply') ?? 0);
    const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#!?/, '') : '';
    if (hash === id) {
      setPly(newPly);
    }
  }, [searchParams, id]);

  return (
    <div className="kifu-block" id={id}>
      <ShogiPlayer kifuText={code} tesuu={ply} size={320} />
    </div>
  );
}
