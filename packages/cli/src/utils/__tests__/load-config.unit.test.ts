import fs from 'fs';

import { findUpSync } from 'find-up';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  loadConfig,
  loadConfigFromPath,
  loadUserConfig,
  loadProjectConfig,
  getUserConfigPath,
  ConfigError,
  EMPTY_CONFIG,
} from '../load-config';

vi.mock('find-up', () => ({
  findUpSync: vi.fn(),
}));

vi.mock('env-paths', () => ({
  default: vi.fn(() => ({
    config: '/home/user/.config/hackersheet',
    data: '/home/user/.local/share/hackersheet',
    cache: '/home/user/.cache/hackersheet',
    log: '/home/user/.local/state/hackersheet',
    temp: '/tmp/hackersheet',
  })),
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

describe('getUserConfigPath', () => {
  it('returns the user config path', () => {
    const result = getUserConfigPath();
    expect(result).toBe('/home/user/.config/hackersheet/cli.config.json');
  });
});

describe('loadConfigFromPath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = loadConfigFromPath('/some/path/cli.config.json');

    expect(result).toBeNull();
  });

  it('parses valid configuration file', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        workspaceSlug: 'my-workspace',
        workspaceAccessKey: 'secret-key',
      })
    );

    const result = loadConfigFromPath('/some/path/cli.config.json');

    expect(result).toEqual({
      workspaceSlug: 'my-workspace',
      workspaceAccessKey: 'secret-key',
    });
  });

  it('throws ConfigError for invalid JSON', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('{ invalid json }');

    expect(() => loadConfigFromPath('/some/path/cli.config.json')).toThrow(ConfigError);
    expect(() => loadConfigFromPath('/some/path/cli.config.json')).toThrow(/Invalid JSON/);
  });

  it('throws ConfigError when config is not an object', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('"string value"');

    expect(() => loadConfigFromPath('/some/path/cli.config.json')).toThrow(ConfigError);
    expect(() => loadConfigFromPath('/some/path/cli.config.json')).toThrow(/expected object/);
  });
});

describe('loadUserConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty object when user config does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = loadUserConfig();

    expect(result).toEqual({});
  });

  it('loads user configuration from user config path', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        workspaceSlug: 'user-workspace',
        workspaceAccessKey: 'user-key',
      })
    );

    const result = loadUserConfig();

    expect(result).toEqual({
      workspaceSlug: 'user-workspace',
      workspaceAccessKey: 'user-key',
    });
    expect(fs.existsSync).toHaveBeenCalledWith('/home/user/.config/hackersheet/cli.config.json');
  });
});

describe('loadProjectConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty object when .hackersheet directory not found', () => {
    vi.mocked(findUpSync).mockReturnValue(undefined);

    const result = loadProjectConfig();

    expect(result).toEqual({});
  });

  it('returns empty object when cli.config.json does not exist', () => {
    vi.mocked(findUpSync).mockReturnValue('/project/.hackersheet');
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = loadProjectConfig();

    expect(result).toEqual({});
  });

  it('loads project configuration', () => {
    vi.mocked(findUpSync).mockReturnValue('/project/.hackersheet');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        workspaceSlug: 'project-workspace',
        docsDirs: ['docs'],
      })
    );

    const result = loadProjectConfig();

    expect(result).toEqual({
      workspaceSlug: 'project-workspace',
      docsDirs: ['docs'],
    });
  });
});

describe('loadConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty config when neither user nor project config exists', () => {
    vi.mocked(findUpSync).mockReturnValue(undefined);
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = loadConfig();

    expect(result).toEqual(EMPTY_CONFIG);
  });

  it('returns user config when only user config exists', () => {
    vi.mocked(findUpSync).mockReturnValue(undefined);
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      return p === '/home/user/.config/hackersheet/cli.config.json';
    });
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        workspaceSlug: 'user-workspace',
        workspaceAccessKey: 'user-key',
        newFilenameTemplate: 'user-template',
        docsDirs: ['user-docs'],
      })
    );

    const result = loadConfig();

    expect(result).toEqual({
      workspaceSlug: 'user-workspace',
      workspaceAccessKey: 'user-key',
      newFilenameTemplate: 'user-template',
      docsDirs: ['user-docs'],
    });
  });

  it('returns project config when only project config exists', () => {
    vi.mocked(findUpSync).mockReturnValue('/project/.hackersheet');
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      return p === '/project/.hackersheet/cli.config.json';
    });
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        workspaceSlug: 'project-workspace',
        workspaceAccessKey: 'project-key',
        newFilenameTemplate: 'project-template',
        docsDirs: ['project-docs'],
      })
    );

    const result = loadConfig();

    expect(result).toEqual({
      workspaceSlug: 'project-workspace',
      workspaceAccessKey: 'project-key',
      newFilenameTemplate: 'project-template',
      docsDirs: ['project-docs'],
    });
  });

  it('merges user and project configs with project taking precedence', () => {
    vi.mocked(findUpSync).mockReturnValue('/project/.hackersheet');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation((p) => {
      if (p === '/home/user/.config/hackersheet/cli.config.json') {
        return JSON.stringify({
          workspaceSlug: 'user-workspace',
          workspaceAccessKey: 'user-key',
          newFilenameTemplate: 'user-template',
          newFileTemplatePath: 'user-path',
          docsDirs: ['user-docs'],
        });
      }
      return JSON.stringify({
        workspaceSlug: 'project-workspace',
        docsDirs: ['project-docs'],
      });
    });

    const result = loadConfig();

    expect(result).toEqual({
      workspaceSlug: 'project-workspace',
      workspaceAccessKey: 'user-key',
      newFilenameTemplate: 'user-template',
      newFileTemplatePath: 'user-path',
      docsDirs: ['project-docs'],
    });
  });

  it('filters non-string values from docsDirs', () => {
    vi.mocked(findUpSync).mockReturnValue('/project/.hackersheet');
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      return p === '/project/.hackersheet/cli.config.json';
    });
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        docsDirs: ['docs', 123, null, 'guides', { dir: 'obj' }],
      })
    );

    const result = loadConfig();

    expect(result.docsDirs).toEqual(['docs', 'guides']);
  });

  it('includes configPath in ConfigError for project config', () => {
    vi.mocked(findUpSync).mockReturnValue('/project/.hackersheet');
    vi.mocked(fs.existsSync).mockImplementation((p) => {
      return p === '/project/.hackersheet/cli.config.json';
    });
    vi.mocked(fs.readFileSync).mockReturnValue('invalid');

    try {
      loadConfig();
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect((err as ConfigError).configPath).toBe('/project/.hackersheet/cli.config.json');
    }
  });

  it('includes configPath in ConfigError for user config', () => {
    vi.mocked(findUpSync).mockReturnValue(undefined);
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('invalid');

    try {
      loadConfig();
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect((err as ConfigError).configPath).toBe('/home/user/.config/hackersheet/cli.config.json');
    }
  });
});
