import { findUpSync } from 'find-up';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { findProjectRootPath } from '../find-project-root-path';

vi.mock('find-up', () => ({
  findUpSync: vi.fn(),
}));

describe('findProjectRootPath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parent directory when .hackersheet is found', () => {
    vi.mocked(findUpSync).mockReturnValue('/project/.hackersheet');

    const result = findProjectRootPath();

    expect(result).toBe('/project');
  });

  it('returns null when .hackersheet is not found', () => {
    vi.mocked(findUpSync).mockReturnValue(undefined);

    const result = findProjectRootPath();

    expect(result).toBeNull();
  });

  it('calls findUpSync with correct options', () => {
    vi.mocked(findUpSync).mockReturnValue(undefined);

    findProjectRootPath();

    expect(findUpSync).toHaveBeenCalledWith('.hackersheet', {
      cwd: process.cwd(),
      type: 'directory',
    });
  });

  it('handles nested project paths', () => {
    vi.mocked(findUpSync).mockReturnValue('/home/user/projects/myapp/.hackersheet');

    const result = findProjectRootPath();

    expect(result).toBe('/home/user/projects/myapp');
  });

  it('handles root-level project', () => {
    vi.mocked(findUpSync).mockReturnValue('/.hackersheet');

    const result = findProjectRootPath();

    expect(result).toBe('/');
  });
});
