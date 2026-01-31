import path from 'path';

import { findUpSync } from 'find-up';

/**
 * Finds the project root path by locating the `.hackersheet` directory.
 *
 * Traverses up from the current working directory to find a `.hackersheet`
 * directory, then returns its parent directory as the project root.
 *
 * @returns The absolute path to the project root, or `null` if not found.
 */
export function findProjectRootPath(): string | null {
  const dir = findUpSync('.hackersheet', { cwd: process.cwd(), type: 'directory' });
  return dir ? path.dirname(dir) : null;
}
