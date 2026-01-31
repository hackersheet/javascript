import React from 'react';
import { LuFolderTree } from 'react-icons/lu';

import CodeBlockHeader from './code-block-header';
import DirectoryTreeItem from './directory-tree-item';
import parseTreeOutput from './parse-tree-output';

import type { DirectoryTreeComponentProps } from '@hackersheet/react-document-content';

/**
 * A component that parses `tree` command output from a code block and renders
 * it as an interactive directory tree.
 *
 * The header displays a tree icon, filename (extracted from the colon-delimited
 * language string), and a copy button.
 *
 * @param props - The component props
 * @param props.code - The `tree` command output text
 * @param props.language - Language/filename info in the format "xxx:filename"
 * @returns The rendered directory tree element
 */
export default function DirectoryTree({ code, ...props }: DirectoryTreeComponentProps) {
  const [, filename] = props.language.split(':');
  const treeNode = parseTreeOutput(code);

  return (
    <div className="code-block">
      <CodeBlockHeader icon={<LuFolderTree />} filename={filename} code={code} />
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
