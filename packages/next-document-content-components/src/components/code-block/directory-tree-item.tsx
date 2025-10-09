import React from 'react';
import { LuFolder, LuFile } from 'react-icons/lu';

import type { TreeNode } from './parse-tree-output';

type DirectoryTreeItemProps = {
  node: TreeNode;
};

/**
 * 単一のツリーノード（ディレクトリまたはファイル）をレンダリングするコンポーネント。
 * 再帰的に自身を呼び出して子ノードを描画します。
 *
 * @param props.node - 表示対象の TreeNode
 */
export default function DirectoryTreeItem({ node }: DirectoryTreeItemProps) {
  return (
    <li key={node.id} className={`${node.type === 'directory' ? 'directory-tree-directory' : 'directory-tree-file'}`}>
      <div className="directory-tree-node-content">
        <div className="directory-tree-icon">
          {node.type === 'directory' && <LuFolder />}
          {node.type === 'file' && <LuFile />}
        </div>
        <div>{node.name}</div>
      </div>

      {node.children && (
        <ul>
          {node.children.map((child) => (
            <DirectoryTreeItem key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
