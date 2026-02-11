import { describe, it, expect, vi, beforeEach } from 'vitest';

import { configSetAction, type ConfigSetActionDeps } from '../config-set-action';

describe('configSetAction', () => {
  const createMockDeps = (overrides: Partial<ConfigSetActionDeps> = {}): ConfigSetActionDeps => ({
    logger: { log: vi.fn(), error: vi.fn() },
    getUserConfigPath: vi.fn().mockReturnValue('/home/user/.config/hackersheet/cli.config.json'),
    getProjectConfigPath: vi.fn().mockReturnValue('/project/.hackersheet/cli.config.json'),
    updateConfigKey: vi.fn().mockResolvedValue(undefined),
    cwd: vi.fn().mockReturnValue('/project'),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets a value in project config by default', async () => {
    const deps = createMockDeps();

    await configSetAction('newFilenameTemplate', '{{title}}.md', {}, deps);

    expect(deps.updateConfigKey).toHaveBeenCalledWith(
      '/project/.hackersheet/cli.config.json',
      'newFilenameTemplate',
      '{{title}}.md'
    );
    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('Updated'));
    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('newFilenameTemplate'));
    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('project configuration'));
  });

  it('sets a value in user config with --global option', async () => {
    const deps = createMockDeps();

    await configSetAction('defaultWorkspace', 'new-workspace', { global: true }, deps);

    expect(deps.updateConfigKey).toHaveBeenCalledWith(
      '/home/user/.config/hackersheet/cli.config.json',
      'defaultWorkspace',
      'new-workspace'
    );
    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('Updated'));
    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('defaultWorkspace'));
    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('user configuration'));
  });

  it('parses docsDirs as array from comma-separated value', async () => {
    const deps = createMockDeps();

    await configSetAction('docsDirs', 'docs, guides, tutorials', {}, deps);

    expect(deps.updateConfigKey).toHaveBeenCalledWith('/project/.hackersheet/cli.config.json', 'docsDirs', [
      'docs',
      'guides',
      'tutorials',
    ]);
  });

  it('filters empty values when parsing array', async () => {
    const deps = createMockDeps();

    await configSetAction('docsDirs', 'docs,  , guides', {}, deps);

    expect(deps.updateConfigKey).toHaveBeenCalledWith('/project/.hackersheet/cli.config.json', 'docsDirs', [
      'docs',
      'guides',
    ]);
  });

  it('uses cwd when project config path is not found', async () => {
    const deps = createMockDeps({
      getProjectConfigPath: vi.fn().mockReturnValue(null),
    });

    await configSetAction('newFilenameTemplate', '{{title}}.md', {}, deps);

    expect(deps.updateConfigKey).toHaveBeenCalledWith(
      '/project/.hackersheet/cli.config.json',
      'newFilenameTemplate',
      '{{title}}.md'
    );
  });

  it('keeps string value as-is for non-array keys', async () => {
    const deps = createMockDeps();

    await configSetAction('newFilenameTemplate', '{{title}}.md', {}, deps);

    expect(deps.updateConfigKey).toHaveBeenCalledWith(
      '/project/.hackersheet/cli.config.json',
      'newFilenameTemplate',
      '{{title}}.md'
    );
  });

  it('rejects workspaces key in project config', async () => {
    const deps = createMockDeps();

    await configSetAction('workspaces', 'value', {}, deps);

    expect(deps.updateConfigKey).not.toHaveBeenCalled();
    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('can only be set in user configuration'));
    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('--global'));
  });

  it('rejects defaultWorkspace key in project config', async () => {
    const deps = createMockDeps();

    await configSetAction('defaultWorkspace', 'my-workspace', {}, deps);

    expect(deps.updateConfigKey).not.toHaveBeenCalled();
    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('can only be set in user configuration'));
  });

  it('rejects workspaces nested key in project config', async () => {
    const deps = createMockDeps();

    await configSetAction('workspaces.my-workspace.accessKey', 'sk-new', {}, deps);

    expect(deps.updateConfigKey).not.toHaveBeenCalled();
    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('can only be set in user configuration'));
  });

  it('allows workspaces key in user config with --global', async () => {
    const deps = createMockDeps();

    await configSetAction('workspaces.my-workspace.accessKey', 'sk-new', { global: true }, deps);

    expect(deps.updateConfigKey).toHaveBeenCalledWith(
      '/home/user/.config/hackersheet/cli.config.json',
      'workspaces.my-workspace.accessKey',
      'sk-new'
    );
  });

  it('allows defaultWorkspace key in user config with --global', async () => {
    const deps = createMockDeps();

    await configSetAction('defaultWorkspace', 'my-workspace', { global: true }, deps);

    expect(deps.updateConfigKey).toHaveBeenCalledWith(
      '/home/user/.config/hackersheet/cli.config.json',
      'defaultWorkspace',
      'my-workspace'
    );
  });
});
