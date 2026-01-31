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
        if (message.includes('template')) return Promise.resolve('{{yyyy}}-{{title}}.md');
        if (message.includes('directories')) return Promise.resolve('docs, guides');
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

  it('creates .hackersheet directory and trees subdirectory', async () => {
    const deps = createMockDeps();

    await setupAction(deps);

    expect(deps.fsApi.mkdir).toHaveBeenCalledWith('/project/.hackersheet', { recursive: true });
    expect(deps.fsApi.mkdir).toHaveBeenCalledWith('/project/.hackersheet/trees', { recursive: true });
  });

  it('writes configuration file with user input', async () => {
    const deps = createMockDeps();

    await setupAction(deps);

    expect(deps.fsApi.writeFile).toHaveBeenCalledWith(
      '/project/.hackersheet/cli.config.json',
      expect.stringContaining('"workspaceSlug": "my-workspace"'),
      'utf8'
    );
    expect(deps.fsApi.writeFile).toHaveBeenCalledWith(
      '/project/.hackersheet/cli.config.json',
      expect.stringContaining('"workspaceAccessKey": "secret-key"'),
      'utf8'
    );
  });

  it('parses comma-separated docsDirs', async () => {
    const deps = createMockDeps();

    await setupAction(deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const config = JSON.parse(writeCall[1] as string);

    expect(config.docsDirs).toEqual(['docs', 'guides']);
  });

  it('logs success message', async () => {
    const deps = createMockDeps();

    await setupAction(deps);

    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('Setup completed'));
    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('/project/.hackersheet'));
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
        message: expect.stringContaining('already initialized'),
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

    expect(deps.logger.log).toHaveBeenCalledWith('Setup cancelled.');
    expect(deps.fsApi.writeFile).not.toHaveBeenCalled();
  });

  it('uses default template when user provides empty input', async () => {
    const deps = createMockDeps({
      prompts: {
        input: vi.fn().mockResolvedValue(''),
        confirm: vi.fn().mockResolvedValue(true),
      },
    });

    await setupAction(deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const config = JSON.parse(writeCall[1] as string);

    expect(config.newFilenameTemplate).toBe('{{yyyy}}-{{mm}}-{{dd}}-{{title}}.md');
    expect(config.docsDirs).toEqual(['docs']);
  });

  it('handles empty docsDirs input', async () => {
    const deps = createMockDeps({
      prompts: {
        input: vi.fn().mockImplementation(({ message }) => {
          if (message.includes('directories')) return Promise.resolve('  ,  ,  ');
          return Promise.resolve('');
        }),
        confirm: vi.fn().mockResolvedValue(true),
      },
    });

    await setupAction(deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const config = JSON.parse(writeCall[1] as string);

    expect(config.docsDirs).toEqual(['docs']);
  });

  it('prompts for all configuration fields', async () => {
    const deps = createMockDeps();

    await setupAction(deps);

    expect(deps.prompts.input).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Workspace slug') })
    );
    expect(deps.prompts.input).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('access key') })
    );
    expect(deps.prompts.input).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('filename template') })
    );
    expect(deps.prompts.input).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('directories') })
    );
  });

  it('logs setup header message', async () => {
    const deps = createMockDeps();

    await setupAction(deps);

    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('Hacker Sheet CLI Setup'));
  });
});
