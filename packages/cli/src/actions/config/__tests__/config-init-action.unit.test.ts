import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  configInitAction,
  runConfigWizard,
  type ConfigInitActionDeps,
} from '../config-init-action';

describe('runConfigWizard', () => {
  const createMockDeps = (overrides: Partial<ConfigInitActionDeps> = {}): Partial<ConfigInitActionDeps> => ({
    fsApi: {
      mkdir: vi.fn().mockResolvedValue(undefined),
      access: vi.fn().mockRejectedValue(new Error('ENOENT')),
    },
    prompts: {
      input: vi.fn().mockImplementation(({ message }) => {
        if (message.includes('slug')) return Promise.resolve('my-workspace');
        if (message.includes('access key')) return Promise.resolve('sk-xxx');
        if (message.includes('template')) return Promise.resolve('{{yyyy}}-{{title}}.md');
        if (message.includes('directories')) return Promise.resolve('docs, guides');
        return Promise.resolve('');
      }),
      confirm: vi.fn().mockResolvedValue(true),
    },
    logger: { log: vi.fn() },
    loadConfigFromPath: vi.fn().mockReturnValue(null),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns configuration from user input', async () => {
    const deps = createMockDeps();

    const result = await runConfigWizard('/project/.hackersheet/cli.config.json', deps);

    expect(result.cancelled).toBe(false);
    expect(result.config.defaultWorkspace).toBe('my-workspace');
    expect(result.config.workspaces).toEqual({
      'my-workspace': { accessKey: 'sk-xxx' },
    });
    expect(result.config.newFilenameTemplate).toBe('{{yyyy}}-{{title}}.md');
    expect(result.config.docsDirs).toEqual(['docs', 'guides']);
  });

  it('prompts for overwrite when config exists', async () => {
    const deps = createMockDeps({
      fsApi: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        access: vi.fn().mockResolvedValue(undefined), // file exists
      },
    });

    await runConfigWizard('/project/.hackersheet/cli.config.json', deps);

    expect(deps.prompts!.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Configuration file already exists. Overwrite?',
      })
    );
  });

  it('returns cancelled when user declines overwrite', async () => {
    const deps = createMockDeps({
      fsApi: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        access: vi.fn().mockResolvedValue(undefined),
      },
      prompts: {
        input: vi.fn(),
        confirm: vi.fn().mockResolvedValue(false),
      },
    });

    const result = await runConfigWizard('/project/.hackersheet/cli.config.json', deps);

    expect(result.cancelled).toBe(true);
    expect(deps.prompts!.input).not.toHaveBeenCalled();
  });

  it('uses existing config values as defaults', async () => {
    const existingConfig = {
      defaultWorkspace: 'existing-workspace',
      workspaces: { 'existing-workspace': { accessKey: 'sk-existing' } },
      newFilenameTemplate: '{{title}}.md',
      docsDirs: ['existing-docs'],
    };
    const deps = createMockDeps({
      loadConfigFromPath: vi.fn().mockReturnValue(existingConfig),
    });

    await runConfigWizard('/project/.hackersheet/cli.config.json', deps);

    expect(deps.prompts!.input).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('slug'),
        default: 'existing-workspace',
      })
    );
  });

  it('uses custom confirm message when provided', async () => {
    const deps = createMockDeps({
      fsApi: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        access: vi.fn().mockResolvedValue(undefined),
      },
    });

    await runConfigWizard('/project/.hackersheet/cli.config.json', deps, {
      confirmMessage: 'Custom confirm message',
    });

    expect(deps.prompts!.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Custom confirm message',
      })
    );
  });

  it('uses custom header message when provided', async () => {
    const deps = createMockDeps();

    await runConfigWizard('/project/.hackersheet/cli.config.json', deps, {
      headerMessage: 'Custom header',
    });

    expect(deps.logger!.log).toHaveBeenCalledWith('Custom header');
  });

  it('does not set workspace when only slug is provided', async () => {
    const deps = createMockDeps({
      prompts: {
        input: vi.fn().mockImplementation(({ message }) => {
          if (message.includes('slug')) return Promise.resolve('my-workspace');
          if (message.includes('access key')) return Promise.resolve('');
          if (message.includes('template')) return Promise.resolve('');
          if (message.includes('directories')) return Promise.resolve('docs');
          return Promise.resolve('');
        }),
        confirm: vi.fn().mockResolvedValue(true),
      },
    });

    const result = await runConfigWizard('/project/.hackersheet/cli.config.json', deps);

    expect(result.config.workspaces).toEqual({});
    expect(result.config.defaultWorkspace).toBeUndefined();
  });

  it('uses default values when empty input is provided', async () => {
    const deps = createMockDeps({
      prompts: {
        input: vi.fn().mockResolvedValue(''),
        confirm: vi.fn().mockResolvedValue(true),
      },
    });

    const result = await runConfigWizard('/project/.hackersheet/cli.config.json', deps);

    expect(result.config.newFilenameTemplate).toBe('{{yyyy}}-{{mm}}-{{dd}}-{{title}}.md');
    expect(result.config.docsDirs).toEqual(['docs']);
  });
});

describe('configInitAction', () => {
  const createMockDeps = (overrides: Partial<ConfigInitActionDeps> = {}): Partial<ConfigInitActionDeps> => ({
    fsApi: {
      mkdir: vi.fn().mockResolvedValue(undefined),
      access: vi.fn().mockRejectedValue(new Error('ENOENT')),
    },
    prompts: {
      input: vi.fn().mockImplementation(({ message }) => {
        if (message.includes('slug')) return Promise.resolve('my-workspace');
        if (message.includes('access key')) return Promise.resolve('sk-xxx');
        if (message.includes('template')) return Promise.resolve('{{yyyy}}-{{title}}.md');
        if (message.includes('directories')) return Promise.resolve('docs');
        return Promise.resolve('');
      }),
      confirm: vi.fn().mockResolvedValue(true),
    },
    logger: { log: vi.fn() },
    getUserConfigPath: vi.fn().mockReturnValue('/home/user/.config/hackersheet/cli.config.json'),
    getProjectConfigPath: vi.fn().mockReturnValue('/project/.hackersheet/cli.config.json'),
    loadConfigFromPath: vi.fn().mockReturnValue(null),
    saveConfig: vi.fn().mockResolvedValue(undefined),
    cwd: vi.fn().mockReturnValue('/project'),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes project config by default', async () => {
    const deps = createMockDeps();

    await configInitAction({}, deps);

    expect(deps.saveConfig).toHaveBeenCalled();
    expect(deps.logger!.log).toHaveBeenCalledWith(
      expect.stringContaining('Project configuration initialized')
    );
  });

  it('initializes user config with --global option', async () => {
    const deps = createMockDeps();

    await configInitAction({ global: true }, deps);

    expect(deps.logger!.log).toHaveBeenCalledWith(
      expect.stringContaining('User configuration initialized')
    );
  });

  it('creates directory before saving', async () => {
    const deps = createMockDeps();

    await configInitAction({}, deps);

    expect(deps.fsApi!.mkdir).toHaveBeenCalledWith('/project/.hackersheet', { recursive: true });
  });

  it('does not save when wizard is cancelled', async () => {
    const deps = createMockDeps({
      fsApi: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        access: vi.fn().mockResolvedValue(undefined),
      },
      prompts: {
        input: vi.fn(),
        confirm: vi.fn().mockResolvedValue(false),
      },
    });

    await configInitAction({}, deps);

    expect(deps.saveConfig).not.toHaveBeenCalled();
  });

  it('uses cwd when project config path is not found', async () => {
    const deps = createMockDeps({
      getProjectConfigPath: vi.fn().mockReturnValue(null),
    });

    await configInitAction({}, deps);

    expect(deps.fsApi!.mkdir).toHaveBeenCalledWith('/project/.hackersheet', { recursive: true });
  });
});
