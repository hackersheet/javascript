'use client';

import React from 'react';

import CodeBlockCopyButton from './code-block-copy-button';

import type { ReactNode } from 'react';

/**
 * Props for the CodeBlockHeader component.
 */
export type CodeBlockHeaderProps = {
  /** Icon element to display on the left side of the header. */
  icon: ReactNode;

  /** Optional filename to display in the center of the header. */
  filename?: string;

  /** Code string to be copied when the copy button is clicked. */
  code: string;

  /** Optional additional actions to display before the copy button. */
  actions?: ReactNode;
};

/**
 * A shared header component for code blocks and directory trees.
 *
 * Displays an icon, an optional filename, and a copy-to-clipboard button
 * in a consistent layout used across different code block variants.
 *
 * @param props - The component props
 * @param props.icon - Icon element to display on the left
 * @param props.filename - Optional filename to display in the center
 * @param props.code - Code string for the copy button
 * @param props.actions - Optional additional actions to display before copy button
 * @returns The rendered header element
 */
export default function CodeBlockHeader({ icon, filename, code, actions }: CodeBlockHeaderProps) {
  return (
    <div className="code-block-header">
      <div>{icon}</div>
      <div className="code-block-filename">{filename}</div>
      {actions && <div className="code-block-actions">{actions}</div>}
      <div>
        <CodeBlockCopyButton code={code} />
      </div>
    </div>
  );
}
