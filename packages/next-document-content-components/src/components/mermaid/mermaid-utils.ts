/**
 * Utility functions for Mermaid diagram processing.
 * These are pure functions that can be easily unit tested.
 * @module
 */

/** Hoisted regex patterns to avoid recreation on each function call. */
const TRAILING_SEMICOLON_REGEX = /;(\s*)$/;
const ARROW_LEFT_REGEX = /(\w)-->/g;
const ARROW_RIGHT_REGEX = /-->(\w)/g;
const WIDTH_REGEX = /width="([^"]+)"/;
const HEIGHT_REGEX = /height="([^"]+)"/;

/**
 * Normalize mermaid code for beautiful-mermaid compatibility.
 * - Removes trailing semicolons from each line
 * - Adds spaces around arrows (e.g., A-->B becomes A --> B)
 *
 * @param code - Raw mermaid diagram code
 * @returns Normalized code string
 *
 * @example
 * ```ts
 * normalizeCode('A-->B;') // returns 'A --> B'
 * ```
 */
export function normalizeCode(code: string): string {
  return code
    .split('\n')
    .map((line) =>
      line
        .replace(TRAILING_SEMICOLON_REGEX, '$1')
        .replace(ARROW_LEFT_REGEX, '$1 -->')
        .replace(ARROW_RIGHT_REGEX, '--> $1')
    )
    .join('\n');
}

/**
 * Check if an SVG string has valid dimensions.
 * beautiful-mermaid returns invalid SVGs with negative/infinite dimensions for unsupported diagrams.
 *
 * @param svg - SVG string to validate
 * @returns true if SVG has valid positive finite dimensions
 *
 * @example
 * ```ts
 * hasValidSvgDimensions('<svg width="100" height="50">...</svg>') // returns true
 * hasValidSvgDimensions('<svg width="-1" height="Infinity">...</svg>') // returns false
 * ```
 */
export function hasValidSvgDimensions(svg: string): boolean {
  const widthMatch = svg.match(WIDTH_REGEX);
  const heightMatch = svg.match(HEIGHT_REGEX);
  if (!widthMatch || !heightMatch) return false;
  const width = parseFloat(widthMatch[1]);
  const height = parseFloat(heightMatch[1]);
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
}

/**
 * Extract error message from an unknown error value.
 *
 * @param error - Unknown error value (Error object, string, or other)
 * @returns Error message string
 *
 * @example
 * ```ts
 * getErrorMessage(new Error('Parse error')) // returns 'Parse error'
 * getErrorMessage('Something went wrong') // returns 'Something went wrong'
 * getErrorMessage(null) // returns 'Unknown error'
 * ```
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}
