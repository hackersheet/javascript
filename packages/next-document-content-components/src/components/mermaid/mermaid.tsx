'use client';

import { renderMermaid as renderBeautifulMermaid, THEMES } from 'beautiful-mermaid';
import mermaid from 'mermaid';
import { useTheme } from 'next-themes';
import React, { useEffect, useId, useRef, useState } from 'react';

import type { MermaidComponentProps } from '@hackersheet/react-document-content';

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
 * Check if an SVG string has valid dimensions.
 * beautiful-mermaid returns invalid SVGs with negative/infinite dimensions for unsupported diagrams.
 */
function hasValidSvgDimensions(svg: string): boolean {
  const widthMatch = svg.match(/width="([^"]+)"/);
  const heightMatch = svg.match(/height="([^"]+)"/);
  if (!widthMatch || !heightMatch) return false;
  const width = parseFloat(widthMatch[1]);
  const height = parseFloat(heightMatch[1]);
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
}

/**
 * Run a function with a patched JSON.stringify that handles circular references.
 * This is needed because mermaid's block-beta renderer tries to stringify DOM elements.
 */
async function withSafeJsonStringify<T>(fn: () => Promise<T>): Promise<T> {
  const originalStringify = JSON.stringify;
  JSON.stringify = function (value, replacer, space) {
    const seen = new WeakSet();
    const safeReplacer = (_key: string, val: unknown) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return undefined;
        seen.add(val);
      }
      return val;
    };
    return originalStringify(value, safeReplacer, space);
  };
  try {
    return await fn();
  } finally {
    JSON.stringify = originalStringify;
  }
}

/**
 * Mermaid diagram component that renders diagrams using beautiful-mermaid.
 * Falls back to the original mermaid library if beautiful-mermaid fails.
 * Automatically switches between light and dark themes based on the current theme.
 */
export default function Mermaid({ code }: MermaidComponentProps) {
  const [mounted, setMounted] = useState(false);
  const [svg, setSvg] = useState('');
  const { theme, systemTheme } = useTheme();
  const renderCountRef = useRef(0);
  const id = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const render = async () => {
      const currentTheme = theme === 'system' ? systemTheme : theme;
      const isDark = currentTheme === 'dark';

      // Try beautiful-mermaid first
      try {
        const colors = isDark ? THEMES['github-dark'] : THEMES['github-light'];
        const normalizedCode = normalizeCode(code);
        const result = await renderBeautifulMermaid(normalizedCode, {
          ...colors,
          transparent: true,
        });
        if (result && hasValidSvgDimensions(result)) {
          setSvg(result);
          return;
        }
      } catch {
        // Fall through to mermaid fallback
      }

      // Fallback to original mermaid library
      const mermaidTheme = isDark ? 'dark' : 'default';
      mermaid.initialize({ startOnLoad: false, theme: mermaidTheme });
      try {
        const uniqueId = `${id}-${++renderCountRef.current}`;
        // Wrap in withSafeJsonStringify to handle circular references in block-beta etc.
        const { svg: renderedSvg } = await withSafeJsonStringify(() => mermaid.render(uniqueId, code));
        setSvg(renderedSvg);
      } catch {
        setSvg('Mermaid Syntax Error');
      }
    };
    render();
  }, [mounted, code, id, theme, systemTheme]);

  if (!mounted) {
    return (
      <div className="mermaid-block mermaid-loading">
        <div>Loading...</div>
      </div>
    );
  }

  return <div className="mermaid-block" dangerouslySetInnerHTML={{ __html: svg }} />;
}
