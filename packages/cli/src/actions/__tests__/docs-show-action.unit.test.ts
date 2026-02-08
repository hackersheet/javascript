import { beforeEach, describe, expect, it, vi } from 'vitest';

import { docsShowAction } from '../docs-show-action';

import type { Config } from '../../utils/load-config';

describe('docsShowAction', () => {
  const mockConfig: Config = {
    workspaces: {
      'workspace-1': {
        accessKey: 'test-key-1',
      },
    },
    defaultWorkspace: 'workspace-1',
    newFilenameTemplate: 'template',
    docsDirs: ['docs'],
  };

  const mockDocument = {
    id: 'doc-123',
    slug: 'test-doc',
    title: 'Test Document',
    content: 'This is test content',
    draft: false,
  };

  const createMockClient = (document = mockDocument) => ({
    getDocument: vi.fn().mockResolvedValue({
      document,
      error: null,
    }),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error when slug is not provided', async () => {
    const mockLogger = { log: vi.fn(), error: vi.fn() };
    const mockExitHandler = { exit: vi.fn() };

    await docsShowAction('', {}, { logger: mockLogger, exitHandler: mockExitHandler });

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Missing required argument'));
    expect(mockExitHandler.exit).toHaveBeenCalledWith(1);
  });

  it('shows error when config loading fails', async () => {
    const mockLogger = { log: vi.fn(), error: vi.fn() };
    const mockExitHandler = { exit: vi.fn() };
    const mockLoadConfig = vi.fn().mockImplementation(() => {
      throw new Error('Config error');
    });

    await docsShowAction('test-doc', {}, {
      logger: mockLogger,
      exitHandler: mockExitHandler,
      loadConfigFn: mockLoadConfig,
    });

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to load configuration'));
    expect(mockExitHandler.exit).toHaveBeenCalledWith(1);
  });

  it('shows error when no workspaces configured', async () => {
    const mockLogger = { log: vi.fn(), error: vi.fn() };
    const mockExitHandler = { exit: vi.fn() };
    const mockLoadConfig = vi.fn().mockReturnValue({ workspaces: {}, docsDirs: [] });

    await docsShowAction('test-doc', {}, {
      logger: mockLogger,
      exitHandler: mockExitHandler,
      loadConfigFn: mockLoadConfig,
    });

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('No workspaces configured'));
    expect(mockExitHandler.exit).toHaveBeenCalledWith(1);
  });

  it('shows error when specified workspace is not configured', async () => {
    const mockLogger = { log: vi.fn(), error: vi.fn() };
    const mockExitHandler = { exit: vi.fn() };

    await docsShowAction('test-doc', { workspace: 'nonexistent' }, {
      logger: mockLogger,
      exitHandler: mockExitHandler,
      loadConfigFn: () => mockConfig,
    });

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('is not configured'));
    expect(mockExitHandler.exit).toHaveBeenCalledWith(1);
  });

  it('shows error when API connection fails', async () => {
    const mockLogger = { log: vi.fn(), error: vi.fn() };
    const mockExitHandler = { exit: vi.fn() };
    const mockCreateClient = vi.fn(() => ({
      getDocument: vi.fn().mockRejectedValue(new Error('Network error')),
    }));
    const mockLoadDocumentCache = vi.fn().mockReturnValue(null);

    await docsShowAction('test-doc', {}, {
      logger: mockLogger,
      exitHandler: mockExitHandler,
      loadConfigFn: () => mockConfig,
      // @ts-expect-error - Mock client for testing
      createClientFn: mockCreateClient,
      loadDocumentCacheFn: mockLoadDocumentCache,
    });

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to connect to the API'));
    expect(mockExitHandler.exit).toHaveBeenCalledWith(1);
  });

  it('shows error when API returns error', async () => {
    const mockLogger = { log: vi.fn(), error: vi.fn() };
    const mockExitHandler = { exit: vi.fn() };
    const mockCreateClient = vi.fn(() => ({
      getDocument: vi.fn().mockResolvedValue({
        document: null,
        error: 'API Error',
      }),
    }));
    const mockLoadDocumentCache = vi.fn().mockReturnValue(null);

    await docsShowAction('test-doc', {}, {
      logger: mockLogger,
      exitHandler: mockExitHandler,
      loadConfigFn: () => mockConfig,
      // @ts-expect-error - Mock client for testing
      createClientFn: mockCreateClient,
      loadDocumentCacheFn: mockLoadDocumentCache,
    });

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('API returned an error'));
    expect(mockExitHandler.exit).toHaveBeenCalledWith(1);
  });

  it('shows error when document is not found', async () => {
    const mockLogger = { log: vi.fn(), error: vi.fn() };
    const mockExitHandler = { exit: vi.fn() };
    const mockCreateClient = vi.fn(() => ({
      getDocument: vi.fn().mockResolvedValue({
        document: null,
        error: null,
      }),
    }));
    const mockLoadDocumentCache = vi.fn().mockReturnValue(null);

    await docsShowAction('test-doc', {}, {
      logger: mockLogger,
      exitHandler: mockExitHandler,
      loadConfigFn: () => mockConfig,
      // @ts-expect-error - Mock client for testing
      createClientFn: mockCreateClient,
      loadDocumentCacheFn: mockLoadDocumentCache,
    });

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Document not found'));
    expect(mockExitHandler.exit).toHaveBeenCalledWith(1);
  });

  it('loads document from cache when available', async () => {
    const mockLogger = { log: vi.fn(), error: vi.fn() };
    const mockExitHandler = { exit: vi.fn() };
    const mockLoadDocumentCache = vi.fn().mockReturnValue(mockDocument);
    const mockCreateClient = vi.fn();
    const mockSaveDocumentCache = vi.fn();

    await docsShowAction('test-doc', {}, {
      logger: mockLogger,
      exitHandler: mockExitHandler,
      loadConfigFn: () => mockConfig,
      createClientFn: mockCreateClient,
      loadDocumentCacheFn: mockLoadDocumentCache,
      saveDocumentCacheFn: mockSaveDocumentCache,
    });

    expect(mockLoadDocumentCache).toHaveBeenCalledWith('workspace-1', 'test-doc');
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith(mockDocument.content);
  });

  it('fetches from API when cache is empty and saves to cache', async () => {
    const mockLogger = { log: vi.fn(), error: vi.fn() };
    const mockExitHandler = { exit: vi.fn() };
    const mockLoadDocumentCache = vi.fn().mockReturnValue(null);
    const mockCreateClient = vi.fn(() => createMockClient());
    const mockSaveDocumentCache = vi.fn().mockResolvedValue(undefined);

    await docsShowAction('test-doc', {}, {
      logger: mockLogger,
      exitHandler: mockExitHandler,
      loadConfigFn: () => mockConfig,
      // @ts-expect-error - Mock client for testing
      createClientFn: mockCreateClient,
      loadDocumentCacheFn: mockLoadDocumentCache,
      saveDocumentCacheFn: mockSaveDocumentCache,
    });

    expect(mockLoadDocumentCache).toHaveBeenCalledWith('workspace-1', 'test-doc');
    expect(mockCreateClient).toHaveBeenCalled();
    expect(mockSaveDocumentCache).toHaveBeenCalledWith('workspace-1', 'test-doc', expect.objectContaining(mockDocument));
    expect(mockLogger.log).toHaveBeenCalledWith(mockDocument.content);
  });

  it('bypasses cache when --refresh flag is provided', async () => {
    const mockLogger = { log: vi.fn(), error: vi.fn() };
    const mockExitHandler = { exit: vi.fn() };
    const mockLoadDocumentCache = vi.fn().mockReturnValue(mockDocument);
    const mockCreateClient = vi.fn(() => createMockClient());
    const mockSaveDocumentCache = vi.fn().mockResolvedValue(undefined);

    await docsShowAction('test-doc', { refresh: true }, {
      logger: mockLogger,
      exitHandler: mockExitHandler,
      loadConfigFn: () => mockConfig,
      // @ts-expect-error - Mock client for testing
      createClientFn: mockCreateClient,
      loadDocumentCacheFn: mockLoadDocumentCache,
      saveDocumentCacheFn: mockSaveDocumentCache,
    });

    expect(mockLoadDocumentCache).not.toHaveBeenCalled();
    expect(mockCreateClient).toHaveBeenCalled();
    expect(mockSaveDocumentCache).toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith(mockDocument.content);
  });

  it('creates client with correct URL and access key', async () => {
    const mockLogger = { log: vi.fn(), error: vi.fn() };
    const mockExitHandler = { exit: vi.fn() };
    const mockLoadDocumentCache = vi.fn().mockReturnValue(null);
    const mockCreateClient = vi.fn(() => createMockClient());
    const mockSaveDocumentCache = vi.fn().mockResolvedValue(undefined);

    await docsShowAction('test-doc', {}, {
      logger: mockLogger,
      exitHandler: mockExitHandler,
      loadConfigFn: () => mockConfig,
      // @ts-expect-error - Mock client for testing
      createClientFn: mockCreateClient,
      loadDocumentCacheFn: mockLoadDocumentCache,
      saveDocumentCacheFn: mockSaveDocumentCache,
    });

    expect(mockCreateClient).toHaveBeenCalledWith({
      url: 'https://api.hackersheet.com/workspace-1/v1/graphql',
      accessKey: 'test-key-1',
    });
  });

  it('uses workspace from --workspace option', async () => {
    const mockLogger = { log: vi.fn(), error: vi.fn() };
    const mockExitHandler = { exit: vi.fn() };
    const mockLoadDocumentCache = vi.fn().mockReturnValue(null);
    const mockCreateClient = vi.fn(() => createMockClient());
    const mockSaveDocumentCache = vi.fn().mockResolvedValue(undefined);
    const multiWorkspaceConfig: Config = {
      ...mockConfig,
      workspaces: {
        'workspace-1': { accessKey: 'key-1' },
        'workspace-2': { accessKey: 'key-2' },
      },
    };

    await docsShowAction('test-doc', { workspace: 'workspace-2' }, {
      logger: mockLogger,
      exitHandler: mockExitHandler,
      loadConfigFn: () => multiWorkspaceConfig,
      // @ts-expect-error - Mock client for testing
      createClientFn: mockCreateClient,
      loadDocumentCacheFn: mockLoadDocumentCache,
      saveDocumentCacheFn: mockSaveDocumentCache,
    });

    expect(mockCreateClient).toHaveBeenCalledWith({
      url: 'https://api.hackersheet.com/workspace-2/v1/graphql',
      accessKey: 'key-2',
    });
  });

  it('uses defaultWorkspace when no --workspace option', async () => {
    const mockLogger = { log: vi.fn(), error: vi.fn() };
    const mockExitHandler = { exit: vi.fn() };
    const mockLoadDocumentCache = vi.fn().mockReturnValue(null);
    const mockCreateClient = vi.fn(() => createMockClient());
    const mockSaveDocumentCache = vi.fn().mockResolvedValue(undefined);

    await docsShowAction('test-doc', {}, {
      logger: mockLogger,
      exitHandler: mockExitHandler,
      loadConfigFn: () => mockConfig,
      // @ts-expect-error - Mock client for testing
      createClientFn: mockCreateClient,
      loadDocumentCacheFn: mockLoadDocumentCache,
      saveDocumentCacheFn: mockSaveDocumentCache,
    });

    expect(mockCreateClient).toHaveBeenCalledWith({
      url: 'https://api.hackersheet.com/workspace-1/v1/graphql',
      accessKey: 'test-key-1',
    });
  });

  it('auto-selects single workspace when no default set', async () => {
    const mockLogger = { log: vi.fn(), error: vi.fn() };
    const mockExitHandler = { exit: vi.fn() };
    const mockLoadDocumentCache = vi.fn().mockReturnValue(null);
    const mockCreateClient = vi.fn(() => createMockClient());
    const mockSaveDocumentCache = vi.fn().mockResolvedValue(undefined);
    const singleWorkspaceConfig: Config = {
      ...mockConfig,
      defaultWorkspace: undefined,
    };

    await docsShowAction('test-doc', {}, {
      logger: mockLogger,
      exitHandler: mockExitHandler,
      loadConfigFn: () => singleWorkspaceConfig,
      // @ts-expect-error - Mock client for testing
      createClientFn: mockCreateClient,
      loadDocumentCacheFn: mockLoadDocumentCache,
      saveDocumentCacheFn: mockSaveDocumentCache,
    });

    expect(mockCreateClient).toHaveBeenCalledWith({
      url: 'https://api.hackersheet.com/workspace-1/v1/graphql',
      accessKey: 'test-key-1',
    });
  });
});
