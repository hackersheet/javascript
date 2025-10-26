import path from 'path';

import { findUpSync } from 'find-up';

export function findProjectRootPath(): string | null {
  const dir = findUpSync('.hackersheet', { cwd: process.cwd(), type: 'directory' });
  return dir ? path.dirname(dir) : null;
}
