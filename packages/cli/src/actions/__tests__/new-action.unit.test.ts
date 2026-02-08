import { describe, it, expect, vi, beforeEach } from 'vitest';

import { newAction, type NewActionDeps } from '../new-action';

import type { Config } from '../../utils/load-config';

describe('newAction', () => {
  const createMockDeps = (overrides: Partial<NewActionDeps> = {}): NewActionDeps => ({
    fsApi: {
      mkdir: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue('---\ntitle: {{title}}\n---'),
      writeFile: vi.fn().mockResolvedValue(undefined),
    },
    prompts: {
      input: vi.fn().mockResolvedValue('Test Document'),
      select: vi.fn().mockResolvedValue('docs'),
    },
    logger: { log: vi.fn(), error: vi.fn() },
    loadConfigFn: vi.fn().mockReturnValue({
      workspaces: {},
      newFilenameTemplate: '{{yyyy}}-{{mm}}-{{dd}}-{{title}}.md',
      newFileTemplatePath: 'templates/doc.mustache',
      docsDirs: ['docs', 'guides'],
    } as Config),
    findRootFn: vi.fn().mockReturnValue('/project'),
    getDateFn: vi.fn().mockReturnValue(new Date(2024, 2, 15, 10, 30, 45)),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts for title and directory', async () => {
    const deps = createMockDeps();

    await newAction(deps);

    expect(deps.prompts.input).toHaveBeenCalledWith({ message: 'Enter title' });
    expect(deps.prompts.select).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Select directory',
        choices: [
          { name: 'docs', value: 'docs' },
          { name: 'guides', value: 'guides' },
        ],
      })
    );
  });

  it('creates directory if it does not exist', async () => {
    const deps = createMockDeps();

    await newAction(deps);

    expect(deps.fsApi.mkdir).toHaveBeenCalledWith('/project/docs', { recursive: true });
  });

  it('writes file with rendered template', async () => {
    const deps = createMockDeps();

    await newAction(deps);

    expect(deps.fsApi.writeFile).toHaveBeenCalledWith(
      '/project/docs/2024-03-15-Test-Document.md',
      '---\ntitle: Test Document\n---',
      { encoding: 'utf8', flag: 'wx' }
    );
  });

  it('logs success message with template path', async () => {
    const deps = createMockDeps();

    await newAction(deps);

    expect(deps.logger.log).toHaveBeenCalledWith(
      expect.stringContaining('Created file: /project/docs/2024-03-15-Test-Document.md')
    );
    expect(deps.logger.log).toHaveBeenCalledWith(expect.stringContaining('from /project/templates/doc.mustache'));
  });

  it('handles file already exists error', async () => {
    const deps = createMockDeps({
      fsApi: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn().mockResolvedValue(''),
        writeFile: vi.fn().mockRejectedValue({ code: 'EEXIST' }),
      },
    });

    await newAction(deps);

    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('File already exists'));
  });

  it('rethrows non-EEXIST errors', async () => {
    const deps = createMockDeps({
      fsApi: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn().mockResolvedValue(''),
        writeFile: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
    });

    await expect(newAction(deps)).rejects.toThrow('Permission denied');
  });

  it('uses cwd when project root not found', async () => {
    const originalCwd = process.cwd;
    process.cwd = vi.fn().mockReturnValue('/fallback');

    const deps = createMockDeps({
      findRootFn: vi.fn().mockReturnValue(null),
    });

    await newAction(deps);

    expect(deps.fsApi.mkdir).toHaveBeenCalledWith('/fallback/docs', { recursive: true });

    process.cwd = originalCwd;
  });

  it('handles missing template gracefully', async () => {
    const deps = createMockDeps({
      fsApi: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn().mockRejectedValue(new Error('ENOENT')),
        writeFile: vi.fn().mockResolvedValue(undefined),
      },
    });

    await newAction(deps);

    expect(deps.fsApi.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      '', // empty content when template not found
      expect.any(Object)
    );
  });

  it('shows error when project is not initialized', async () => {
    const deps = createMockDeps({
      loadConfigFn: vi.fn().mockReturnValue({
        workspaces: {},
        newFilenameTemplate: '{{title}}.md',
        docsDirs: [],
      }),
    });

    await newAction(deps);

    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('Project not initialized'));
    expect(deps.logger.error).toHaveBeenCalledWith(expect.stringContaining('hscli init'));
    expect(deps.prompts.select).not.toHaveBeenCalled();
  });

  it('replaces spaces in title for filename', async () => {
    const deps = createMockDeps({
      prompts: {
        input: vi.fn().mockResolvedValue('My Document Title'),
        select: vi.fn().mockResolvedValue('docs'),
      },
      loadConfigFn: vi.fn().mockReturnValue({
        workspaces: {},
        newFilenameTemplate: '{{title}}.md',
        newFileTemplatePath: undefined,
        docsDirs: ['docs'],
      }),
    });

    await newAction(deps);

    expect(deps.fsApi.writeFile).toHaveBeenCalledWith('/project/docs/My-Document-Title.md', '', expect.any(Object));
  });

  it('replaces full-width spaces in title', async () => {
    const deps = createMockDeps({
      prompts: {
        input: vi.fn().mockResolvedValue('Title\u3000With\u3000FullWidth'),
        select: vi.fn().mockResolvedValue('docs'),
      },
      loadConfigFn: vi.fn().mockReturnValue({
        workspaces: {},
        newFilenameTemplate: '{{title}}.md',
        newFileTemplatePath: undefined,
        docsDirs: ['docs'],
      }),
    });

    await newAction(deps);

    expect(deps.fsApi.writeFile).toHaveBeenCalledWith('/project/docs/Title-With-FullWidth.md', '', expect.any(Object));
  });
});
