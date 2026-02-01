import fs from 'fs/promises';
import path from 'path';

import { input, confirm } from '@inquirer/prompts';

import { runConfigWizard, type ConfigInitActionDeps } from './config';
import { loadConfigFromPath } from '../utils/load-config';
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
 * Dependencies for the setupAction function.
 */
export type SetupActionDeps = {
  fsApi: FsLike;
  prompts: Prompts;
  logger: Logger;
  cwd: () => string;
  configInitDeps?: Partial<ConfigInitActionDeps>;
};

const defaultDeps: SetupActionDeps = {
  fsApi: fs,
  prompts: { input, confirm },
  logger: { log: console.log, error: console.error },
  cwd: () => process.cwd(),
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
  const { fsApi, prompts, logger, cwd, configInitDeps } = { ...defaultDeps, ...deps };

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
    confirmMessage: 'Hacker Sheet is already initialized. Overwrite configuration?',
    headerMessage: '\n📝 Hacker Sheet CLI Setup\n',
  };

  const result = await runConfigWizard(configPath, wizardDeps, wizardOptions);

  if (result.cancelled) {
    logger.log('Setup cancelled.');
    return;
  }

  // Create directories
  await fsApi.mkdir(hackersheetDir, { recursive: true });
  await fsApi.mkdir(treesDir, { recursive: true });

  // Write configuration
  const configJson = JSON.stringify(result.config, null, 2);
  await fsApi.writeFile(configPath, configJson, 'utf8');

  logger.log(`\n✨ Setup completed!`);
  logger.log(`   Created: ${hackersheetDir}`);
  logger.log(`   Config:  ${configPath}`);
}
