'use client';

/**
 * Mermaid diagram rendering functions.
 * Handles rendering with beautiful-mermaid and fallback to original mermaid library.
 * @module
 */

import { getErrorMessage, hasValidSvgDimensions, normalizeCode } from './mermaid-utils';

/**
 * Result type for mermaid rendering operations.
 */
export type MermaidRenderResult = { success: true; svg: string } | { success: false; error: string };

/**
 * Run a function with a patched JSON.stringify that handles circular references.
 * This is needed because mermaid's block-beta renderer tries to stringify DOM elements.
 *
 * @param fn - Async function to execute with safe JSON.stringify
 * @returns Result of the function
 * @internal
 */
export async function withSafeJsonStringify<T>(fn: () => Promise<T>): Promise<T> {
  const originalStringify = JSON.stringify;
  JSON.stringify = function (value, _replacer, space) {
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
 * Render diagram using beautiful-mermaid library.
 * Uses dynamic import to reduce initial bundle size.
 *
 * @param code - Mermaid diagram code
 * @param isDark - Whether to use dark theme
 * @returns SVG string if successful, null otherwise
 */
export async function renderWithBeautifulMermaid(code: string, isDark: boolean): Promise<string | null> {
  const { renderMermaid, THEMES } = await import('beautiful-mermaid');
  const colors = isDark ? THEMES['github-dark'] : THEMES['github-light'];
  const normalizedCode = normalizeCode(code);
  const result = await renderMermaid(normalizedCode, {
    ...colors,
    transparent: true,
  });
  if (result && hasValidSvgDimensions(result)) {
    return result;
  }
  return null;
}

/**
 * Render diagram using original mermaid library as fallback.
 * Uses dynamic import to reduce initial bundle size.
 *
 * @param code - Mermaid diagram code
 * @param isDark - Whether to use dark theme
 * @param uniqueId - Unique identifier for the mermaid render container
 * @returns Result object with success status and SVG or error message
 */
export async function renderWithMermaidFallback(
  code: string,
  isDark: boolean,
  uniqueId: string
): Promise<MermaidRenderResult> {
  const mermaid = (await import('mermaid')).default;
  const mermaidTheme = isDark ? 'dark' : 'default';
  mermaid.initialize({ startOnLoad: false, theme: mermaidTheme });
  try {
    const { svg } = await withSafeJsonStringify(() => mermaid.render(uniqueId, code));
    return { success: true, svg };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  } finally {
    document.getElementById(`d${uniqueId}`)?.remove();
  }
}
