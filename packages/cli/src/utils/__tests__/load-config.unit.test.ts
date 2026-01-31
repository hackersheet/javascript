import fs from 'fs';

import { findUpSync } from 'find-up';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { loadConfig, ConfigError } from '../load-config';

vi.mock('find-up', () => ({
  findUpSync: vi.fn(),
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

describe('loadConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty config when .hackersheet directory not found', () => {
    vi.mocked(findUpSync).mockReturnValue(undefined);

    const result = loadConfig();

    expect(result).toEqual({
      workspaceSlug: '',
      workspaceAccessKey: '',
      newFilenameTemplate: '',
      docsDirs: [],
    });
  });

  it('returns empty config when cli.config.json does not exist', () => {
    vi.mocked(findUpSync).mockReturnValue('/project/.hackersheet');
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = loadConfig();

    expect(result).toEqual({
      workspaceSlug: '',
      workspaceAccessKey: '',
      newFilenameTemplate: '',
      docsDirs: [],
    });
  });

  it('parses valid configuration file', () => {
    vi.mocked(findUpSync).mockReturnValue('/project/.hackersheet');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        workspaceSlug: 'my-workspace',
        workspaceAccessKey: 'secret-key',
        newFilenameTemplate: '{{yyyy}}-{{title}}.md',
        newFileTemplatePath: 'templates/doc.md',
        docsDirs: ['docs', 'guides'],
      })
    );

    const result = loadConfig();

    expect(result).toEqual({
      workspaceSlug: 'my-workspace',
      workspaceAccessKey: 'secret-key',
      newFilenameTemplate: '{{yyyy}}-{{title}}.md',
      newFileTemplatePath: 'templates/doc.md',
      docsDirs: ['docs', 'guides'],
    });
  });

  it('throws ConfigError for invalid JSON', () => {
    vi.mocked(findUpSync).mockReturnValue('/project/.hackersheet');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('{ invalid json }');

    expect(() => loadConfig()).toThrow(ConfigError);
    expect(() => loadConfig()).toThrow(/Invalid JSON/);
  });

  it('throws ConfigError when config is not an object', () => {
    vi.mocked(findUpSync).mockReturnValue('/project/.hackersheet');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('"string value"');

    expect(() => loadConfig()).toThrow(ConfigError);
    expect(() => loadConfig()).toThrow(/expected object/);
  });

  it('provides default values for missing fields', () => {
    vi.mocked(findUpSync).mockReturnValue('/project/.hackersheet');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('{}');

    const result = loadConfig();

    expect(result).toEqual({
      workspaceSlug: '',
      workspaceAccessKey: '',
      newFilenameTemplate: '',
      newFileTemplatePath: undefined,
      docsDirs: [],
    });
  });

  it('filters non-string values from docsDirs', () => {
    vi.mocked(findUpSync).mockReturnValue('/project/.hackersheet');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        docsDirs: ['docs', 123, null, 'guides', { dir: 'obj' }],
      })
    );

    const result = loadConfig();

    expect(result.docsDirs).toEqual(['docs', 'guides']);
  });

  it('ignores non-string newFileTemplatePath', () => {
    vi.mocked(findUpSync).mockReturnValue('/project/.hackersheet');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        newFileTemplatePath: 123,
      })
    );

    const result = loadConfig();

    expect(result.newFileTemplatePath).toBeUndefined();
  });

  it('includes configPath in ConfigError', () => {
    vi.mocked(findUpSync).mockReturnValue('/project/.hackersheet');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('invalid');

    try {
      loadConfig();
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect((err as ConfigError).configPath).toBe('/project/.hackersheet/cli.config.json');
    }
  });
});
