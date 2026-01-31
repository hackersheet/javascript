'use client';

import React, { useState } from 'react';
import { HiOutlineClipboardDocumentList, HiCheck } from 'react-icons/hi2';

/**
 * Props for the CodeBlockCopyButton component.
 */
export type CodeBlockCopyButtonProps = {
  /**
   * The code string to copy (may contain Shiki annotations).
   */
  code: string;
};

/**
 * Removes Shiki annotation lines (e.g., `// ...[!code ...]`) from code
 * and trims leading/trailing whitespace.
 *
 * @param code - The original code string, which may contain multiple lines.
 * @returns The code string with annotation lines removed and trimmed.
 *
 * @remarks
 * Annotations are matched by the regex `/ *\/\/.*\[!code[^\]]+\]/gm`.
 */
const removeShikiCode = (code: string) => code.replace(/ *\/\/.*\[!code[^\]]+\]/gm, '').trim();

/**
 * A copy-to-clipboard button component for code blocks.
 *
 * Copies the provided code to the clipboard when clicked, temporarily
 * switching the icon to a checkmark to indicate success.
 *
 * @param props - The component props
 * @param props.code - The code string to copy (Shiki annotations will be removed)
 * @returns The rendered copy button element
 *
 * @remarks
 * Uses the browser's `navigator.clipboard` API. Some environments may require
 * HTTPS or user permissions.
 */
export default function CodeBlockCopyButton({ code }: CodeBlockCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  /**
   * Click handler that copies the code to clipboard.
   * Removes Shiki annotations before copying and briefly shows
   * a success indicator.
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
