import pc from 'picocolors';

/**
 * Flag to track if colors are disabled via --no-color option.
 * Set by the CLI entry point.
 */
let noColorFlag = false;

/**
 * Sets the no-color flag. Call this from CLI entry point.
 *
 * @param value - Whether to disable colors.
 */
export function setNoColor(value: boolean): void {
  noColorFlag = value;
}

/**
 * Checks if colors should be used.
 * Respects --no-color flag and NO_COLOR environment variable.
 *
 * @returns True if colors should be used.
 */
export function shouldUseColor(): boolean {
  return !noColorFlag && pc.isColorSupported;
}

/**
 * Applies color function only if colors are enabled.
 *
 * @param colorFn - The color function to apply.
 * @returns A function that applies the color conditionally.
 */
function conditional(colorFn: (text: string) => string): (text: string) => string {
  return (text: string) => (shouldUseColor() ? colorFn(text) : text);
}

/**
 * Color utility functions for CLI output.
 * All functions respect NO_COLOR environment variable and --no-color flag.
 */
export const colors = {
  /** Green color for success messages. */
  success: conditional(pc.green),

  /** Red color for error messages. */
  error: conditional(pc.red),

  /** Yellow color for warning messages. */
  warning: conditional(pc.yellow),

  /** Cyan color for informational messages. */
  info: conditional(pc.cyan),

  /** Blue color for hints and tips. */
  hint: conditional(pc.blue),

  /** Bold text for emphasis. */
  emphasis: conditional(pc.bold),

  /** Dim text for supplementary information. */
  dim: conditional(pc.dim),

  /** Bold cyan for file paths. */
  path: conditional((text: string) => pc.bold(pc.cyan(text))),
};

/**
 * Pre-formatted prefix symbols for CLI output.
 */
export const symbols = {
  /** Success checkmark (✔). */
  success: () => (shouldUseColor() ? pc.green('✔') : '✔'),

  /** Error cross (✖). */
  error: () => (shouldUseColor() ? pc.red('✖') : '✖'),

  /** Warning symbol (⚠). */
  warning: () => (shouldUseColor() ? pc.yellow('⚠') : '⚠'),

  /** Info symbol (ℹ). */
  info: () => (shouldUseColor() ? pc.cyan('ℹ') : 'ℹ'),
};
