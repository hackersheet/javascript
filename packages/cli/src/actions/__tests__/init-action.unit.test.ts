import { describe, it, expect, vi, beforeEach } from 'vitest';

import { initAction, type InitActionDeps, type FsLike } from '../init-action';

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

/**
 * Finds a writeFile call whose first argument contains the given path substring.
 */
function findWriteCall(
  writeFile: FsLike['writeFile'],
  pathSubstring: string
): [string, string, string] | undefined {
  return (vi.mocked(writeFile).mock.calls as unknown as [string, string, string][]).find((call) =>
    call[0].includes(pathSubstring)
  );
}

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

  it('creates .hackersheet directory and subdirectories', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    expect(deps.fsApi.mkdir).toHaveBeenCalledWith('/project/.hackersheet', { recursive: true });
    expect(deps.fsApi.mkdir).toHaveBeenCalledWith('/project/.hackersheet/trees', { recursive: true });
    expect(deps.fsApi.mkdir).toHaveBeenCalledWith('/project/.hackersheet/templates', { recursive: true });
  });

  it('creates .keep file in trees directory', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    const writeCall = findWriteCall(deps.fsApi.writeFile, 'trees/.keep');
    expect(writeCall).toBeDefined();
    expect(writeCall![0]).toBe('/project/.hackersheet/trees/.keep');
    expect(writeCall![1]).toBe('');
  });

  it('writes configuration file with project settings', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    const writeCall = findWriteCall(deps.fsApi.writeFile, 'cli.config.json');
    expect(writeCall).toBeDefined();

    const config = JSON.parse(writeCall![1]);
    expect(config.newFilenameTemplate).toBe('{{yyyy}}-{{mm}}-{{dd}}-{{title}}.md');
    expect(config.docsDirs).toEqual(['docs', 'guides']);
  });

  it('does not write workspace configuration in init', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    const writeCall = findWriteCall(deps.fsApi.writeFile, 'cli.config.json');
    expect(writeCall).toBeDefined();

    const config = JSON.parse(writeCall![1]);
    expect(config.workspaces).toBeUndefined();
    expect(config.defaultWorkspace).toBeUndefined();
  });

  it('logs success message', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('Project initialization completed'));
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

    const writeCall = findWriteCall(deps.fsApi.writeFile, 'cli.config.json');
    expect(writeCall).toBeDefined();

    const config = JSON.parse(writeCall![1]);
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

  it('writes default template file with frontmatter content', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    const writeCall = findWriteCall(deps.fsApi.writeFile, 'default-new-file.md');
    expect(writeCall).toBeDefined();
    expect(writeCall![0]).toBe('/project/.hackersheet/templates/default-new-file.md');
    expect(writeCall![1]).toContain('draft: true');
    expect(writeCall![1]).toContain('title: {{title}}');
    expect(writeCall![1]).toContain('published_at: {{datetime}}');
  });

  it('auto-sets newFileTemplatePath in config', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    const writeCall = findWriteCall(deps.fsApi.writeFile, 'cli.config.json');
    expect(writeCall).toBeDefined();

    const config = JSON.parse(writeCall![1]);
    expect(config.newFileTemplatePath).toBe('.hackersheet/templates/default-new-file.md');
  });

  it('creates docsDirs directories', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    expect(deps.fsApi.mkdir).toHaveBeenCalledWith('/project/docs', { recursive: true });
    expect(deps.fsApi.mkdir).toHaveBeenCalledWith('/project/guides', { recursive: true });
  });

  it('logs step-by-step progress messages', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    const logCalls = vi.mocked(deps.logger.log).mock.calls.map((call) => call[0] as string);

    expect(logCalls.some((msg) => msg.includes('Setting up project structure'))).toBe(true);
    expect(logCalls.some((msg) => msg.includes('Created') && msg.includes('.hackersheet/'))).toBe(true);
    expect(logCalls.some((msg) => msg.includes('Created') && msg.includes('trees/'))).toBe(true);
    expect(logCalls.some((msg) => msg.includes('Created') && msg.includes('templates/'))).toBe(true);
    expect(logCalls.some((msg) => msg.includes('Created') && msg.includes('default-new-file.md'))).toBe(true);
    expect(logCalls.some((msg) => msg.includes('Created') && msg.includes('assets/'))).toBe(true);
    expect(logCalls.some((msg) => msg.includes('Created') && msg.includes('cli.config.json'))).toBe(true);
    expect(logCalls.some((msg) => msg.includes('Created') && msg.includes('README.md'))).toBe(true);
    expect(logCalls.some((msg) => msg.includes('Created') && msg.includes('.gitignore'))).toBe(true);
    expect(logCalls.some((msg) => msg.includes('Created') && msg.includes('.hsignore'))).toBe(true);
  });

  it('logs next step guidance message', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('hscli new'));
  });

  it('creates README.md with getting started content', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    const writeCall = findWriteCall(deps.fsApi.writeFile, 'README.md');
    expect(writeCall).toBeDefined();
    expect(writeCall![0]).toBe('/project/README.md');
    expect(writeCall![1]).toContain('# Hacker Sheet');
    expect(writeCall![1]).toContain('hscli new');
    expect(writeCall![1]).toContain('git init');
  });

  it('creates empty .gitignore', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    const writeCall = findWriteCall(deps.fsApi.writeFile, '.gitignore');
    expect(writeCall).toBeDefined();
    expect(writeCall![0]).toBe('/project/.gitignore');
    expect(writeCall![1]).toBe('');
  });

  it('creates .hsignore with whitelist rules based on docsDirs', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    const writeCall = findWriteCall(deps.fsApi.writeFile, '.hsignore');
    expect(writeCall).toBeDefined();
    expect(writeCall![0]).toBe('/project/.hsignore');

    const content = writeCall![1];
    // Markdown whitelist
    expect(content).toContain('*.md');
    expect(content).toContain('!docs/**/*.md');
    expect(content).toContain('!guides/**/*.md');
    // Image whitelist
    expect(content).toContain('*.png');
    expect(content).toContain('*.jpg');
    expect(content).toContain('!assets/**');
  });

  it('creates assets directory with .keep file', async () => {
    const deps = createMockDeps();

    await initAction(deps);

    expect(deps.fsApi.mkdir).toHaveBeenCalledWith('/project/assets', { recursive: true });

    const writeCall = findWriteCall(deps.fsApi.writeFile, 'assets/.keep');
    expect(writeCall).toBeDefined();
    expect(writeCall![0]).toBe('/project/assets/.keep');
    expect(writeCall![1]).toBe('');
  });

  it('creates default docs directory when docsDirs is empty', async () => {
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

    expect(deps.fsApi.mkdir).toHaveBeenCalledWith('/project/docs', { recursive: true });
  });
});
