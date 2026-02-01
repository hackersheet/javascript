'use client';

/**
 * Mermaid diagram rendering functions.
 * Handles rendering with beautiful-mermaid library.
 * @module
 */

import { hasValidSvgDimensions, normalizeCode } from './mermaid-utils';

/**
 * Result type for mermaid rendering operations.
 */
export type MermaidRenderResult = { success: true; svg: string } | { success: false; error: string };

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
