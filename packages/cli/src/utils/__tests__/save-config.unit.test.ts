import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as loadConfig from '../load-config';
import { saveConfig, updateConfigKey, deleteConfigKey, type SaveConfigDeps } from '../save-config';

vi.mock('../load-config', async () => {
  const actual = await vi.importActual('../load-config');
  return {
    ...actual,
    loadConfigFromPath: vi.fn(),
  };
});

describe('saveConfig', () => {
  const createMockDeps = (): SaveConfigDeps => ({
    fsApi: {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue('{}'),
      access: vi.fn().mockResolvedValue(undefined),
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates parent directory before saving', async () => {
    const deps = createMockDeps();

    await saveConfig('/project/.hackersheet/cli.config.json', { defaultWorkspace: 'test' }, deps);

    expect(deps.fsApi.mkdir).toHaveBeenCalledWith('/project/.hackersheet', { recursive: true });
  });

  it('writes config as formatted JSON', async () => {
    const deps = createMockDeps();
    const config = { defaultWorkspace: 'test', docsDirs: ['docs'] };

    await saveConfig('/project/.hackersheet/cli.config.json', config, deps);

    expect(deps.fsApi.writeFile).toHaveBeenCalledWith(
      '/project/.hackersheet/cli.config.json',
      JSON.stringify(config, null, 2),
      'utf8'
    );
  });

  it('handles empty config', async () => {
    const deps = createMockDeps();

    await saveConfig('/project/.hackersheet/cli.config.json', {}, deps);

    expect(deps.fsApi.writeFile).toHaveBeenCalledWith(
      '/project/.hackersheet/cli.config.json',
      '{}',
      'utf8'
    );
  });
});

describe('updateConfigKey', () => {
  const createMockDeps = (): SaveConfigDeps => ({
    fsApi: {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue('{}'),
      access: vi.fn().mockResolvedValue(undefined),
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates a simple key', async () => {
    const deps = createMockDeps();
    vi.mocked(loadConfig.loadConfigFromPath).mockReturnValue({ docsDirs: ['docs'] });

    await updateConfigKey('/config.json', 'defaultWorkspace', 'test', deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const savedConfig = JSON.parse(writeCall[1] as string);
    expect(savedConfig.defaultWorkspace).toBe('test');
    expect(savedConfig.docsDirs).toEqual(['docs']);
  });

  it('updates a nested key using dot notation', async () => {
    const deps = createMockDeps();
    vi.mocked(loadConfig.loadConfigFromPath).mockReturnValue({
      workspaces: { existing: { accessKey: 'old' } },
    });

    await updateConfigKey('/config.json', 'workspaces.new-workspace.accessKey', 'sk-new', deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const savedConfig = JSON.parse(writeCall[1] as string);
    expect(savedConfig.workspaces['new-workspace'].accessKey).toBe('sk-new');
    expect(savedConfig.workspaces.existing.accessKey).toBe('old');
  });

  it('creates nested structure when it does not exist', async () => {
    const deps = createMockDeps();
    vi.mocked(loadConfig.loadConfigFromPath).mockReturnValue({});

    await updateConfigKey('/config.json', 'workspaces.my-workspace.accessKey', 'sk-xxx', deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const savedConfig = JSON.parse(writeCall[1] as string);
    expect(savedConfig.workspaces['my-workspace'].accessKey).toBe('sk-xxx');
  });

  it('creates config file if it does not exist', async () => {
    const deps = createMockDeps();
    vi.mocked(loadConfig.loadConfigFromPath).mockReturnValue(null);

    await updateConfigKey('/config.json', 'defaultWorkspace', 'test', deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const savedConfig = JSON.parse(writeCall[1] as string);
    expect(savedConfig.defaultWorkspace).toBe('test');
  });

  it('overwrites existing value', async () => {
    const deps = createMockDeps();
    vi.mocked(loadConfig.loadConfigFromPath).mockReturnValue({
      defaultWorkspace: 'old-value',
    });

    await updateConfigKey('/config.json', 'defaultWorkspace', 'new-value', deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const savedConfig = JSON.parse(writeCall[1] as string);
    expect(savedConfig.defaultWorkspace).toBe('new-value');
  });

  it('handles deeply nested keys', async () => {
    const deps = createMockDeps();
    vi.mocked(loadConfig.loadConfigFromPath).mockReturnValue({});

    await updateConfigKey('/config.json', 'a.b.c.d', 'deep-value', deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const savedConfig = JSON.parse(writeCall[1] as string);
    expect(savedConfig.a.b.c.d).toBe('deep-value');
  });
});

describe('deleteConfigKey', () => {
  const createMockDeps = (): SaveConfigDeps => ({
    fsApi: {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue('{}'),
      access: vi.fn().mockResolvedValue(undefined),
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a simple key', async () => {
    const deps = createMockDeps();
    vi.mocked(loadConfig.loadConfigFromPath).mockReturnValue({
      defaultWorkspace: 'test',
      docsDirs: ['docs'],
    });

    await deleteConfigKey('/config.json', 'defaultWorkspace', deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const savedConfig = JSON.parse(writeCall[1] as string);
    expect(savedConfig.defaultWorkspace).toBeUndefined();
    expect(savedConfig.docsDirs).toEqual(['docs']);
  });

  it('deletes a nested key', async () => {
    const deps = createMockDeps();
    vi.mocked(loadConfig.loadConfigFromPath).mockReturnValue({
      workspaces: {
        'my-workspace': { accessKey: 'sk-xxx' },
        'other-workspace': { accessKey: 'sk-yyy' },
      },
    });

    await deleteConfigKey('/config.json', 'workspaces.my-workspace', deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const savedConfig = JSON.parse(writeCall[1] as string);
    expect(savedConfig.workspaces['my-workspace']).toBeUndefined();
    expect(savedConfig.workspaces['other-workspace'].accessKey).toBe('sk-yyy');
  });

  it('handles non-existent nested path gracefully', async () => {
    const deps = createMockDeps();
    vi.mocked(loadConfig.loadConfigFromPath).mockReturnValue({
      defaultWorkspace: 'test',
    });

    await deleteConfigKey('/config.json', 'workspaces.nonexistent.accessKey', deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const savedConfig = JSON.parse(writeCall[1] as string);
    expect(savedConfig.defaultWorkspace).toBe('test');
  });

  it('handles empty config gracefully', async () => {
    const deps = createMockDeps();
    vi.mocked(loadConfig.loadConfigFromPath).mockReturnValue(null);

    await deleteConfigKey('/config.json', 'defaultWorkspace', deps);

    const writeCall = vi.mocked(deps.fsApi.writeFile).mock.calls[0];
    const savedConfig = JSON.parse(writeCall[1] as string);
    expect(savedConfig).toEqual({});
  });
});
