import React from 'react';
import { LuFolderTree } from 'react-icons/lu';

import CodeBlockCopyButton from './code-block-copy-button';
import DirectoryTreeItem from './directory-tree-item';
import parseTreeOutput from './parse-tree-output';

import type { DirectoryTreeComponentProps } from '@hackersheet/react-document-content';

/**
 * code ブロック内の `tree` コマンド出力をパースしてツリーをレンダリングするコンポーネント。
 * ヘッダにはツリーアイコン、ファイル名（language のコロン以降）、コピー用ボタンを表示します。
 *
 * @param props.code - `tree` コマンドの出力テキスト
 * @param props.language - 言語／ファイル名情報（形式: "xxx:filename"）
 */
export default async function DirectoryTree({ code, ...props }: DirectoryTreeComponentProps) {
  const [, filename] = props.language.split(':');
  const treeNode = parseTreeOutput(code);

  return (
    <div className="code-block">
      <div className="code-block-header">
        <div>
          <LuFolderTree />
        </div>
        <div className="code-block-filename">{filename}</div>
        <div>
          <CodeBlockCopyButton code={code} />
        </div>
      </div>
      <div>
        {treeNode ? (
          <ul className="directory-tree">
            <DirectoryTreeItem node={treeNode} />
          </ul>
        ) : (
          <pre>{code}</pre>
        )}
      </div>
    </div>
  );
}
