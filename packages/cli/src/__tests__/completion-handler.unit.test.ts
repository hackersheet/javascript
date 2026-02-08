import tabtab from '@pnpm/tabtab';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { completionHandler } from '../completion-handler';

import type { DocumentCacheItem } from '../utils/cache';
import type { Config } from '../utils/load-config';

// Mock tabtab module
vi.mock('@pnpm/tabtab', () => ({
  default: {
    parseEnv: vi.fn(),
    log: vi.fn(),
  },
}));

describe('completionHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockConfig: Config = {
    workspaces: {
      'workspace-1': {
        accessKey: 'key1',
      },
      'workspace-2': {
        accessKey: 'key2',
      },
    },
    defaultWorkspace: 'workspace-1',
    newFilenameTemplate: 'template',
    docsDirs: [],
  };

  it('does nothing when not in completion mode', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: false,
      line: 'hscli',
      prev: 'hscli',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    await completionHandler({
      loadConfigFn: () => mockConfig,
    });

    expect(vi.mocked(tabtab.log)).not.toHaveBeenCalled();
  });

  it('suggests workspace slugs for --workspace option', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      prev: '--workspace',
      line: 'hscli docs --workspace',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    await completionHandler({
      loadConfigFn: () => mockConfig,
    });

    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith(['workspace-1', 'workspace-2']);
  });

  it('suggests workspace slugs for -w option', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      prev: '-w',
      line: 'hscli docs -w',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    await completionHandler({
      loadConfigFn: () => mockConfig,
    });

    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith(['workspace-1', 'workspace-2']);
  });

  it('suggests document slugs for docs command', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      line: 'hscli docs show',
      prev: 'show',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    const mockLoadCache = vi.fn(() => null);
    const mockSaveCache = vi.fn().mockResolvedValue(undefined);

    const mockDocuments: DocumentCacheItem[] = [
      { slug: 'doc1', title: 'Doc 1' },
      { slug: 'doc2', title: 'Doc 2' },
    ];

    const mockClient = {
      getDocuments: vi.fn().mockResolvedValue({
        documents: [
          { slug: 'doc1', title: 'Doc 1', draft: false, id: 'doc1-id' },
          { slug: 'doc2', title: 'Doc 2', draft: false, id: 'doc2-id' },
        ],
        error: null,
      }),
    };

    const mockCreateClient = vi.fn(() => mockClient);

    await completionHandler({
      loadConfigFn: () => mockConfig,
      loadCacheFn: mockLoadCache,
      saveCacheFn: mockSaveCache,
      createClientFn: mockCreateClient,
    });

    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith(
      expect.arrayContaining([
        { name: 'doc1', description: 'Doc 1' },
        { name: 'doc2', description: 'Doc 2' },
      ])
    );
    expect(mockSaveCache).toHaveBeenCalledWith('workspace-1', mockDocuments);
  });

  it('uses cached documents when available', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      line: 'hscli docs show',
      prev: 'show',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    const cachedDocuments: DocumentCacheItem[] = [
      { slug: 'cached-doc1', title: 'Cached Doc 1' },
      { slug: 'cached-doc2', title: 'Cached Doc 2' },
    ];

    const mockLoadCache = vi.fn(() => cachedDocuments);
    const mockSaveCache = vi.fn();
    const mockCreateClient = vi.fn();

    await completionHandler({
      loadConfigFn: () => mockConfig,
      loadCacheFn: mockLoadCache,
      saveCacheFn: mockSaveCache,
      createClientFn: mockCreateClient,
    });

    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith(
      expect.arrayContaining([
        { name: 'cached-doc1', description: 'Cached Doc 1' },
        { name: 'cached-doc2', description: 'Cached Doc 2' },
      ])
    );
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('uses specified workspace for docs completion', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      line: 'hscli docs show -w workspace-2',
      prev: '',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    const mockLoadCache = vi.fn(() => null);
    const mockSaveCache = vi.fn().mockResolvedValue(undefined);

    const mockDocuments: DocumentCacheItem[] = [{ slug: 'doc3', title: 'Doc 3' }];

    const mockClient = {
      getDocuments: vi.fn().mockResolvedValue({
        documents: [{ slug: 'doc3', title: 'Doc 3', draft: false, id: 'doc3-id' }],
        error: null,
      }),
    };

    const mockCreateClient = vi.fn(() => mockClient);

    await completionHandler({
      loadConfigFn: () => mockConfig,
      loadCacheFn: mockLoadCache,
      saveCacheFn: mockSaveCache,
      createClientFn: mockCreateClient,
    });

    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith(
      expect.arrayContaining([{ name: 'doc3', description: 'Doc 3' }])
    );
    expect(mockSaveCache).toHaveBeenCalledWith('workspace-2', mockDocuments);
  });

  it('returns empty array when API call fails', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      line: 'hscli docs show',
      prev: 'show',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    const mockLoadCache = vi.fn(() => null);
    const mockSaveCache = vi.fn();

    const mockClient = {
      getDocuments: vi.fn().mockResolvedValue({
        documents: null,
        error: 'API Error',
      }),
    };

    const mockCreateClient = vi.fn(() => mockClient);

    await completionHandler({
      loadConfigFn: () => mockConfig,
      loadCacheFn: mockLoadCache,
      saveCacheFn: mockSaveCache,
      createClientFn: mockCreateClient,
    });

    // When API fails, returns empty array for completion items
    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith([]);
  });

  it('suggests docs subcommands when prev is docs', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      line: 'hscli docs',
      prev: 'docs',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    await completionHandler({
      loadConfigFn: () => mockConfig,
    });

    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith(['show', 'list']);
  });

  it('suggests config subcommands when prev is config', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      line: 'hscli config',
      prev: 'config',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    await completionHandler({
      loadConfigFn: () => mockConfig,
    });

    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith(
      expect.arrayContaining(['init', 'list', 'get', 'set', 'delete', 'path'])
    );
  });

  it('suggests completion subcommands when prev is completion', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      line: 'hscli completion',
      prev: 'completion',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    await completionHandler({
      loadConfigFn: () => mockConfig,
    });

    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith(['install']);
  });

  it('suggests cache subcommands when prev is cache', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      line: 'hscli cache',
      prev: 'cache',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    await completionHandler({
      loadConfigFn: () => mockConfig,
    });

    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith(['clear']);
  });

  it('suggests default commands when no specific completion matches', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      line: 'hscli',
      prev: 'hscli',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    await completionHandler({
      loadConfigFn: () => mockConfig,
    });

    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith(
      expect.arrayContaining(['docs', 'new', 'setup', 'init', 'config', 'completion', 'cache'])
    );
  });

  it('handles missing workspace gracefully', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      line: 'hscli docs -w nonexistent',
      prev: '',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    await completionHandler({
      loadConfigFn: () => mockConfig,
    });

    // Falls back to default command completion when workspace is missing
    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith(
      expect.arrayContaining(['docs', 'setup', 'init', 'config', 'completion', 'cache'])
    );
  });

  it('silently fails when config loading fails', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      line: 'hscli docs',
      prev: 'docs',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    const mockLoadConfig = vi.fn(() => {
      throw new Error('Config load failed');
    });

    await expect(
      completionHandler({
        loadConfigFn: mockLoadConfig,
      })
    ).resolves.toBeUndefined();
  });
});
