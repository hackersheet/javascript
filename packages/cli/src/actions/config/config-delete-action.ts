import path from 'path';

import { colors, symbols } from '../../utils/colors';
import { getUserConfigPath, getProjectConfigPath, loadConfigFromPath } from '../../utils/load-config';
import { deleteConfigKey } from '../../utils/save-config';

/**
 * Logger interface for output, enabling dependency injection in tests.
 */
export type Logger = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

/**
 * Options for the config delete command.
 */
export type ConfigDeleteOptions = {
  global?: boolean;
};

/**
 * Dependencies for the configDeleteAction function.
 */
export type ConfigDeleteActionDeps = {
  logger: Logger;
  getUserConfigPath: typeof getUserConfigPath;
  getProjectConfigPath: typeof getProjectConfigPath;
  loadConfigFromPath: typeof loadConfigFromPath;
  deleteConfigKey: typeof deleteConfigKey;
  cwd: () => string;
};

const defaultDeps: ConfigDeleteActionDeps = {
  logger: { log: console.log, error: console.error },
  getUserConfigPath,
  getProjectConfigPath,
  loadConfigFromPath,
  deleteConfigKey,
  cwd: () => process.cwd(),
};

/**
 * Gets a value at a nested path in an object.
 *
 * @param obj - The object to search.
 * @param keyPath - Dot-separated path.
 * @returns The value at the path, or undefined if not found.
 */
function getNestedValue(obj: Record<string, unknown>, keyPath: string): unknown {
  const keys = keyPath.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

/**
 * Deletes a configuration value.
 *
 * This is the action handler for the `config delete <key>` command.
 * Removes the value from user or project configuration based on options.
 * Defaults to project configuration (local).
 *
 * @param key - The configuration key to delete.
 * @param options - Command options.
 * @param deps - Optional dependencies for testing.
 */
export async function configDeleteAction(
  key: string,
  options: ConfigDeleteOptions = {},
  deps: Partial<ConfigDeleteActionDeps> = {}
): Promise<void> {
  const {
    logger,
    getUserConfigPath: getUserPath,
    getProjectConfigPath: getProjectPath,
    loadConfigFromPath: loadFromPath,
    deleteConfigKey: deleteKey,
    cwd,
  } = { ...defaultDeps, ...deps };

  let configPath: string;
  let configType: string;

  if (options.global) {
    configPath = getUserPath();
    configType = 'user';
  } else {
    const projectPath = getProjectPath();
    if (projectPath) {
      configPath = projectPath;
    } else {
      configPath = path.join(cwd(), '.hackersheet', 'cli.config.json');
    }
    configType = 'project';
  }

  const existingConfig = loadFromPath(configPath);
  if (!existingConfig) {
    logger.error(`${symbols.error()} ${colors.error('Configuration file not found:')} ${colors.path(configPath)}`);
    return;
  }

  const currentValue = getNestedValue(existingConfig as Record<string, unknown>, key);
  if (currentValue === undefined) {
    logger.error(
      `${symbols.error()} ${colors.error('Key not found in')} ${configType} configuration: ${colors.emphasis(key)}`
    );
    return;
  }

  await deleteKey(configPath, key);

  logger.log(
    `${symbols.success()} ${colors.success('Deleted')} ${colors.emphasis(key)} from ${configType} configuration ${colors.dim(`(${configPath})`)}`
  );
}
