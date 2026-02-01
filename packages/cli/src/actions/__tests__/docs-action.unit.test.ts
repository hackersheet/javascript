import { describe, it, expect, vi, beforeEach } from 'vitest';

import { docsAction, type DocsActionDeps } from '../docs-action';
import { ConfigError, type Config } from '../../utils/load-config';

describe('docsAction', () => {
  const createMockDeps = (overrides: Partial<DocsActionDeps> = {}): DocsActionDeps => ({
    logger: { log: vi.fn(), error: vi.fn() },
    exitHandler: { exit: vi.fn() },
    loadConfigFn: vi.fn().mockReturnValue({
      workspaces: {
        'test-workspace': { accessKey: 'test-key' },
      },
      defaultWorkspace: 'test-workspace',
      newFilenameTemplate: '',
      docsDirs: [],
    } as Config),
    createClientFn: vi.fn().mockReturnValue({
      getDocument: vi.fn().mockResolvedValue({
        document: { content: 'Document content' },
      }),
    }),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error when slug is not provided', async () => {
    const deps = createMockDeps();

    await docsAction(undefined as unknown as string, {}, deps);

    expect(deps.logger.error).toHaveBeenCalledWith('Error: Missing required argument <slug>');
    expect(deps.exitHandler.exit).toHaveBeenCalledWith(1);
  });

  it('shows error when config loading fails', async () => {
    const deps = createMockDeps({
      loadConfigFn: vi.fn().mockImplementation(() => {
        throw new ConfigError('Invalid JSON', '/path/to/config.json');
      }),
    });

    await docsAction('test-slug', {}, deps);

    expect(deps.logger.error).toHaveBeenCalledWith('Configuration error: Invalid JSON');
    expect(deps.logger.error).toHaveBeenCalledWith('  File: /path/to/config.json');
    expect(deps.exitHandler.exit).toHaveBeenCalledWith(1);
  });

  it('shows error when no workspaces configured', async () => {
    const deps = createMockDeps({
      loadConfigFn: vi.fn().mockReturnValue({
        workspaces: {},
        newFilenameTemplate: '',
        docsDirs: [],
      }),
    });

    await docsAction('test-slug', {}, deps);

    expect(deps.logger.error).toHaveBeenCalledWith('Error: No workspaces configured.');
    expect(deps.logger.error).toHaveBeenCalledWith('Run "hscli setup" to configure your workspace.');
    expect(deps.exitHandler.exit).toHaveBeenCalledWith(1);
  });

  it('shows error when multiple workspaces configured but no default set', async () => {
    const deps = createMockDeps({
      loadConfigFn: vi.fn().mockReturnValue({
        workspaces: {
          workspace1: { accessKey: 'key1' },
          workspace2: { accessKey: 'key2' },
        },
        newFilenameTemplate: '',
        docsDirs: [],
      }),
    });

    await docsAction('test-slug', {}, deps);

    expect(deps.logger.error).toHaveBeenCalledWith('Error: Multiple workspaces configured but no default set.');
    expect(deps.logger.error).toHaveBeenCalledWith('Use --workspace <slug> to specify which workspace to use,');
    expect(deps.exitHandler.exit).toHaveBeenCalledWith(1);
  });

  it('shows error when specified workspace is not configured', async () => {
    const deps = createMockDeps({
      loadConfigFn: vi.fn().mockReturnValue({
        workspaces: {
          'existing-workspace': { accessKey: 'key' },
        },
        newFilenameTemplate: '',
        docsDirs: [],
      }),
    });

    await docsAction('test-slug', { workspace: 'non-existent' }, deps);

    expect(deps.logger.error).toHaveBeenCalledWith('Error: Workspace "non-existent" is not configured.');
    expect(deps.exitHandler.exit).toHaveBeenCalledWith(1);
  });

  it('shows error when API connection fails', async () => {
    const deps = createMockDeps({
      createClientFn: vi.fn().mockReturnValue({
        getDocument: vi.fn().mockRejectedValue(new Error('Network error')),
      }),
    });

    await docsAction('test-slug', {}, deps);

    expect(deps.logger.error).toHaveBeenCalledWith('Error: Failed to connect to the API.');
    expect(deps.exitHandler.exit).toHaveBeenCalledWith(1);
  });

  it('shows error when API returns error', async () => {
    const deps = createMockDeps({
      createClientFn: vi.fn().mockReturnValue({
        getDocument: vi.fn().mockResolvedValue({
          error: new Error('GraphQL error'),
        }),
      }),
    });

    await docsAction('test-slug', {}, deps);

    expect(deps.logger.error).toHaveBeenCalledWith('Error: API returned an error.');
    expect(deps.exitHandler.exit).toHaveBeenCalledWith(1);
  });

  it('shows error when document is not found', async () => {
    const deps = createMockDeps({
      createClientFn: vi.fn().mockReturnValue({
        getDocument: vi.fn().mockResolvedValue({
          document: null,
        }),
      }),
    });

    await docsAction('test-slug', {}, deps);

    expect(deps.logger.error).toHaveBeenCalledWith('Error: Document not found with slug "test-slug".');
    expect(deps.exitHandler.exit).toHaveBeenCalledWith(1);
  });

  it('outputs document content on success', async () => {
    const deps = createMockDeps();

    await docsAction('test-slug', {}, deps);

    expect(deps.logger.log).toHaveBeenCalledWith('Document content');
    expect(deps.exitHandler.exit).not.toHaveBeenCalled();
  });

  it('creates client with correct URL and access key', async () => {
    const deps = createMockDeps();

    await docsAction('test-slug', {}, deps);

    expect(deps.createClientFn).toHaveBeenCalledWith({
      url: 'https://api.hackersheet.com/test-workspace/v1/graphql',
      accessKey: 'test-key',
    });
  });

  it('uses workspace from --workspace option', async () => {
    const deps = createMockDeps({
      loadConfigFn: vi.fn().mockReturnValue({
        workspaces: {
          'default-workspace': { accessKey: 'default-key' },
          'other-workspace': { accessKey: 'other-key' },
        },
        defaultWorkspace: 'default-workspace',
        newFilenameTemplate: '',
        docsDirs: [],
      }),
    });

    await docsAction('test-slug', { workspace: 'other-workspace' }, deps);

    expect(deps.createClientFn).toHaveBeenCalledWith({
      url: 'https://api.hackersheet.com/other-workspace/v1/graphql',
      accessKey: 'other-key',
    });
  });

  it('uses defaultWorkspace when no --workspace option', async () => {
    const deps = createMockDeps({
      loadConfigFn: vi.fn().mockReturnValue({
        workspaces: {
          'default-workspace': { accessKey: 'default-key' },
          'other-workspace': { accessKey: 'other-key' },
        },
        defaultWorkspace: 'default-workspace',
        newFilenameTemplate: '',
        docsDirs: [],
      }),
    });

    await docsAction('test-slug', {}, deps);

    expect(deps.createClientFn).toHaveBeenCalledWith({
      url: 'https://api.hackersheet.com/default-workspace/v1/graphql',
      accessKey: 'default-key',
    });
  });

  it('auto-selects single workspace when no default set', async () => {
    const deps = createMockDeps({
      loadConfigFn: vi.fn().mockReturnValue({
        workspaces: {
          'only-workspace': { accessKey: 'only-key' },
        },
        newFilenameTemplate: '',
        docsDirs: [],
      }),
    });

    await docsAction('test-slug', {}, deps);

    expect(deps.createClientFn).toHaveBeenCalledWith({
      url: 'https://api.hackersheet.com/only-workspace/v1/graphql',
      accessKey: 'only-key',
    });
  });
});
