'use client';

import { KifuComponentProps } from '@hackersheet/react-document-content';
import { KifuLite, KifuStore } from 'kifu-for-js';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function Kifu({ code, language }: KifuComponentProps) {
  const [, filename] = language.split(':');

  const searchParams = useSearchParams();
  const id = filename ? `user-content-${filename}` : undefined;
  const [kifuStore] = useState(() => new KifuStore({ kifu: code }));

  useEffect(() => {
    initKifuUserSettings();
  }, []);

  useEffect(() => {
    const newPly = Number(searchParams.get('ply') ?? 0);
    const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#!?/, '') : '';
    if (hash === id) {
      kifuStore.player.goto(newPly);
    }
  }, [searchParams, kifuStore, id]);

  if (!kifuStore) {
    return null;
  }

  return (
    <div className="kifu-block" id={id}>
      <KifuLite style={{ width: '100%' }} kifuStore={kifuStore} />
    </div>
  );
}

/**
 * 棋譜プレーヤーのhapticFeedbackをオフにする
 */
function initKifuUserSettings() {
  const LOCALSTORAGE_KEY = 'kifuforjs';
  const defaultSettings = {
    hapticFeedback: false,
  };

  const settings = localStorage.getItem(LOCALSTORAGE_KEY);

  if (!settings) {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(defaultSettings));
  }
}
