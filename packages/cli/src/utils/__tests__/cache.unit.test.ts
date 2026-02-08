import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  loadCache,
  saveCache,
  clearCache,
  getCacheDir,
  getCachePath,
  isCacheValid,
  loadDocumentCache,
  saveDocumentCache,
  clearDocumentsCache,
  getDocumentsCacheDir,
  type CacheDeps,
  type DocumentsCacheEntry,
  type DocumentCacheItem,
  type CachedDocument,
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
      const entry: DocumentsCacheEntry = {
        documents: [{ slug: 'doc1', title: 'Doc 1' }],
        timestamp: 1000,
        workspace: 'test-workspace',
      };
      const ttl = 1000000;
      const now = 1500; // 500ms later

      const result = isCacheValid(entry, ttl, now);

      expect(result).toBe(true);
    });

    it('returns false if cache is expired', () => {
      const entry: DocumentsCacheEntry = {
        documents: [{ slug: 'doc1', title: 'Doc 1' }],
        timestamp: 1000,
        workspace: 'test-workspace',
      };
      const ttl = 1000;
      const now = 3000; // 2000ms later, exceeds TTL

      const result = isCacheValid(entry, ttl, now);

      expect(result).toBe(false);
    });

    it('returns true if cache timestamp equals now - ttl', () => {
      const entry: DocumentsCacheEntry = {
        documents: [{ slug: 'doc1', title: 'Doc 1' }],
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
          documents: [
            { slug: 'doc1', title: 'Doc 1' },
            { slug: 'doc2', title: 'Doc 2' },
          ],
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

    it('returns cached documents when cache is valid', () => {
      const timestamp = 1000000;
      const documents: DocumentCacheItem[] = [
        { slug: 'doc1', title: 'Doc 1' },
        { slug: 'doc2', title: 'Doc 2' },
        { slug: 'doc3', title: 'Doc 3' },
      ];
      const cacheContent = JSON.stringify({
        'test-workspace': {
          documents,
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

      expect(result).toEqual(documents);
    });

    it('returns null when workspace is not in cache', () => {
      const cacheContent = JSON.stringify({
        'other-workspace': {
          documents: [{ slug: 'doc1', title: 'Doc 1' }],
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

    it('returns null when cache is in old format (backward compatibility)', () => {
      const cacheContent = JSON.stringify({
        'test-workspace': {
          slugs: ['doc1', 'doc2'],
          timestamp: 1000000,
          workspace: 'test-workspace',
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
  });

  describe('saveCache', () => {
    it('creates cache directory if it does not exist', async () => {
      const documents: DocumentCacheItem[] = [
        { slug: 'doc1', title: 'Doc 1' },
        { slug: 'doc2', title: 'Doc 2' },
      ];

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

      await saveCache('test-workspace', documents, deps);

      expect(deps.fsApi!.mkdir).toHaveBeenCalledWith(expect.stringContaining('hackersheet'), {
        recursive: true,
      });
    });

    it('writes cache file with correct structure', async () => {
      let writtenContent = '';

      const documents: DocumentCacheItem[] = [
        { slug: 'doc1', title: 'Doc 1' },
        { slug: 'doc2', title: 'Doc 2' },
      ];

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

      await saveCache('test-workspace', documents, deps);

      const parsed = JSON.parse(writtenContent);
      expect(parsed['test-workspace']).toEqual({
        documents,
        timestamp: 2000000,
        workspace: 'test-workspace',
      });
    });

    it('preserves existing cache entries for other workspaces', async () => {
      const existingDocs: DocumentCacheItem[] = [{ slug: 'existing-doc', title: 'Existing Doc' }];
      const existingCache = JSON.stringify({
        'other-workspace': {
          documents: existingDocs,
          timestamp: 1000,
          workspace: 'other-workspace',
        },
      });

      const newDocs: DocumentCacheItem[] = [{ slug: 'new-doc', title: 'New Doc' }];
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

      await saveCache('test-workspace', newDocs, deps);

      const parsed = JSON.parse(writtenContent);
      expect(parsed['other-workspace']).toEqual({
        documents: existingDocs,
        timestamp: 1000,
        workspace: 'other-workspace',
      });
      expect(parsed['test-workspace']).toEqual({
        documents: newDocs,
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

  describe('getDocumentsCacheDir', () => {
    it('returns correct path for workspace documents', () => {
      const result = getDocumentsCacheDir('workspace-1');
      expect(result).toMatch(/documents[/\\]workspace-1$/);
    });
  });

  describe('loadDocumentCache', () => {
    it('returns null when file does not exist (integration test)', () => {
      // This is a light integration test that verifies the function handles missing files gracefully
      const result = loadDocumentCache('nonexistent-workspace-12345', 'nonexistent-doc-12345');

      expect(result).toBeNull();
    });
  });

  describe('saveDocumentCache', () => {
    it('silently fails when cache dir is not writable (integration test)', async () => {
      // This test verifies that saveDocumentCache handles errors gracefully
      // even if directory is not writable (we don't actually test writing)
      const document: CachedDocument = {
        id: 'doc-123',
        slug: 'test-doc',
        title: 'Test Document',
        content: 'This is test content',
        draft: false,
      };

      // This should not throw even if there are fs errors
      await expect(saveDocumentCache('workspace-1', 'test-doc', document)).resolves.toBeUndefined();
    });
  });

  describe('clearDocumentsCache', () => {
    it('silently handles errors when documents directory does not exist', async () => {
      // This test verifies that clearDocumentsCache handles missing directories gracefully
      await expect(clearDocumentsCache()).resolves.toBeUndefined();
    });
  });
});
