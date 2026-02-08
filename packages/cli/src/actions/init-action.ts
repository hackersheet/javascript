import fs from 'fs/promises';
import path from 'path';

import { input, confirm } from '@inquirer/prompts';

import { runConfigWizard, type ConfigInitActionDeps } from './config';
import { colors, symbols } from '../utils/colors';
import { loadUserConfig, loadConfigFromPath } from '../utils/load-config';
import { saveConfig } from '../utils/save-config';

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
 * Dependencies for the initAction function.
 */
export type InitActionDeps = {
  fsApi: FsLike;
  prompts: Prompts;
  logger: Logger;
  cwd: () => string;
  configInitDeps?: Partial<ConfigInitActionDeps>;
};

const defaultDeps: InitActionDeps = {
  fsApi: fs,
  prompts: { input, confirm },
  logger: { log: console.log, error: console.error },
  cwd: () => process.cwd(),
};

/**
 * Initializes Hacker Sheet in the current project.
 *
 * This is the action handler for the `init` command.
 * Creates the `.hackersheet` directory and `cli.config.json` configuration
 * file with project-specific settings.
 *
 * @param deps - Optional dependencies for testing.
 */
export async function initAction(deps: Partial<InitActionDeps> = {}): Promise<void> {
  const { fsApi, prompts, logger, cwd, configInitDeps } = { ...defaultDeps, ...deps };

  // Validate that setup has been run
  const userConfig = loadUserConfig();
  if (!userConfig.workspaces || Object.keys(userConfig.workspaces).length === 0) {
    logger.error(`${symbols.error()} ${colors.error('No workspaces configured.')}`);
    logger.error(`   ${colors.hint('Run')} ${colors.emphasis('hscli setup')} ${colors.hint('first.')}`);
    return;
  }

  const projectRoot = cwd();
  const hackersheetDir = path.join(projectRoot, '.hackersheet');
  const configPath = path.join(hackersheetDir, 'cli.config.json');
  const treesDir = path.join(hackersheetDir, 'trees');

  const wizardDeps: Partial<ConfigInitActionDeps> = {
    fsApi: { mkdir: fsApi.mkdir, access: fsApi.access },
    prompts,
    logger,
    loadConfigFromPath,
    saveConfig,
    ...configInitDeps,
  };

  const wizardOptions = {
    confirmMessage: 'Project is already initialized. Overwrite configuration?',
    headerMessage: '\nHacker Sheet Project Initialization\n',
  };

  const result = await runConfigWizard(configPath, 'project', wizardDeps, wizardOptions);

  if (result.cancelled) {
    logger.log(`${symbols.warning()} ${colors.warning('Initialization cancelled.')}`);
    return;
  }

  // Create directories
  await fsApi.mkdir(hackersheetDir, { recursive: true });
  await fsApi.mkdir(treesDir, { recursive: true });

  // Write configuration
  const configJson = JSON.stringify(result.config, null, 2);
  await fsApi.writeFile(configPath, configJson, 'utf8');

  logger.log(`\n${symbols.success()} ${colors.success('Project initialization completed!')}`);
  logger.log(`   Created: ${colors.path(hackersheetDir)}`);
  logger.log(`   Config:  ${colors.path(configPath)}`);
}
