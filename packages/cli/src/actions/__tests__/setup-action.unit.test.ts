import { describe, it, expect, vi, beforeEach } from 'vitest';

import { setupAction, type SetupActionDeps } from '../setup-action';

describe('setupAction', () => {
  const createMockDeps = (overrides: Partial<SetupActionDeps> = {}): SetupActionDeps => ({
    fsApi: {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      access: vi.fn().mockRejectedValue(new Error('ENOENT')),
    },
    prompts: {
      input: vi.fn().mockImplementation(({ message }) => {
        if (message.includes('slug')) return Promise.resolve('my-workspace');
        if (message.includes('access key')) return Promise.resolve('secret-key');
        return Promise.resolve('');
      }),
      confirm: vi.fn().mockResolvedValue(true),
    },
    logger: { log: vi.fn(), error: vi.fn() },
    cwd: vi.fn().mockReturnValue('/project'),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates global config directory', async () => {
    const deps = createMockDeps();

    await setupAction(deps);

    expect(deps.fsApi.mkdir).toHaveBeenCalledWith(expect.stringContaining('.config/hackersheet'), {
      recursive: true,
    });
  });

  it('writes configuration file with workspace settings', async () => {
    const deps = createMockDeps();

    await setupAction(deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const config = JSON.parse(writeCall[1] as string);

    expect(config.workspaces).toEqual({
      'my-workspace': { accessKey: 'secret-key' },
    });
    expect(config.defaultWorkspace).toBe('my-workspace');
  });

  it('does not write template or docsDirs in setup', async () => {
    const deps = createMockDeps();

    await setupAction(deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const config = JSON.parse(writeCall[1] as string);

    expect(config.newFilenameTemplate).toBeUndefined();
    expect(config.docsDirs).toBeUndefined();
  });

  it('logs success message with global config path', async () => {
    const deps = createMockDeps();

    await setupAction(deps);

    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('Setup completed'));
    expect(deps.logger.log).toHaveBeenCalledWith(
      expect.stringContaining('.config/hackersheet/cli.config.json')
    );
  });

  it('suggests running hscli init next', async () => {
    const deps = createMockDeps();

    await setupAction(deps);

    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('hscli init'));
  });

  it('prompts for overwrite when config already exists', async () => {
    const deps = createMockDeps({
      fsApi: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        writeFile: vi.fn().mockResolvedValue(undefined),
        access: vi.fn().mockResolvedValue(undefined), // file exists
      },
    });

    await setupAction(deps);

    expect(deps.prompts.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('already set up'),
      })
    );
  });

  it('cancels setup when user declines overwrite', async () => {
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

    await setupAction(deps);

    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('Setup cancelled'));
    expect(deps.fsApi.writeFile).not.toHaveBeenCalled();
  });

  it('handles empty workspace input', async () => {
    const deps = createMockDeps({
      prompts: {
        input: vi.fn().mockResolvedValue(''),
        confirm: vi.fn().mockResolvedValue(true),
      },
    });

    await setupAction(deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const config = JSON.parse(writeCall[1] as string);

    expect(config.workspaces).toEqual({});
    expect(config.defaultWorkspace).toBeUndefined();
  });

  it('does not set workspace when only slug is provided', async () => {
    const deps = createMockDeps({
      prompts: {
        input: vi.fn().mockImplementation(({ message }) => {
          if (message.includes('slug')) return Promise.resolve('my-workspace');
          if (message.includes('access key')) return Promise.resolve('');
          return Promise.resolve('');
        }),
        confirm: vi.fn().mockResolvedValue(true),
      },
    });

    await setupAction(deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const config = JSON.parse(writeCall[1] as string);

    expect(config.workspaces).toEqual({});
    expect(config.defaultWorkspace).toBeUndefined();
  });

  it('does not set workspace when only access key is provided', async () => {
    const deps = createMockDeps({
      prompts: {
        input: vi.fn().mockImplementation(({ message }) => {
          if (message.includes('slug')) return Promise.resolve('');
          if (message.includes('access key')) return Promise.resolve('secret-key');
          return Promise.resolve('');
        }),
        confirm: vi.fn().mockResolvedValue(true),
      },
    });

    await setupAction(deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const config = JSON.parse(writeCall[1] as string);

    expect(config.workspaces).toEqual({});
    expect(config.defaultWorkspace).toBeUndefined();
  });

  it('prompts for workspace configuration fields only', async () => {
    const deps = createMockDeps();

    await setupAction(deps);

    // Should prompt for workspace fields
    expect(deps.prompts.input).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Workspace slug') })
    );
    expect(deps.prompts.input).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('access key') })
    );

    // Should NOT prompt for project fields
    const inputCalls = vi.mocked(deps.prompts.input).mock.calls;
    const allMessages = inputCalls.map((call) => (call[0] as { message: string }).message);
    expect(allMessages.some((msg) => msg.includes('filename template'))).toBe(false);
    expect(allMessages.some((msg) => msg.includes('Document directories'))).toBe(false);
  });

  it('logs setup header message', async () => {
    const deps = createMockDeps();

    await setupAction(deps);

    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('Hacker Sheet CLI Setup'));
  });
});
