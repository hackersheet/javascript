import path from 'path';

import { colors, symbols } from '../../utils/colors';
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
 * Key prefixes that must only be stored in user (global) configuration.
 * These contain sensitive credentials and should never be written to project config.
 */
const GLOBAL_ONLY_KEY_PREFIXES = ['workspaces', 'defaultWorkspace'] as const;

/**
 * Checks whether a configuration key belongs to global-only settings.
 *
 * @param key - The configuration key to check.
 * @returns True if the key is restricted to user (global) configuration.
 */
function isGlobalOnlyKey(key: string): boolean {
  return GLOBAL_ONLY_KEY_PREFIXES.some((prefix) => key === prefix || key.startsWith(`${prefix}.`));
}

/**
 * Resolves the target configuration path and type based on options.
 *
 * @param options - Command options.
 * @param getUserPath - Function to get user config path.
 * @param getProjectPath - Function to get project config path.
 * @param cwd - Function to get current working directory.
 * @returns The resolved config path and type.
 */
function resolveConfigTarget(
  options: ConfigSetOptions,
  getUserPath: typeof getUserConfigPath,
  getProjectPath: typeof getProjectConfigPath,
  cwd: () => string
): { configPath: string; configType: string } {
  if (options.global) {
    return { configPath: getUserPath(), configType: 'user' };
  }
  const projectPath = getProjectPath();
  const configPath = projectPath ?? path.join(cwd(), '.hackersheet', 'cli.config.json');
  return { configPath, configType: 'project' };
}

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

  const { configPath, configType } = resolveConfigTarget(options, getUserPath, getProjectPath, cwd);

  if (!options.global && isGlobalOnlyKey(key)) {
    logger.error(`${symbols.error()} ${colors.error(`"${key}" can only be set in user configuration.`)}`);
    logger.error(`   ${colors.hint('Use')} ${colors.emphasis('--global')} ${colors.hint('flag.')}`);
    return;
  }

  const parsedValue = parseValue(key, value);

  await update(configPath, key, parsedValue);

  logger.log(
    `${symbols.success()} ${colors.success('Updated')} ${colors.emphasis(key)} in ${configType} configuration ${colors.dim(`(${configPath})`)}`
  );
}
