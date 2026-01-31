import { describe, it, expect, vi } from 'vitest';

import {
  isIndexName,
  fmData,
  titleFrom,
  slugFromName,
  pickSlug,
  readFileSafe,
  buildNodes,
  createTree,
  type FsLike,
} from '../gen-tree-action';

describe('isIndexName', () => {
  it('returns true for index.md', () => {
    expect(isIndexName('index.md')).toBe(true);
    expect(isIndexName('INDEX.MD')).toBe(true);
    expect(isIndexName('Index.Md')).toBe(true);
  });

  it('returns true for 00-index files', () => {
    expect(isIndexName('00-index.md')).toBe(true);
    expect(isIndexName('00-index-intro.md')).toBe(true);
    expect(isIndexName('00-INDEX.md')).toBe(true);
  });

  it('returns false for non-index files', () => {
    expect(isIndexName('readme.md')).toBe(false);
    expect(isIndexName('introduction.md')).toBe(false);
    expect(isIndexName('chapter-01.md')).toBe(false);
  });

  it('returns true for files ending with index.md', () => {
    // Note: The regex matches any file ending with 'index.md'
    expect(isIndexName('about-index.md')).toBe(true);
    expect(isIndexName('myindex.md')).toBe(true);
  });
});

describe('fmData', () => {
  it('extracts frontmatter from content', () => {
    const content = `---
title: Test Title
slug: test-slug
---
# Content`;

    const result = fmData(content);

    expect(result.title).toBe('Test Title');
    expect(result.slug).toBe('test-slug');
  });

  it('returns empty object for null content', () => {
    expect(fmData(null)).toEqual({});
  });

  it('returns empty object for content without frontmatter', () => {
    const content = '# Just a heading\n\nSome content';
    expect(fmData(content)).toEqual({});
  });
});

describe('titleFrom', () => {
  it('extracts title from frontmatter', () => {
    const content = `---
title: Frontmatter Title
---
# Heading Title`;

    expect(titleFrom(content, 'fallback')).toBe('Frontmatter Title');
  });

  it('extracts title from H1 heading when no frontmatter title', () => {
    const content = `---
slug: test-slug
---
# Heading Title

Some content`;

    expect(titleFrom(content, 'fallback')).toBe('Heading Title');
  });

  it('extracts title from H1 heading without frontmatter', () => {
    const content = '# My Document Title\n\nContent here';
    expect(titleFrom(content, 'fallback')).toBe('My Document Title');
  });

  it('returns fallback when no title found', () => {
    const content = 'Just some text without heading';
    expect(titleFrom(content, 'fallback')).toBe('fallback');
  });

  it('returns fallback for null content', () => {
    expect(titleFrom(null, 'fallback')).toBe('fallback');
  });

  it('trims whitespace from title', () => {
    const content = `---
title: "  Spaces Around  "
---`;
    expect(titleFrom(content, 'fallback')).toBe('Spaces Around');
  });
});

describe('slugFromName', () => {
  it('removes .md extension', () => {
    expect(slugFromName('document.md')).toBe('document');
    expect(slugFromName('my-file.MD')).toBe('my-file');
  });

  it('handles filenames without .md extension', () => {
    expect(slugFromName('document')).toBe('document');
    expect(slugFromName('file.txt')).toBe('file.txt');
  });

  it('only removes trailing .md', () => {
    expect(slugFromName('.md')).toBe('');
    expect(slugFromName('file.md.backup')).toBe('file.md.backup');
  });
});

describe('pickSlug', () => {
  it('returns slug from frontmatter when present', () => {
    expect(pickSlug({ slug: 'custom-slug' }, 'fallback')).toBe('custom-slug');
  });

  it('returns fallback when slug is empty', () => {
    expect(pickSlug({ slug: '' }, 'fallback')).toBe('fallback');
    expect(pickSlug({ slug: '   ' }, 'fallback')).toBe('fallback');
  });

  it('returns fallback when slug is not a string', () => {
    expect(pickSlug({ slug: 123 }, 'fallback')).toBe('fallback');
    expect(pickSlug({ slug: null }, 'fallback')).toBe('fallback');
    expect(pickSlug({}, 'fallback')).toBe('fallback');
  });
});

describe('readFileSafe', () => {
  it('returns file content when file exists', async () => {
    const mockFs: FsLike = {
      readFile: vi.fn().mockResolvedValue('file content'),
      readdir: vi.fn(),
      stat: vi.fn(),
      mkdir: vi.fn(),
      writeFile: vi.fn(),
      rename: vi.fn(),
      unlink: vi.fn(),
    };

    const result = await readFileSafe('/path/to/file.md', mockFs);
    expect(result).toBe('file content');
    expect(mockFs.readFile).toHaveBeenCalledWith('/path/to/file.md', 'utf8');
  });

  it('returns null when file does not exist', async () => {
    const mockFs: FsLike = {
      readFile: vi.fn().mockRejectedValue(new Error('ENOENT')),
      readdir: vi.fn(),
      stat: vi.fn(),
      mkdir: vi.fn(),
      writeFile: vi.fn(),
      rename: vi.fn(),
      unlink: vi.fn(),
    };

    const result = await readFileSafe('/path/to/missing.md', mockFs);
    expect(result).toBeNull();
  });
});

describe('buildNodes', () => {
  it('builds tree from directory structure', async () => {
    const mockFs: FsLike = {
      readFile: vi.fn().mockImplementation((path: string) => {
        if (path.endsWith('doc1.md')) {
          return Promise.resolve('---\ntitle: Document One\nslug: doc-one\n---\n# Doc One');
        }
        if (path.endsWith('doc2.md')) {
          return Promise.resolve('# Document Two');
        }
        return Promise.resolve('');
      }),
      readdir: vi.fn().mockImplementation((path: string, options?: { withFileTypes?: boolean }) => {
        if (options?.withFileTypes) {
          return Promise.resolve([
            { name: 'doc1.md', isDirectory: () => false, isFile: () => true },
            { name: 'doc2.md', isDirectory: () => false, isFile: () => true },
          ]);
        }
        return Promise.resolve(['doc1.md', 'doc2.md']);
      }),
      stat: vi.fn(),
      mkdir: vi.fn(),
      writeFile: vi.fn(),
      rename: vi.fn(),
      unlink: vi.fn(),
    };

    const result = await buildNodes('/docs', '', 'docs', mockFs);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'Document One',
      slug: 'doc-one',
      path: 'docs/doc1.md',
    });
    expect(result[1]).toEqual({
      name: 'Document Two',
      slug: 'doc2',
      path: 'docs/doc2.md',
    });
  });

  it('handles nested directories with index files', async () => {
    const mockFs: FsLike = {
      readFile: vi.fn().mockImplementation((path: string) => {
        if (path.includes('index.md')) {
          return Promise.resolve('---\ntitle: Section Title\n---\n# Section');
        }
        if (path.endsWith('page.md')) {
          return Promise.resolve('# Page Title');
        }
        return Promise.resolve('');
      }),
      readdir: vi.fn().mockImplementation((path: string, options?: { withFileTypes?: boolean }) => {
        if (path === '/docs') {
          if (options?.withFileTypes) {
            return Promise.resolve([{ name: 'section', isDirectory: () => true, isFile: () => false }]);
          }
          return Promise.resolve(['section']);
        }
        if (path === '/docs/section') {
          if (options?.withFileTypes) {
            return Promise.resolve([
              { name: 'index.md', isDirectory: () => false, isFile: () => true },
              { name: 'page.md', isDirectory: () => false, isFile: () => true },
            ]);
          }
          return Promise.resolve(['index.md', 'page.md']);
        }
        return Promise.resolve([]);
      }),
      stat: vi.fn(),
      mkdir: vi.fn(),
      writeFile: vi.fn(),
      rename: vi.fn(),
      unlink: vi.fn(),
    };

    const result = await buildNodes('/docs', '', 'docs', mockFs);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Section Title');
    expect(result[0].slug).toBe('section');
    expect(result[0].path).toBe('docs/section/index.md');
    expect(result[0].nodes).toHaveLength(1);
    expect(result[0].nodes?.[0].name).toBe('Page Title');
  });

  it('skips hidden directories', async () => {
    const mockFs: FsLike = {
      readFile: vi.fn().mockResolvedValue('# Content'),
      readdir: vi.fn().mockImplementation((_path: string, options?: { withFileTypes?: boolean }) => {
        if (options?.withFileTypes) {
          return Promise.resolve([
            { name: '.hidden', isDirectory: () => true, isFile: () => false },
            { name: 'visible.md', isDirectory: () => false, isFile: () => true },
          ]);
        }
        return Promise.resolve(['.hidden', 'visible.md']);
      }),
      stat: vi.fn(),
      mkdir: vi.fn(),
      writeFile: vi.fn(),
      rename: vi.fn(),
      unlink: vi.fn(),
    };

    const result = await buildNodes('/docs', '', 'docs', mockFs);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Content');
  });
});

describe('createTree', () => {
  it('creates a complete tree structure', async () => {
    const mockFs: FsLike = {
      readFile: vi.fn().mockImplementation((path: string) => {
        if (path.endsWith('intro.md')) {
          return Promise.resolve('---\ntitle: Introduction\n---');
        }
        return Promise.resolve('# Default');
      }),
      readdir: vi.fn().mockImplementation((path: string, options?: { withFileTypes?: boolean }) => {
        if (path === '/project/docs') {
          if (options?.withFileTypes) {
            return Promise.resolve([{ name: 'intro.md', isDirectory: () => false, isFile: () => true }]);
          }
          return Promise.resolve(['intro.md']);
        }
        return Promise.resolve([]);
      }),
      stat: vi.fn(),
      mkdir: vi.fn(),
      writeFile: vi.fn(),
      rename: vi.fn(),
      unlink: vi.fn(),
    };

    const result = await createTree('/project/docs', 'main', 'docs', mockFs);

    expect(result.name).toBe('main');
    expect(result.slug).toBe('main');
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].name).toBe('Introduction');
    expect(result.nodes[0].path).toBe('docs/intro.md');
  });

  it('handles empty directory', async () => {
    const mockFs: FsLike = {
      readFile: vi.fn(),
      readdir: vi.fn().mockResolvedValue([]),
      stat: vi.fn(),
      mkdir: vi.fn(),
      writeFile: vi.fn(),
      rename: vi.fn(),
      unlink: vi.fn(),
    };

    const result = await createTree('/empty', 'tree', 'empty', mockFs);

    expect(result.name).toBe('tree');
    expect(result.nodes).toEqual([]);
  });
});
