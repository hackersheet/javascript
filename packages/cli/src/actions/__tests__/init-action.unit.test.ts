import { describe, it, expect, vi, beforeEach } from 'vitest';

import { initAction, type InitActionDeps } from '../init-action';

// Mock loadUserConfig to always return setup completed
vi.mock('../../utils/load-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/load-config')>();
  return {
    ...actual,
    loadUserConfig: vi.fn().mockReturnValue({
      workspaces: { 'test-workspace': { accessKey: 'test-key' } },
    }),
  };
});

describe('initAction', () => {
  const createMockDeps = (overrides: Partial<InitActionDeps> = {}): InitActionDeps => ({
    fsApi: {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      access: vi.fn().mockRejectedValue(new Error('ENOENT')),
    },
    prompts: {
      input: vi.fn().mockImplementation(({ message }) => {
        if (message.includes('template')) return Promise.resolve('{{yyyy}}-{{mm}}-{{dd}}-{{title}}.md');
        if (message.includes('directories')) return Promise.resolve('docs, guides');
        return Promise.resolve('');
      }),
      confirm: vi.fn().mockResolvedValue(true),
    },
    logger: { log: vi.fn(), error: vi.fn() },
    cwd: vi.fn().mockReturnValue('/project'),
    configInitDeps: {
      loadConfigFromPath: vi.fn().mockReturnValue(null),
    },
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates .hackersheet directory and trees subdirectory', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    expect(deps.fsApi.mkdir).toHaveBeenCalledWith('/project/.hackersheet', { recursive: true });
    expect(deps.fsApi.mkdir).toHaveBeenCalledWith('/project/.hackersheet/trees', { recursive: true });
  });

  it('writes configuration file with project settings', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const config = JSON.parse(writeCall[1] as string);

    expect(config.newFilenameTemplate).toBe('{{yyyy}}-{{mm}}-{{dd}}-{{title}}.md');
    expect(config.docsDirs).toEqual(['docs', 'guides']);
  });

  it('does not write workspace configuration in init', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const config = JSON.parse(writeCall[1] as string);

    expect(config.workspaces).toBeUndefined();
    expect(config.defaultWorkspace).toBeUndefined();
  });

  it('logs success message', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('Project initialization completed'));
    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('.hackersheet'));
  });

  it('prompts for overwrite when config already exists', async () => {
    const deps = createMockDeps({
      fsApi: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        writeFile: vi.fn().mockResolvedValue(undefined),
        access: vi.fn().mockResolvedValue(undefined), // file exists
      },
    });

    await initAction(deps);

    expect(deps.prompts.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('already initialized'),
      })
    );
  });

  it('cancels initialization when user declines overwrite', async () => {
    const deps = createMockDeps({
      fsApi: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        writeFile: vi.fn().mockResolvedValue(undefined),
        access: vi.fn().mockResolvedValue(undefined),
      },
      prompts: {
        input: vi.fn(),
        confirm: vi.fn().mockResolvedValue(false),
      },
    });

    await initAction(deps);

    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('Initialization cancelled'));
    expect(deps.fsApi.writeFile).not.toHaveBeenCalled();
  });

  it('handles empty docsDirs input with default', async () => {
    const deps = createMockDeps({
      prompts: {
        input: vi.fn().mockImplementation(({ message }) => {
          if (message.includes('directories')) return Promise.resolve('');
          return Promise.resolve('');
        }),
        confirm: vi.fn().mockResolvedValue(true),
      },
    });

    await initAction(deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const config = JSON.parse(writeCall[1] as string);

    expect(config.docsDirs).toEqual(['docs']);
  });

  it('prompts for project configuration fields only', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    // Should prompt for project fields
    expect(deps.prompts.input).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('filename template') })
    );
    expect(deps.prompts.input).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Document directories') })
    );

    // Should NOT prompt for workspace fields
    const inputCalls = vi.mocked(deps.prompts.input).mock.calls;
    const allMessages = inputCalls.map((call) => (call[0] as { message: string }).message);
    expect(allMessages.some((msg) => msg.includes('Workspace slug'))).toBe(false);
    expect(allMessages.some((msg) => msg.includes('access key'))).toBe(false);
  });

  it('logs initialization header message', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('Hacker Sheet Project Initialization'));
  });
});
