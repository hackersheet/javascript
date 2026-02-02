import { describe, it, expect, vi, beforeEach } from 'vitest';

import { configDeleteAction, type ConfigDeleteActionDeps } from '../config-delete-action';

describe('configDeleteAction', () => {
  const mockConfig = {
    workspaces: {
      'my-workspace': { accessKey: 'sk-xxx' },
    },
    defaultWorkspace: 'my-workspace',
    newFilenameTemplate: '{{yyyy}}-{{title}}.md',
    docsDirs: ['docs'],
  };

  const createMockDeps = (overrides: Partial<ConfigDeleteActionDeps> = {}): ConfigDeleteActionDeps => ({
    logger: { log: vi.fn(), error: vi.fn() },
    getUserConfigPath: vi.fn().mockReturnValue('/home/user/.config/hackersheet/cli.config.json'),
    getProjectConfigPath: vi.fn().mockReturnValue('/project/.hackersheet/cli.config.json'),
    loadConfigFromPath: vi.fn().mockReturnValue(mockConfig),
    deleteConfigKey: vi.fn().mockResolvedValue(undefined),
    cwd: vi.fn().mockReturnValue('/project'),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a key from project config by default', async () => {
    const deps = createMockDeps();

    await configDeleteAction('defaultWorkspace', {}, deps);

    expect(deps.deleteConfigKey).toHaveBeenCalledWith('/project/.hackersheet/cli.config.json', 'defaultWorkspace');
    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('Deleted'));
    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('defaultWorkspace'));
    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('project configuration'));
  });

  it('deletes a key from user config with --global option', async () => {
    const deps = createMockDeps();

    await configDeleteAction('defaultWorkspace', { global: true }, deps);

    expect(deps.deleteConfigKey).toHaveBeenCalledWith(
      '/home/user/.config/hackersheet/cli.config.json',
      'defaultWorkspace'
    );
    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('Deleted'));
    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('defaultWorkspace'));
    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('user configuration'));
  });

  it('displays error when config file is not found', async () => {
    const deps = createMockDeps({
      loadConfigFromPath: vi.fn().mockReturnValue(null),
    });

    await configDeleteAction('defaultWorkspace', {}, deps);

    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('Configuration file not found'));
    expect(deps.deleteConfigKey).not.toHaveBeenCalled();
  });

  it('displays error when key is not found in config', async () => {
    const deps = createMockDeps();

    await configDeleteAction('nonExistentKey', {}, deps);

    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('Key not found'));
    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('nonExistentKey'));
    expect(deps.deleteConfigKey).not.toHaveBeenCalled();
  });

  it('deletes nested key value', async () => {
    const deps = createMockDeps();

    await configDeleteAction('workspaces.my-workspace.accessKey', {}, deps);

    expect(deps.deleteConfigKey).toHaveBeenCalledWith(
      '/project/.hackersheet/cli.config.json',
      'workspaces.my-workspace.accessKey'
    );
  });

  it('uses cwd when project config path is not found', async () => {
    const deps = createMockDeps({
      getProjectConfigPath: vi.fn().mockReturnValue(null),
    });

    await configDeleteAction('defaultWorkspace', {}, deps);

    expect(deps.loadConfigFromPath).toHaveBeenCalledWith('/project/.hackersheet/cli.config.json');
  });

  it('displays error for nested key when parent does not exist', async () => {
    const deps = createMockDeps();

    await configDeleteAction('workspaces.nonexistent.accessKey', {}, deps);

    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('Key not found'));
    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('workspaces.nonexistent.accessKey'));
  });
});
