import fs from 'fs/promises';
import path from 'path';

import { input, confirm } from '@inquirer/prompts';

import { runConfigWizard, type ConfigInitActionDeps } from './config';
import { colors, symbols } from '../utils/colors';
import { getUserConfigPath, loadConfigFromPath } from '../utils/load-config';
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
 * Initializes global configuration for Hacker Sheet.
 *
 * This is the action handler for the `setup` command.
 * Creates the user config directory and `cli.config.json` configuration
 * file with workspace settings.
 *
 * @param deps - Optional dependencies for testing.
 */
export async function setupAction(deps: Partial<SetupActionDeps> = {}): Promise<void> {
  const { fsApi, prompts, logger, configInitDeps } = { ...defaultDeps, ...deps };

  const configPath = getUserConfigPath();

  const wizardDeps: Partial<ConfigInitActionDeps> = {
    fsApi: { mkdir: fsApi.mkdir, access: fsApi.access },
    prompts,
    logger,
    loadConfigFromPath,
    saveConfig,
    ...configInitDeps,
  };

  const wizardOptions = {
    confirmMessage: 'Hacker Sheet is already set up. Overwrite configuration?',
    headerMessage: '\nHacker Sheet CLI Setup\n',
  };

  const result = await runConfigWizard(configPath, 'global', wizardDeps, wizardOptions);

  if (result.cancelled) {
    logger.log(`${symbols.warning()} ${colors.warning('Setup cancelled.')}`);
    return;
  }

  // Create config directory
  const configDir = path.dirname(configPath);
  await fsApi.mkdir(configDir, { recursive: true });

  // Write configuration
  const configJson = JSON.stringify(result.config, null, 2);
  await fsApi.writeFile(configPath, configJson, 'utf8');

  logger.log(`\n${symbols.success()} ${colors.success('Setup completed!')}`);
  logger.log(`   Config: ${colors.path(configPath)}`);
  logger.log(
    `\n${symbols.info()} ${colors.hint('Next: Run')} ${colors.emphasis('hscli init')} ${colors.hint('in your project')}`
  );
}
