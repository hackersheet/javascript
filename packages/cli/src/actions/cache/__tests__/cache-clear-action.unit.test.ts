import { describe, it, expect, vi } from 'vitest';

import { cacheClearAction } from '../cache-clear-action';

import type { Logger } from '../../../types/logger';

describe('cacheClearAction', () => {
  it('clears cache and logs success message', async () => {
    const mockLogger: Logger = {
      log: vi.fn(),
      error: vi.fn(),
    };
    const mockClearCache = vi.fn().mockResolvedValue(undefined);

    await cacheClearAction({
      logger: mockLogger,
      clearCacheFunc: mockClearCache,
    });

    expect(mockClearCache).toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('Cache cleared successfully'));
  });

  it('logs error when cache clear fails', async () => {
    const mockLogger: Logger = {
      log: vi.fn(),
      error: vi.fn(),
    };
    const mockClearCache = vi.fn().mockRejectedValue(new Error('Clear failed'));

    await expect(
      cacheClearAction({
        logger: mockLogger,
        clearCacheFunc: mockClearCache,
      })
    ).rejects.toThrow('Clear failed');

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to clear cache'));
  });
});
