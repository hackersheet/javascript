import { describe, it, expect, vi, beforeEach } from 'vitest';

import { configGetAction, type ConfigGetActionDeps } from '../config-get-action';

describe('configGetAction', () => {
  const mockConfig = {
    workspaces: {
      'my-workspace': { accessKey: 'sk-xxx' },
    },
    defaultWorkspace: 'my-workspace',
    newFilenameTemplate: '{{yyyy}}-{{title}}.md',
    docsDirs: ['docs', 'guides'],
  };

  const createMockDeps = (overrides: Partial<ConfigGetActionDeps> = {}): ConfigGetActionDeps => ({
    logger: { log: vi.fn(), error: vi.fn() },
    loadUserConfig: vi.fn().mockReturnValue({}),
    loadProjectConfig: vi.fn().mockReturnValue(mockConfig),
    loadConfig: vi.fn().mockReturnValue(mockConfig),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets a simple key value', async () => {
    const deps = createMockDeps();

    await configGetAction('defaultWorkspace', {}, deps);

    expect(deps.logger.log).toHaveBeenCalledWith('my-workspace');
  });

  it('gets a nested key value using dot notation', async () => {
    const deps = createMockDeps();

    await configGetAction('workspaces.my-workspace.accessKey', {}, deps);

    expect(deps.logger.log).toHaveBeenCalledWith('sk-xxx');
  });

  it('formats array values as comma-separated', async () => {
    const deps = createMockDeps();

    await configGetAction('docsDirs', {}, deps);

    expect(deps.logger.log).toHaveBeenCalledWith('docs, guides');
  });

  it('displays error when key is not found', async () => {
    const deps = createMockDeps();

    await configGetAction('nonExistentKey', {}, deps);

    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('Key not found'));
    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('nonExistentKey'));
    expect(deps.logger.log).not.toHaveBeenCalled();
  });

  it('gets value from user config with --global option', async () => {
    const deps = createMockDeps({
      loadUserConfig: vi.fn().mockReturnValue({ defaultWorkspace: 'user-workspace' }),
    });

    await configGetAction('defaultWorkspace', { global: true }, deps);

    expect(deps.loadUserConfig).toHaveBeenCalled();
    expect(deps.logger.log).toHaveBeenCalledWith('user-workspace');
  });

  it('gets value from project config with --local option', async () => {
    const deps = createMockDeps();

    await configGetAction('defaultWorkspace', { local: true }, deps);

    expect(deps.loadProjectConfig).toHaveBeenCalled();
    expect(deps.logger.log).toHaveBeenCalledWith('my-workspace');
  });

  it('gets value from merged config by default', async () => {
    const deps = createMockDeps();

    await configGetAction('defaultWorkspace', {}, deps);

    expect(deps.loadConfig).toHaveBeenCalled();
  });

  it('formats object values as JSON', async () => {
    const deps = createMockDeps();

    await configGetAction('workspaces.my-workspace', {}, deps);

    expect(deps.logger.log).toHaveBeenCalledWith(JSON.stringify({ accessKey: 'sk-xxx' }, null, 2));
  });

  it('handles deeply nested keys that do not exist', async () => {
    const deps = createMockDeps();

    await configGetAction('workspaces.nonexistent.accessKey', {}, deps);

    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('Key not found'));
    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('workspaces.nonexistent.accessKey'));
  });
});
