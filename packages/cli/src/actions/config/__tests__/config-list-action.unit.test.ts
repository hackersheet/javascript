import { describe, it, expect, vi, beforeEach } from 'vitest';

import { configListAction, type ConfigListActionDeps } from '../config-list-action';

describe('configListAction', () => {
  const mockConfig = {
    workspaces: {
      'my-workspace': { accessKey: 'sk-xxx' },
    },
    defaultWorkspace: 'my-workspace',
    newFilenameTemplate: '{{yyyy}}-{{title}}.md',
    docsDirs: ['docs', 'guides'],
  };

  const createMockDeps = (overrides: Partial<ConfigListActionDeps> = {}): ConfigListActionDeps => ({
    logger: { log: vi.fn() },
    loadUserConfig: vi.fn().mockReturnValue({}),
    loadProjectConfig: vi.fn().mockReturnValue(mockConfig),
    loadConfig: vi.fn().mockReturnValue(mockConfig),
    getUserConfigPath: vi.fn().mockReturnValue('/home/user/.config/hackersheet/cli.config.json'),
    getProjectConfigPath: vi.fn().mockReturnValue('/project/.hackersheet/cli.config.json'),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays merged configuration by default', async () => {
    const deps = createMockDeps();

    await configListAction({}, deps);

    expect(deps.loadConfig).toHaveBeenCalled();
    expect(deps.logger.log).toHaveBeenCalledWith('');
    expect(deps.logger.log).toHaveBeenCalledWith('Configuration (merged):');
  });

  it('displays user configuration with --global option', async () => {
    const deps = createMockDeps();

    await configListAction({ global: true }, deps);

    expect(deps.loadUserConfig).toHaveBeenCalled();
    expect(deps.logger.log).toHaveBeenCalledWith('User configuration:');
  });

  it('displays project configuration with --local option', async () => {
    const deps = createMockDeps();

    await configListAction({ local: true }, deps);

    expect(deps.loadProjectConfig).toHaveBeenCalled();
    expect(deps.logger.log).toHaveBeenCalledWith('Project configuration:');
  });

  it('outputs JSON with --json option', async () => {
    const deps = createMockDeps();

    await configListAction({ json: true }, deps);

    expect(deps.logger.log).toHaveBeenCalledWith(JSON.stringify(mockConfig, null, 2));
  });

  it('outputs JSON for user config with --json and --global options', async () => {
    const userConfig = { defaultWorkspace: 'user-workspace' };
    const deps = createMockDeps({
      loadUserConfig: vi.fn().mockReturnValue(userConfig),
    });

    await configListAction({ json: true, global: true }, deps);

    expect(deps.loadUserConfig).toHaveBeenCalled();
    expect(deps.logger.log).toHaveBeenCalledWith(JSON.stringify(userConfig, null, 2));
  });

  it('displays config file paths', async () => {
    const deps = createMockDeps();

    await configListAction({}, deps);

    expect(deps.logger.log).toHaveBeenCalledWith('Config files:');
    expect(deps.logger.log).toHaveBeenCalledWith('  User:    /home/user/.config/hackersheet/cli.config.json');
    expect(deps.logger.log).toHaveBeenCalledWith('  Project: /project/.hackersheet/cli.config.json');
  });

  it('displays "(not found)" when project config path is null', async () => {
    const deps = createMockDeps({
      getProjectConfigPath: vi.fn().mockReturnValue(null),
    });

    await configListAction({}, deps);

    expect(deps.logger.log).toHaveBeenCalledWith('  Project: (not found)');
  });

  it('displays workspaces with default marker', async () => {
    const deps = createMockDeps();

    await configListAction({}, deps);

    expect(deps.logger.log).toHaveBeenCalledWith('Workspaces:');
    expect(deps.logger.log).toHaveBeenCalledWith('  my-workspace (default)');
  });

  it('displays "(no configuration set)" for empty config', async () => {
    const deps = createMockDeps({
      loadConfig: vi.fn().mockReturnValue({ workspaces: {} }),
    });

    await configListAction({}, deps);

    expect(deps.logger.log).toHaveBeenCalledWith('  (no configuration set)');
  });

  it('formats array values as comma-separated', async () => {
    const deps = createMockDeps();

    await configListAction({}, deps);

    expect(deps.logger.log).toHaveBeenCalledWith('  docsDirs = docs, guides');
  });
});
