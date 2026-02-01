import path from 'path';

import { getUserConfigPath, getProjectConfigPath } from '../../utils/load-config';
import { updateConfigKey } from '../../utils/save-config';

/**
 * Logger interface for output, enabling dependency injection in tests.
 */
export type Logger = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

/**
 * Options for the config set command.
 */
export type ConfigSetOptions = {
  global?: boolean;
};

/**
 * Dependencies for the configSetAction function.
 */
export type ConfigSetActionDeps = {
  logger: Logger;
  getUserConfigPath: typeof getUserConfigPath;
  getProjectConfigPath: typeof getProjectConfigPath;
  updateConfigKey: typeof updateConfigKey;
  cwd: () => string;
};

const defaultDeps: ConfigSetActionDeps = {
  logger: { log: console.log, error: console.error },
  getUserConfigPath,
  getProjectConfigPath,
  updateConfigKey,
  cwd: () => process.cwd(),
};

/**
 * Keys that accept array values (comma-separated input).
 */
const ARRAY_KEYS = new Set(['docsDirs']);

/**
 * Parses a value string based on the key type.
 *
 * @param key - The configuration key.
 * @param value - The raw value string.
 * @returns The parsed value.
 */
function parseValue(key: string, value: string): unknown {
  const baseKey = key.split('.').pop() ?? key;

  if (ARRAY_KEYS.has(baseKey)) {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }

  return value;
}

/**
 * Sets a configuration value.
 *
 * This is the action handler for the `config set <key> <value>` command.
 * Updates the value in user or project configuration based on options.
 * Defaults to project configuration (local).
 *
 * @param key - The configuration key to set.
 * @param value - The value to set.
 * @param options - Command options.
 * @param deps - Optional dependencies for testing.
 */
export async function configSetAction(
  key: string,
  value: string,
  options: ConfigSetOptions = {},
  deps: Partial<ConfigSetActionDeps> = {}
): Promise<void> {
  const {
    logger,
    getUserConfigPath: getUserPath,
    getProjectConfigPath: getProjectPath,
    updateConfigKey: update,
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

  const parsedValue = parseValue(key, value);

  await update(configPath, key, parsedValue);

  logger.log(`Updated ${key} in ${configType} configuration (${configPath})`);
}
