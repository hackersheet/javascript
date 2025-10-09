'use client';

import React, { useState } from 'react';
import { HiOutlineClipboardDocumentList, HiCheck } from 'react-icons/hi2';

export type CodeBlockCopyButtonProps = {
  code: string;
};

/**
 * Shiki の注釈付きコード行（例: // ...[!code ...]）を除去して、先頭末尾の空白を削除した文字列を返します。
 *
 * @param code 元のコード文字列。複数行を含むことができます。
 * @returns 注釈行を削除しトリムしたコード文字列。
 *
 * @remarks
 * 対象の注釈は正規表現 / *\/\/.*\[!code[^\]]+\]/gm にマッチする行として扱われます。
 */
const removeShikiCode = (code: string) => code.replace(/ *\/\/.*\[!code[^\]]+\]/gm, '').trim();

/**
 * コードブロック用のコピー ボタンコンポーネント。
 *
 * 与えられた code をクリップボードに書き込み、コピー完了時にアイコンをチェックに切り替えます。
 *
 * @param props.code コピー対象のコード文字列（Shiki 注釈が含まれている可能性あり）。
 * @returns コピー用ボタンの React 要素。
 *
 * @remarks
 * ブラウザの navigator.clipboard を使用します。ユーザーの環境によっては権限や HTTPS が必要です。
 */
export default function CodeBlockCopyButton({ code }: CodeBlockCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  /**
   * ボタンがクリックされたときに呼ばれるハンドラ。
   * removeShikiCode で注釈を除去したコードをクリップボードに書き込み、
   * 書き込み成功時に短時間だけ copied 状態を true にします。
   */
  const handleClick = () => {
    navigator.clipboard.writeText(removeShikiCode(code)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  };

  return (
    <button onClick={handleClick} aria-label="Copy code to clipboard">
      {copied ? <HiCheck size={18} /> : <HiOutlineClipboardDocumentList size={18} />}
    </button>
  );
}
