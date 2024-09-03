import React from 'react';
import { LuFolder, LuFile, LuFolderTree } from 'react-icons/lu';

import CodeBlockCopyButton from './code-block-copy-button';

import type { DirectoryTreeComponentProps } from '@hackersheet/react-document-content';

export default async function DirectoryTree({ code, ...props }: DirectoryTreeComponentProps) {
  const [, filename] = props.language.split(':');
  const treeNode = parseTreeOutput(code);

  const renderTree = (node: TreeNode): React.ReactNode => {
    return (
      <li className={`${node.type === 'directory' ? 'directory-tree-directory' : 'directory-tree-file'}`}>
        <div className="directory-tree-node-content">
          <div className="directory-tree-icon">
            {node.type === 'directory' && <LuFolder />}
            {node.type === 'file' && <LuFile />}
          </div>
          <div>{node.name}</div>
        </div>

        {node.children && <ul>{node.children.map((child) => renderTree(child))}</ul>}
      </li>
    );
  };

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
      <div>{treeNode ? <ul className="directory-tree">{renderTree(treeNode)}</ul> : <pre>{code}</pre>}</div>
    </div>
  );
}

type TreeNode = {
  name: string;
  type: 'file' | 'directory';
  extension?: string;
  level: number;
  children?: TreeNode[];
};

function parseTreeOutput(treeOutput: string): TreeNode | null {
  const lines = treeOutput.trim().split('\n');
  const rootNode: TreeNode = {
    name: '',
    type: 'directory',
    level: 0,
    children: [],
  };
  const stack: { node: TreeNode; level: number }[] = [{ node: rootNode, level: 0 }];
  let rootNodeSet = false;

  const getExtension = (filename: string): string | undefined => filename.match(/\.(\w+)$/)?.[1];

  const cleanNodeName = (name: string): string => name.replace(/^[\s│├└─]+/, '').trim();

  try {
    lines.forEach((line) => {
      const trimmedLine = line.trimStart();
      const indent = (trimmedLine.match(/^[\s│├└─]+/) || [''])[0];
      const level = indent.length / 4;

      const cleanedLine = cleanNodeName(trimmedLine);

      if (level === 0 && !rootNodeSet) {
        rootNode.name = cleanedLine;
        rootNodeSet = true;
        return;
      }

      const isDirectory = !cleanedLine.includes('.');
      const newNode: TreeNode = {
        name: cleanedLine,
        type: isDirectory ? 'directory' : 'file',
        extension: isDirectory ? undefined : getExtension(cleanedLine),
        level,
        children: isDirectory ? [] : undefined,
      };

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack[stack.length - 1] === undefined) {
        throw new Error('Tree parsing failed');
      }

      const parentNode = stack[stack.length - 1].node;
      parentNode.children = parentNode.children || [];
      parentNode.children.push(newNode);

      if (newNode.type === 'directory') {
        stack.push({ node: newNode, level });
      }
    });

    return rootNode;
  } catch (e) {
    return null;
  }
}
