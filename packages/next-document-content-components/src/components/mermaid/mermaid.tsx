'use client';

import { createHash } from 'crypto';

import { renderMermaid as renderBeautifulMermaid, THEMES } from 'beautiful-mermaid';
import mermaid from 'mermaid';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';

import type { MermaidComponentProps } from '@hackersheet/react-document-content';

/**
 * Create a unique ID for mermaid rendering based on code content.
 */
function createId(code: string) {
  const hash = createHash('sha256');
  hash.update(code);
  return 'id-' + hash.digest('hex');
}

/**
 * Normalize mermaid code for beautiful-mermaid compatibility.
 * - Removes trailing semicolons from each line
 * - Adds spaces around arrows (e.g., A-->B becomes A --> B)
 */
function normalizeCode(code: string): string {
  return code
    .split('\n')
    .map((line) =>
      line
        .replace(/;(\s*)$/, '$1')
        .replace(/(\w)-->/g, '$1 -->')
        .replace(/-->(\w)/g, '--> $1')
    )
    .join('\n');
}

/**
 * Mermaid diagram component that renders diagrams using beautiful-mermaid.
 * Falls back to the original mermaid library if beautiful-mermaid fails.
 * Automatically switches between light and dark themes based on the current theme.
 */
export default function Mermaid({ code }: MermaidComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [svg, setSvg] = useState('');
  const { theme, systemTheme } = useTheme();
  const id = createId(code);

  useEffect(() => {
    const render = async () => {
      if (!mounted) {
        setMounted(true);
      }
      const currentTheme = theme === 'system' ? systemTheme : theme;
      const isDark = currentTheme === 'dark';

      if (mounted && ref.current) {
        // Try beautiful-mermaid first
        try {
          const colors = isDark ? THEMES['github-dark'] : THEMES['github-light'];
          const normalizedCode = normalizeCode(code);
          const result = await renderBeautifulMermaid(normalizedCode, {
            ...colors,
            transparent: true,
          });
          setSvg(result);
          return;
        } catch {
          // Fall through to mermaid fallback
        }

        // Fallback to original mermaid library
        mermaid.initialize({ theme: currentTheme });
        try {
          const result = await mermaid.render(id, code, ref.current);
          setSvg(result.svg);
        } catch {
          setSvg('Mermaid Syntax Error');
        }
      }
    };
    render();
  }, [mounted, code, id, theme, systemTheme, setSvg, setMounted]);

  if (!mounted) {
    return (
      <div className="mermaid-block mermaid-loading">
        <div>Loading...</div>
      </div>
    );
  }

  return <div className="mermaid-block" dangerouslySetInnerHTML={{ __html: svg }} ref={ref} />;
}
