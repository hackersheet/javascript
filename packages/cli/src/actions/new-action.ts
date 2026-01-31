import fs from 'fs/promises';
import path from 'path';

import { input, select } from '@inquirer/prompts';
import mustache from 'mustache';

import { getDateComponents } from '../utils/date-format';
import { findProjectRootPath } from '../utils/find-project-root-path';
import { loadConfig, type Config } from '../utils/load-config';

/**
 * Minimal filesystem interface for dependency injection.
 */
export type FsLike = {
  mkdir: typeof fs.mkdir;
  readFile: typeof fs.readFile;
  writeFile: typeof fs.writeFile;
};

/**
 * Interface for user prompts, enabling dependency injection in tests.
 */
export type Prompts = {
  input: typeof input;
  select: typeof select;
};

/**
 * Logger interface for output, enabling dependency injection in tests.
 */
export type Logger = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

/**
 * Dependencies for the newAction function.
 */
export type NewActionDeps = {
  fsApi: FsLike;
  prompts: Prompts;
  logger: Logger;
  loadConfigFn: () => Config;
  findRootFn: () => string | null;
  getDateFn: () => Date;
};

const defaultDeps: NewActionDeps = {
  fsApi: fs,
  prompts: { input, select },
  logger: { log: console.log, error: console.error },
  loadConfigFn: loadConfig,
  findRootFn: findProjectRootPath,
  getDateFn: () => new Date(),
};

/**
 * Creates a new document file with optional template.
 *
 * This is the action handler for the `new` command.
 * Prompts the user for a title and directory, then creates a new
 * markdown file using the configured filename template and optional
 * content template.
 *
 * @param deps - Optional dependencies for testing.
 */
export async function newAction(deps: Partial<NewActionDeps> = {}): Promise<void> {
  const { fsApi, prompts, logger, loadConfigFn, findRootFn, getDateFn } = { ...defaultDeps, ...deps };

  const config = loadConfigFn();
  const projectRootPath = findRootFn() || process.cwd();

  const title = (await prompts.input({ message: 'Enter title' })) as string;
  const dir = await prompts.select({
    message: 'Select directory',
    default: config.docsDirs.length > 0 ? config.docsDirs[config.docsDirs.length - 1] : undefined,
    choices:
      config.docsDirs.length > 0
        ? config.docsDirs.map((d) => ({ name: d, value: d }))
        : [{ name: 'docs', value: 'docs' }],
  });

  const now = getDateFn();
  const { yyyy, mm, dd, date, datetime } = getDateComponents(now);
  const filenameTitle = title.replace(/[\s\u3000]+/g, '-');

  const filename = mustache.render(config.newFilenameTemplate, {
    yyyy,
    mm,
    dd,
    title: filenameTitle,
  });

  const filepath = path.join(projectRootPath, dir, filename);
  const dirPath = path.dirname(filepath);

  await fsApi.mkdir(dirPath, { recursive: true });

  const rendered = await renderTemplate(config, projectRootPath, fsApi, {
    yyyy,
    mm,
    dd,
    title,
    date,
    datetime,
  });

  try {
    await fsApi.writeFile(filepath, rendered.content, { encoding: 'utf8', flag: 'wx' });
    const templateInfo = rendered.templatePath ? ` (from ${rendered.templatePath})` : '';
    logger.log(`Created file: ${filepath}${templateInfo}`);
  } catch (err: unknown) {
    const code = (err as { code?: string } | undefined)?.code;
    if (code === 'EEXIST') {
      logger.error(`File already exists: ${filepath}`);
    } else {
      throw err;
    }
  }
}

/**
 * Template variables for rendering document content.
 */
type TemplateVars = {
  yyyy: string;
  mm: string;
  dd: string;
  title: string;
  date: string;
  datetime: string;
};

/**
 * Result of template rendering.
 */
type RenderResult = {
  content: string;
  templatePath: string | null;
};

/**
 * Renders the document content using a template file if configured.
 *
 * @param config - The CLI configuration.
 * @param projectRootPath - The project root path.
 * @param fsApi - Filesystem interface.
 * @param vars - Template variables.
 * @returns The rendered content and template path used.
 */
async function renderTemplate(
  config: Config,
  projectRootPath: string,
  fsApi: FsLike,
  vars: TemplateVars
): Promise<RenderResult> {
  if (!config.newFileTemplatePath) {
    return { content: '', templatePath: null };
  }

  const templatePath = path.isAbsolute(config.newFileTemplatePath)
    ? config.newFileTemplatePath
    : path.join(projectRootPath, config.newFileTemplatePath);

  try {
    const template = await fsApi.readFile(templatePath, { encoding: 'utf8' });
    const content = mustache.render(template, vars);
    return { content, templatePath };
  } catch {
    return { content: '', templatePath: null };
  }
}
