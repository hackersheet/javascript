import { describe, it, expect, vi, beforeEach } from 'vitest';

import { configPathAction, type ConfigPathActionDeps } from '../config-path-action';

describe('configPathAction', () => {
  const createMockDeps = (overrides: Partial<ConfigPathActionDeps> = {}): ConfigPathActionDeps => ({
    logger: { log: vi.fn() },
    getUserConfigPath: vi.fn().mockReturnValue('/home/user/.config/hackersheet/cli.config.json'),
    getProjectConfigPath: vi.fn().mockReturnValue('/project/.hackersheet/cli.config.json'),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays both paths by default', async () => {
    const deps = createMockDeps();

    await configPathAction({}, deps);

    expect(deps.logger.log).toHaveBeenCalledWith(
      'User:    /home/user/.config/hackersheet/cli.config.json'
    );
    expect(deps.logger.log).toHaveBeenCalledWith(
      'Project: /project/.hackersheet/cli.config.json'
    );
  });

  it('displays only user path with --global option', async () => {
    const deps = createMockDeps();

    await configPathAction({ global: true }, deps);

    expect(deps.logger.log).toHaveBeenCalledTimes(1);
    expect(deps.logger.log).toHaveBeenCalledWith(
      '/home/user/.config/hackersheet/cli.config.json'
    );
  });

  it('displays only project path with --local option', async () => {
    const deps = createMockDeps();

    await configPathAction({ local: true }, deps);

    expect(deps.logger.log).toHaveBeenCalledTimes(1);
    expect(deps.logger.log).toHaveBeenCalledWith(
      '/project/.hackersheet/cli.config.json'
    );
  });

  it('displays "(not found)" when project config path is null', async () => {
    const deps = createMockDeps({
      getProjectConfigPath: vi.fn().mockReturnValue(null),
    });

    await configPathAction({}, deps);

    expect(deps.logger.log).toHaveBeenCalledWith('Project: (not found)');
  });

  it('displays "(not found)" with --local when project config is null', async () => {
    const deps = createMockDeps({
      getProjectConfigPath: vi.fn().mockReturnValue(null),
    });

    await configPathAction({ local: true }, deps);

    expect(deps.logger.log).toHaveBeenCalledWith('(not found)');
  });
});
