import fs from 'fs/promises';
import path from 'path';

import { input, confirm } from '@inquirer/prompts';

import { type Config } from '../utils/load-config';

/**
 * Minimal filesystem interface for dependency injection.
 */
export type FsLike = {
  mkdir: typeof fs.mkdir;
  writeFile: typeof fs.writeFile;
  access: typeof fs.access;
};

/**
 * Interface for user prompts, enabling dependency injection in tests.
 */
export type Prompts = {
  input: typeof input;
  confirm: typeof confirm;
};

/**
 * Logger interface for output, enabling dependency injection in tests.
 */
export type Logger = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

/**
 * Dependencies for the setupAction function.
 */
export type SetupActionDeps = {
  fsApi: FsLike;
  prompts: Prompts;
  logger: Logger;
  cwd: () => string;
};

const defaultDeps: SetupActionDeps = {
  fsApi: fs,
  prompts: { input, confirm },
  logger: { log: console.log, error: console.error },
  cwd: () => process.cwd(),
};

/**
 * Default configuration template.
 */
const DEFAULT_CONFIG: Omit<Config, 'workspaces' | 'defaultWorkspace'> = {
  newFilenameTemplate: '{{yyyy}}-{{mm}}-{{dd}}-{{title}}.md',
  docsDirs: ['docs'],
};

/**
 * Initializes Hacker Sheet in the current project.
 *
 * This is the action handler for the `setup` command.
 * Creates the `.hackersheet` directory and `cli.config.json` configuration
 * file with user-provided settings.
 *
 * @param deps - Optional dependencies for testing.
 */
export async function setupAction(deps: Partial<SetupActionDeps> = {}): Promise<void> {
  const { fsApi, prompts, logger, cwd } = { ...defaultDeps, ...deps };

  const projectRoot = cwd();
  const hackersheetDir = path.join(projectRoot, '.hackersheet');
  const configPath = path.join(hackersheetDir, 'cli.config.json');
  const treesDir = path.join(hackersheetDir, 'trees');

  // Check if already initialized
  const configExists = await fileExists(configPath, fsApi);
  if (configExists) {
    const overwrite = await prompts.confirm({
      message: 'Hacker Sheet is already initialized. Overwrite configuration?',
      default: false,
    });
    if (!overwrite) {
      logger.log('Setup cancelled.');
      return;
    }
  }

  // Gather configuration
  logger.log('\n📝 Hacker Sheet CLI Setup\n');

  const workspaceSlug = await prompts.input({
    message: 'Workspace slug (optional, for API access)',
    default: '',
  });

  const accessKey = await prompts.input({
    message: 'Workspace access key (optional, for API access)',
    default: '',
  });

  const newFilenameTemplate = await prompts.input({
    message: 'New document filename template',
    default: DEFAULT_CONFIG.newFilenameTemplate,
  });

  const docsDirsInput = await prompts.input({
    message: 'Document directories (comma-separated)',
    default: 'docs',
  });

  const docsDirs = docsDirsInput
    .split(',')
    .map((d) => d.trim())
    .filter((d) => d.length > 0);

  // Build configuration
  const workspaces: Config['workspaces'] = {};
  let defaultWorkspace: string | undefined;

  if (workspaceSlug && accessKey) {
    workspaces[workspaceSlug] = { accessKey };
    defaultWorkspace = workspaceSlug;
  }

  const config: Config = {
    workspaces,
    ...(defaultWorkspace && { defaultWorkspace }),
    newFilenameTemplate: newFilenameTemplate || DEFAULT_CONFIG.newFilenameTemplate,
    docsDirs: docsDirs.length > 0 ? docsDirs : DEFAULT_CONFIG.docsDirs,
  };

  // Create directories
  await fsApi.mkdir(hackersheetDir, { recursive: true });
  await fsApi.mkdir(treesDir, { recursive: true });

  // Write configuration
  const configJson = JSON.stringify(config, null, 2);
  await fsApi.writeFile(configPath, configJson, 'utf8');

  logger.log(`\n✨ Setup completed!`);
  logger.log(`   Created: ${hackersheetDir}`);
  logger.log(`   Config:  ${configPath}`);
}

/**
 * Checks if a file exists.
 *
 * @param filePath - Path to check.
 * @param fsApi - Filesystem interface.
 * @returns True if file exists.
 */
async function fileExists(filePath: string, fsApi: FsLike): Promise<boolean> {
  try {
    await fsApi.access(filePath);
    return true;
  } catch {
    return false;
  }
}
