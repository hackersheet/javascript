import { describe, it, expect, vi } from 'vitest';

import { cacheClearAction } from '../cache-clear-action';

import type { Logger } from '../../../types/logger';

describe('cacheClearAction', () => {
  it('clears both slugs cache and documents cache', async () => {
    const mockLogger: Logger = {
      log: vi.fn(),
      error: vi.fn(),
    };
    const mockClearCache = vi.fn().mockResolvedValue(undefined);
    const mockClearDocumentsCache = vi.fn().mockResolvedValue(undefined);

    await cacheClearAction({
      logger: mockLogger,
      clearCacheFunc: mockClearCache,
      clearDocumentsCacheFunc: mockClearDocumentsCache,
    });

    expect(mockClearCache).toHaveBeenCalled();
    expect(mockClearDocumentsCache).toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('Cache cleared successfully'));
  });

  it('logs error when cache clear fails', async () => {
    const mockLogger: Logger = {
      log: vi.fn(),
      error: vi.fn(),
    };
    const mockClearCache = vi.fn().mockRejectedValue(new Error('Clear failed'));
    const mockClearDocumentsCache = vi.fn().mockResolvedValue(undefined);

    await expect(
      cacheClearAction({
        logger: mockLogger,
        clearCacheFunc: mockClearCache,
        clearDocumentsCacheFunc: mockClearDocumentsCache,
      })
    ).rejects.toThrow('Clear failed');

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to clear cache'));
  });

  it('logs error when documents cache clear fails', async () => {
    const mockLogger: Logger = {
      log: vi.fn(),
      error: vi.fn(),
    };
    const mockClearCache = vi.fn().mockResolvedValue(undefined);
    const mockClearDocumentsCache = vi.fn().mockRejectedValue(new Error('Documents clear failed'));

    await expect(
      cacheClearAction({
        logger: mockLogger,
        clearCacheFunc: mockClearCache,
        clearDocumentsCacheFunc: mockClearDocumentsCache,
      })
    ).rejects.toThrow('Documents clear failed');

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to clear cache'));
  });
});
