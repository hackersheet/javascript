import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  loadCache,
  saveCache,
  clearCache,
  getCacheDir,
  getCachePath,
  isCacheValid,
  type CacheDeps,
  type SlugsCacheEntry,
} from '../cache';

describe('cache utilities', () => {
  let mockFsApi: CacheDeps['fsApi'];
  let mockNow: () => number;

  beforeEach(() => {
    mockFsApi = {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
      unlink: vi.fn(),
      access: vi.fn(),
    };
    mockNow = vi.fn(() => 1000000);
  });

  describe('getCacheDir', () => {
    it('returns XDG_CACHE_HOME/hackersheet when XDG_CACHE_HOME is set', () => {
      const oldEnv = process.env.XDG_CACHE_HOME;
      process.env.XDG_CACHE_HOME = '/custom/cache';

      const result = getCacheDir();

      expect(result).toBe('/custom/cache/hackersheet');

      if (oldEnv) {
        process.env.XDG_CACHE_HOME = oldEnv;
      } else {
        delete process.env.XDG_CACHE_HOME;
      }
    });

    it('returns ~/.cache/hackersheet when XDG_CACHE_HOME is not set', () => {
      const oldEnv = process.env.XDG_CACHE_HOME;
      delete process.env.XDG_CACHE_HOME;

      const result = getCacheDir();

      expect(result).toMatch(/\.cache\/hackersheet$/);

      if (oldEnv) {
        process.env.XDG_CACHE_HOME = oldEnv;
      }
    });
  });

  describe('getCachePath', () => {
    it('returns path ending with slugs-cache.json', () => {
      const result = getCachePath();
      expect(result).toMatch(/slugs-cache\.json$/);
    });
  });

  describe('isCacheValid', () => {
    it('returns true if cache is within TTL', () => {
      const entry: SlugsCacheEntry = {
        slugs: ['doc1'],
        timestamp: 1000,
        workspace: 'test-workspace',
      };
      const ttl = 1000000;
      const now = 1500; // 500ms later

      const result = isCacheValid(entry, ttl, now);

      expect(result).toBe(true);
    });

    it('returns false if cache is expired', () => {
      const entry: SlugsCacheEntry = {
        slugs: ['doc1'],
        timestamp: 1000,
        workspace: 'test-workspace',
      };
      const ttl = 1000;
      const now = 3000; // 2000ms later, exceeds TTL

      const result = isCacheValid(entry, ttl, now);

      expect(result).toBe(false);
    });

    it('returns true if cache timestamp equals now - ttl', () => {
      const entry: SlugsCacheEntry = {
        slugs: ['doc1'],
        timestamp: 0,
        workspace: 'test-workspace',
      };
      const ttl = 1000;
      const now = 999; // Just before expiry

      const result = isCacheValid(entry, ttl, now);

      expect(result).toBe(true);
    });
  });

  describe('loadCache', () => {
    it('returns null when cache file does not exist', () => {
      const deps: Partial<CacheDeps> = {
        fsApi: {
          ...mockFsApi,
          access: vi.fn(() => {
            throw new Error('File not found');
          }),
        },
        now: mockNow,
      };

      const result = loadCache('test-workspace', deps);

      expect(result).toBeNull();
    });

    it('returns null when cache is expired', () => {
      const oldTimestamp = 1000;
      const cacheContent = JSON.stringify({
        'test-workspace': {
          slugs: ['doc1', 'doc2'],
          timestamp: oldTimestamp,
          workspace: 'test-workspace',
        },
      });

      const deps: Partial<CacheDeps> = {
        fsApi: {
          ...mockFsApi,
          readFile: vi.fn(() => cacheContent),
          access: vi.fn(),
        },
        now: vi.fn(() => oldTimestamp + 25 * 60 * 60 * 1000), // 25 hours later
      };

      const result = loadCache('test-workspace', deps);

      expect(result).toBeNull();
    });

    it('returns cached slugs when cache is valid', () => {
      const timestamp = 1000000;
      const cacheContent = JSON.stringify({
        'test-workspace': {
          slugs: ['doc1', 'doc2', 'doc3'],
          timestamp,
          workspace: 'test-workspace',
        },
      });

      const deps: Partial<CacheDeps> = {
        fsApi: {
          ...mockFsApi,
          readFile: vi.fn(() => cacheContent),
          access: vi.fn(),
        },
        now: vi.fn(() => timestamp + 1000), // 1 second later
      };

      const result = loadCache('test-workspace', deps);

      expect(result).toEqual(['doc1', 'doc2', 'doc3']);
    });

    it('returns null when workspace is not in cache', () => {
      const cacheContent = JSON.stringify({
        'other-workspace': {
          slugs: ['doc1'],
          timestamp: 1000000,
          workspace: 'other-workspace',
        },
      });

      const deps: Partial<CacheDeps> = {
        fsApi: {
          ...mockFsApi,
          readFile: vi.fn(() => cacheContent),
          access: vi.fn(),
        },
        now: mockNow,
      };

      const result = loadCache('test-workspace', deps);

      expect(result).toBeNull();
    });

    it('returns null when cache file is invalid JSON', () => {
      const deps: Partial<CacheDeps> = {
        fsApi: {
          ...mockFsApi,
          readFile: vi.fn(() => 'invalid json'),
          access: vi.fn(),
        },
        now: mockNow,
      };

      const result = loadCache('test-workspace', deps);

      expect(result).toBeNull();
    });
  });

  describe('saveCache', () => {
    it('creates cache directory if it does not exist', async () => {
      const deps: Partial<CacheDeps> = {
        fsApi: {
          ...mockFsApi,
          mkdir: vi.fn(),
          writeFile: vi.fn(),
          readFile: vi.fn(() => {
            throw new Error('File not found');
          }),
          access: vi.fn(() => {
            throw new Error('File not found');
          }),
        },
        now: mockNow,
      };

      await saveCache('test-workspace', ['doc1', 'doc2'], deps);

      expect(deps.fsApi!.mkdir).toHaveBeenCalledWith(expect.stringContaining('hackersheet'), {
        recursive: true,
      });
    });

    it('writes cache file with correct structure', async () => {
      let writtenContent = '';

      const deps: Partial<CacheDeps> = {
        fsApi: {
          ...mockFsApi,
          mkdir: vi.fn(),
          writeFile: vi.fn((_path: string, data: string) => {
            writtenContent = data;
          }),
          readFile: vi.fn(() => {
            throw new Error('File not found');
          }),
          access: vi.fn(() => {
            throw new Error('File not found');
          }),
        },
        now: vi.fn(() => 2000000),
      };

      await saveCache('test-workspace', ['doc1', 'doc2'], deps);

      const parsed = JSON.parse(writtenContent);
      expect(parsed['test-workspace']).toEqual({
        slugs: ['doc1', 'doc2'],
        timestamp: 2000000,
        workspace: 'test-workspace',
      });
    });

    it('preserves existing cache entries for other workspaces', async () => {
      const existingCache = JSON.stringify({
        'other-workspace': {
          slugs: ['existing-doc'],
          timestamp: 1000,
          workspace: 'other-workspace',
        },
      });

      let writtenContent = '';

      const deps: Partial<CacheDeps> = {
        fsApi: {
          ...mockFsApi,
          mkdir: vi.fn(),
          writeFile: vi.fn((_path: string, data: string) => {
            writtenContent = data;
          }),
          readFile: vi.fn(() => existingCache),
          access: vi.fn(),
        },
        now: vi.fn(() => 2000000),
      };

      await saveCache('test-workspace', ['new-doc'], deps);

      const parsed = JSON.parse(writtenContent);
      expect(parsed['other-workspace']).toEqual({
        slugs: ['existing-doc'],
        timestamp: 1000,
        workspace: 'other-workspace',
      });
      expect(parsed['test-workspace']).toEqual({
        slugs: ['new-doc'],
        timestamp: 2000000,
        workspace: 'test-workspace',
      });
    });
  });

  describe('clearCache', () => {
    it('deletes cache file if it exists', async () => {
      const deps: Partial<CacheDeps> = {
        fsApi: {
          ...mockFsApi,
          access: vi.fn(),
          unlink: vi.fn(),
        },
      };

      await clearCache(deps);

      expect(deps.fsApi!.unlink).toHaveBeenCalledWith(expect.stringContaining('slugs-cache.json'));
    });

    it('does not throw error if cache file does not exist', async () => {
      const deps: Partial<CacheDeps> = {
        fsApi: {
          ...mockFsApi,
          access: vi.fn(() => {
            throw new Error('File not found');
          }),
        },
      };

      await expect(clearCache(deps)).resolves.toBeUndefined();
    });

    it('silently handles errors during deletion', async () => {
      const deps: Partial<CacheDeps> = {
        fsApi: {
          ...mockFsApi,
          access: vi.fn(),
          unlink: vi.fn(() => {
            throw new Error('Permission denied');
          }),
        },
      };

      await expect(clearCache(deps)).resolves.toBeUndefined();
    });
  });
});
