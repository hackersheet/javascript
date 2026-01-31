import React from 'react';
import { LuFolder, LuFile } from 'react-icons/lu';

import type { TreeNode } from './parse-tree-output';

/**
 * Props for the DirectoryTreeItem component.
 */
export type DirectoryTreeItemProps = {
  /**
   * The tree node to render (directory or file).
   */
  node: TreeNode;
};

/**
 * A component that renders a single tree node (directory or file).
 * Recursively renders child nodes for directories.
 *
 * @param props - The component props
 * @param props.node - The TreeNode to display
 * @returns The rendered list item element
 */
export default function DirectoryTreeItem({ node }: DirectoryTreeItemProps) {
  return (
    <li className={`${node.type === 'directory' ? 'directory-tree-directory' : 'directory-tree-file'}`}>
      <div className="directory-tree-node-content">
        <div className="directory-tree-icon">{node.type === 'directory' ? <LuFolder /> : <LuFile />}</div>
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
