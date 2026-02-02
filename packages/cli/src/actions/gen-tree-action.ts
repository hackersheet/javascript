import fs from 'fs/promises';
import path from 'path';

import { input, confirm } from '@inquirer/prompts';
import matter from 'gray-matter';

import { colors, symbols } from '../utils/colors';
import { findProjectRootPath } from '../utils/find-project-root-path';

import type { Dirent, Stats } from 'fs';

/**
 * Represents a node in the document tree structure.
 */
export type TreeNode = {
  /** Display name of the node (extracted from frontmatter or heading). */
  name: string;
  /** URL-friendly identifier for the node. */
  slug: string;
  /** Relative path to the source markdown file. */
  path?: string;
  /** Child nodes if this is a directory. */
  nodes?: TreeNode[];
};

/**
 * Parsed frontmatter data from a markdown file.
 */
export type FrontMatter = {
  /** Document title from frontmatter. */
  title?: unknown;
  /** Document slug from frontmatter. */
  slug?: unknown;
  /** Additional frontmatter fields. */
  [key: string]: unknown;
};

/**
 * Minimal filesystem interface for dependency injection.
 * Enables testing without real file I/O.
 */
export type FsLike = Pick<typeof fs, 'readdir' | 'readFile' | 'stat' | 'mkdir' | 'writeFile' | 'rename' | 'unlink'>;

/**
 * Safely retrieves file stats without throwing on error.
 *
 * @param p - The path to stat.
 * @param fsApi - Filesystem interface.
 * @returns The stats object, or `null` if the path doesn't exist or an error occurs.
 */
async function statSafe(p: string, fsApi: FsLike): Promise<Stats | null> {
  try {
    return await fsApi.stat(p);
  } catch {
    return null;
  }
}

/**
 * Safely reads directory contents without throwing on error.
 *
 * @param p - The directory path to read.
 * @param fsApi - Filesystem interface.
 * @param options - Options for readdir (e.g., withFileTypes).
 * @returns Array of directory entries or filenames, or empty array on error.
 */
async function readdirSafe(
  p: string,
  fsApi: FsLike,
  options?: { withFileTypes?: boolean }
): Promise<Dirent[] | string[]> {
  try {
    type ReaddirFn = (path: string, options?: { [key: string]: unknown }) => Promise<unknown>;
    const readdir = fsApi.readdir as unknown as ReaddirFn;
    if (options && options.withFileTypes) {
      const r = await readdir(p, { withFileTypes: true });
      return r as unknown as Dirent[];
    }

    const r = await readdir(p, { withFileTypes: false });
    return r as unknown as string[];
  } catch {
    return [] as Dirent[];
  }
}

/**
 * Safely reads a file without throwing on error.
 *
 * @param p - The file path to read.
 * @param fsApi - Filesystem interface.
 * @returns The file contents as a string, or `null` on error.
 */
export async function readFileSafe(p: string, fsApi: FsLike = fs): Promise<string | null> {
  try {
    return await fsApi.readFile(p, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Checks if a filename represents an index file.
 *
 * Index files are either `index.md` or files starting with `00-index`.
 *
 * @param name - The filename to check.
 * @returns `true` if the file is an index file.
 */
export function isIndexName(name: string): boolean {
  return /index\.md$/i.test(name) || /^00-index/i.test(name);
}

/**
 * Extracts frontmatter data from markdown content.
 *
 * @param content - The markdown content to parse.
 * @returns The parsed frontmatter object.
 */
export function fmData(content: string | null): FrontMatter {
  return (matter(content || '').data || {}) as FrontMatter;
}

/**
 * Extracts a title from markdown content.
 *
 * Attempts to find the title in the following order:
 * 1. `title` field in frontmatter
 * 2. First H1 heading in the content
 * 3. Fallback value
 *
 * @param content - The markdown content to parse.
 * @param fallback - The fallback title if none is found.
 * @returns The extracted or fallback title.
 */
export function titleFrom(content: string | null, fallback: string): string {
  if (!content) return fallback;
  const parsed = matter(content);
  const fm = parsed.data || {};
  if (fm && typeof fm.title === 'string' && fm.title.trim()) return fm.title.trim();
  const body = (parsed.content || '').trim();
  const headingMatch = body.match(/^#\s+(.*)$/m);
  if (headingMatch) return headingMatch[1].trim();
  return fallback;
}

/**
 * Converts a filename to a slug by removing the `.md` extension.
 *
 * @param name - The filename to convert.
 * @returns The slug derived from the filename.
 */
export function slugFromName(name: string): string {
  return name.replace(/\.md$/i, '');
}

/**
 * Picks a slug from frontmatter or uses a fallback.
 *
 * @param fm - The frontmatter object.
 * @param fallback - The fallback slug if not found in frontmatter.
 * @returns The slug from frontmatter or the fallback.
 */
export function pickSlug(fm: FrontMatter, fallback: string): string {
  const s = fm && fm.slug;
  return typeof s === 'string' && s.trim() ? String(s) : fallback;
}

/**
 * Recursively builds tree nodes from a directory structure.
 *
 * Scans the directory for subdirectories and markdown files,
 * extracts metadata from frontmatter, and constructs a tree structure.
 *
 * @param dirAbs - Absolute path to the directory to scan.
 * @param dirRel - Relative path from the docs root to this directory.
 * @param rootRel - Relative path prefix for output paths.
 * @param fsApi - Filesystem interface for dependency injection.
 * @returns Array of tree nodes representing the directory contents.
 */
export async function buildNodes(
  dirAbs: string,
  dirRel: string,
  rootRel: string,
  fsApi: FsLike = fs
): Promise<TreeNode[]> {
  const entries = (await readdirSafe(dirAbs, fsApi, { withFileTypes: true })) as Dirent[];
  const dirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith('.'));
  const files = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'));
  dirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const nodes: TreeNode[] = [];

  for (const d of dirs) {
    const subAbs = path.join(dirAbs, d.name);
    const childRel = path.posix.join(dirRel, d.name);
    const subEntries = (await readdirSafe(subAbs, fsApi, { withFileTypes: false })) as unknown as string[];
    const indexFile = subEntries.find((f) => isIndexName(f));
    const nameFallback = d.name;

    if (indexFile) {
      const content = await readFileSafe(path.join(subAbs, String(indexFile)), fsApi);
      const fm = fmData(content);
      const title = titleFrom(content, nameFallback);
      const childNodes = await buildNodes(subAbs, childRel, rootRel, fsApi);
      const nodePath = path.posix.join(rootRel, childRel, String(indexFile));
      const slug = pickSlug(fm, slugFromName(d.name));
      nodes.push({ name: title, slug, path: nodePath, nodes: childNodes });
    } else {
      const childNodes = await buildNodes(subAbs, childRel, rootRel, fsApi);
      if (childNodes.length > 0) nodes.push({ name: nameFallback, slug: slugFromName(d.name), nodes: childNodes });
    }
  }

  for (const f of files) {
    if (isIndexName(f.name)) continue;
    const abs = path.join(dirAbs, f.name);
    const rel = path.posix.join(rootRel, dirRel, f.name);
    const content = await readFileSafe(abs, fsApi);
    const fm = fmData(content);
    const fallback = slugFromName(f.name);
    const title = titleFrom(content, fallback);
    const slug = pickSlug(fm, slugFromName(f.name));
    nodes.push({ name: title, slug, path: rel });
  }

  return nodes;
}

/**
 * Creates a complete document tree from a source directory.
 *
 * Scans the top-level directory for subdirectories and markdown files,
 * then recursively builds child nodes for each subdirectory.
 *
 * @param docsAbsolute - Absolute path to the documents directory.
 * @param treeName - Name for the generated tree.
 * @param rootRel - Relative path prefix for output paths.
 * @param fsApi - Filesystem interface for dependency injection.
 * @returns The complete tree structure with name, slug, and nodes.
 */
export async function createTree(
  docsAbsolute: string,
  treeName: string,
  rootRel: string,
  fsApi: FsLike = fs
): Promise<{ name: string; slug: string; nodes: TreeNode[] }> {
  const topEntries = (await readdirSafe(docsAbsolute, fsApi, { withFileTypes: true })) as Dirent[];
  const topDirs = topEntries.filter((e) => e.isDirectory() && !e.name.startsWith('.'));
  const topFiles = topEntries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'));
  topDirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  topFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const nodes: TreeNode[] = [];

  for (const d of topDirs) {
    const subAbs = path.join(docsAbsolute, d.name);
    const subEntries = (await readdirSafe(subAbs, fsApi, { withFileTypes: false })) as unknown as string[];
    const indexFile = subEntries.find((f) => isIndexName(f));
    const nameFallback = d.name;

    if (indexFile) {
      const content = await readFileSafe(path.join(subAbs, String(indexFile)), fsApi);
      const fm = fmData(content);
      const title = titleFrom(content, nameFallback);
      const childNodes = await buildNodes(subAbs, d.name, rootRel, fsApi);
      const nodePath = path.posix.join(rootRel, d.name, String(indexFile));
      const slug = pickSlug(fm, slugFromName(d.name));
      nodes.push({ name: title, slug, path: nodePath, nodes: childNodes });
    } else {
      const childNodes = await buildNodes(subAbs, d.name, rootRel, fsApi);
      if (childNodes.length > 0) nodes.push({ name: nameFallback, slug: slugFromName(d.name), nodes: childNodes });
    }
  }

  for (const f of topFiles) {
    if (isIndexName(f.name)) continue;
    const abs = path.join(docsAbsolute, f.name);
    const content = await readFileSafe(abs, fsApi);
    const fm = fmData(content);
    const fallback = slugFromName(f.name);
    const title = titleFrom(content, fallback);
    const rel = path.posix.join(rootRel, f.name);
    const slug = pickSlug(fm, slugFromName(f.name));
    nodes.push({ name: title, slug, path: rel });
  }

  return { name: treeName, slug: treeName, nodes };
}

/**
 * Interface for user prompts, enabling dependency injection in tests.
 */
export type Prompts = {
  /** Prompts for text input. */
  input: typeof input;
  /** Prompts for yes/no confirmation. */
  confirm: typeof confirm;
};

/**
 * Interface for process exit handling, enabling dependency injection in tests.
 */
export type ExitHandler = { exit: (code?: number) => never } | { exit: (code?: number) => void };

/**
 * Logger interface for output, enabling dependency injection in tests.
 */
export type Logger = {
  /** Logs a message to stdout. */
  log: (...args: unknown[]) => void;
  /** Logs an error message to stderr. */
  error: (...args: unknown[]) => void;
};

/**
 * Generates a document tree from a source directory.
 *
 * This is the main action handler for the `gen:tree` command.
 * It prompts the user for a source directory and tree name,
 * scans the directory structure, and outputs a JSON tree file.
 *
 * @param prompts - User prompt functions for interactive input.
 * @param fsApi - Filesystem interface for file operations.
 * @param exitHandler - Handler for process exit.
 * @param logger - Logger for output messages.
 * @param findRoot - Function to find the project root path.
 */
export async function genTreeAction(
  prompts: Prompts = { input, confirm },
  fsApi: FsLike = fs,
  exitHandler: { exit: (code?: number) => void } = { exit: (c = 0) => process.exit(c) },
  logger: { log: (...args: unknown[]) => void; error: (...args: unknown[]) => void } = {
    log: console.log,
    error: console.error,
  },
  findRoot: () => string | null = findProjectRootPath
): Promise<void> {
  const fail = (message: string, code = 1): never => {
    logger.error(`${symbols.error()} ${colors.error(message)}`);
    exitHandler.exit(code);
    throw new Error('unreachable');
  };

  const finish = (message: string, code = 0): never => {
    logger.log(`${symbols.info()} ${colors.info(message)}`);
    exitHandler.exit(code);
    throw new Error('unreachable');
  };

  const projectRootPath = findRoot();
  if (!projectRootPath) fail('Could not determine project root path. Aborting.', 1);

  const sourceDirPath = (await prompts.input({ message: 'Enter source directory path' })) as string;
  const treeName = (await prompts.input({ message: 'Enter tree name' })) as string;
  if (!sourceDirPath || sourceDirPath.trim() === '') fail('No source directory path provided. Aborting.', 1);

  const docsAbsolute = path.resolve(projectRootPath!, sourceDirPath as string);
  let rootRel = path.relative(projectRootPath!, docsAbsolute).split(path.sep).join(path.posix.sep);
  if (!rootRel || rootRel === '')
    rootRel =
      path.posix.basename(docsAbsolute) ||
      fail('Could not determine a root path for the provided source directory. Aborting.', 1);

  const outFile = path.join(projectRootPath!, '.hackersheet', 'trees', `${treeName}.json`);
  const stats = await statSafe(docsAbsolute, fsApi);
  if (!stats || !stats.isDirectory()) fail(`${docsAbsolute} directory not found. Aborting.`, 1);

  const out = await createTree(docsAbsolute, treeName, rootRel, fsApi);
  const outDir = path.dirname(outFile);
  await fsApi.mkdir(outDir, { recursive: true });
  const exists = await fsApi.stat(outFile).catch(() => null);
  if (exists) {
    const ok = await prompts.confirm({ message: `${outFile} already exists. Overwrite?` });
    if (!ok) finish(`Did not overwrite ${outFile}`, 0);
  }
  const data = JSON.stringify(out, null, 2);
  const tmpFile = `${outFile}.tmp-${process.pid}-${Date.now()}`;
  try {
    await fsApi.writeFile(tmpFile, data, 'utf8');
    await fsApi.rename(tmpFile, outFile);
    logger.log(`${symbols.success()} ${colors.success('Wrote')} ${colors.path(outFile)}`);
  } catch (err) {
    await fsApi.unlink(tmpFile).catch(() => null);
    fail(`Failed to write ${outFile}: ${String(err)}`);
  }
}
