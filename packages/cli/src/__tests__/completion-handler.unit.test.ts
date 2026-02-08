import tabtab from '@pnpm/tabtab';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { completionHandler, type CompletionHandlerDeps } from '../completion-handler';

import type { Config } from '../utils/load-config';

// Mock tabtab module
vi.mock('@pnpm/tabtab', () => ({
  default: {
    parseEnv: vi.fn(),
    log: vi.fn(),
  },
}));

// Test helper type for mocking client (minimal interface for testing)
type MockClient = {
  getDocuments: (args?: unknown) => Promise<{
    documents: Array<{ slug: string; title: string; draft: boolean }> | null;
    error: null | string;
    totalCount?: number;
    isEmpty?: boolean;
  }>;
};

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
      line: 'hscli docs',
      prev: 'docs',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    const mockLoadCache = vi.fn(() => null);
    const mockSaveCache = vi.fn().mockResolvedValue(undefined);

    const mockClient: MockClient = {
      getDocuments: vi.fn().mockResolvedValue({
        documents: [
          { slug: 'doc1', title: 'Doc 1', draft: false },
          { slug: 'doc2', title: 'Doc 2', draft: false },
        ],
        error: null,
      }),
    };

    const mockCreateClient = vi.fn(() => mockClient);

    await completionHandler({
      loadConfigFn: () => mockConfig,
      loadCacheFn: mockLoadCache,
      saveCacheFn: mockSaveCache,
      // @ts-expect-error - Mock Client differs from real Client in tests
      createClientFn: mockCreateClient,
    });

    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith(['doc1', 'doc2']);
    expect(mockSaveCache).toHaveBeenCalledWith('workspace-1', ['doc1', 'doc2']);
  });

  it('uses cached slugs when available', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      line: 'hscli docs',
      prev: 'docs',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    const mockLoadCache = vi.fn(() => ['cached-doc1', 'cached-doc2']);
    const mockSaveCache = vi.fn();
    const mockCreateClient = vi.fn();

    await completionHandler({
      loadConfigFn: () => mockConfig,
      loadCacheFn: mockLoadCache,
      saveCacheFn: mockSaveCache,
      createClientFn: mockCreateClient,
    });

    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith(['cached-doc1', 'cached-doc2']);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('uses specified workspace for docs completion', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      line: 'hscli docs -w workspace-2',
      prev: '',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    const mockLoadCache = vi.fn(() => null);
    const mockSaveCache = vi.fn().mockResolvedValue(undefined);

    const mockClient: MockClient = {
      getDocuments: vi.fn().mockResolvedValue({
        documents: [{ slug: 'doc3', title: 'Doc 3', draft: false }],
        error: null,
      }),
    };

    const mockCreateClient = vi.fn(() => mockClient);

    await completionHandler({
      loadConfigFn: () => mockConfig,
      loadCacheFn: mockLoadCache,
      saveCacheFn: mockSaveCache,
      createClientFn: mockCreateClient,
    } as unknown as Partial<CompletionHandlerDeps>);

    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith(['doc3']);
    expect(mockSaveCache).toHaveBeenCalledWith('workspace-2', ['doc3']);
  });

  it('returns empty array when API call fails', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      line: 'hscli docs',
      prev: 'docs',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    const mockLoadCache = vi.fn(() => null);
    const mockSaveCache = vi.fn();

    const mockClient: MockClient = {
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
    } as unknown as Partial<CompletionHandlerDeps>);

    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith([]);
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
      expect.arrayContaining(['docs', 'new', 'setup', 'config', 'completion', 'cache'])
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
      expect.arrayContaining(['docs', 'setup', 'config', 'completion', 'cache'])
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

  it('calls default completion when workspace cannot be resolved for docs', async () => {
    const mockParseEnv = vi.fn(() => ({
      complete: true,
      line: 'hscli docs',
      prev: 'docs',
    }));
    vi.mocked(tabtab.parseEnv).mockImplementation(mockParseEnv);

    const emptyConfig: Config = {
      workspaces: {},
      defaultWorkspace: undefined,
      newFilenameTemplate: 'template',
      docsDirs: [],
    };

    await completionHandler({
      loadConfigFn: () => emptyConfig,
    });

    // When workspace cannot be resolved, completionHandler provides default command completion
    expect(vi.mocked(tabtab.log)).toHaveBeenCalledWith(
      expect.arrayContaining(['docs', 'setup', 'config', 'completion', 'cache'])
    );
  });
});
