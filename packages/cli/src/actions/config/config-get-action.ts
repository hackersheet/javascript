import { type Config, loadUserConfig, loadProjectConfig, loadConfig } from '../../utils/load-config';

/**
 * Logger interface for output, enabling dependency injection in tests.
 */
export type Logger = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

/**
 * Options for the config get command.
 */
export type ConfigGetOptions = {
  global?: boolean;
  local?: boolean;
};

/**
 * Dependencies for the configGetAction function.
 */
export type ConfigGetActionDeps = {
  logger: Logger;
  loadUserConfig: typeof loadUserConfig;
  loadProjectConfig: typeof loadProjectConfig;
  loadConfig: typeof loadConfig;
};

const defaultDeps: ConfigGetActionDeps = {
  logger: { log: console.log, error: console.error },
  loadUserConfig,
  loadProjectConfig,
  loadConfig,
};

/**
 * Gets a value at a nested path in an object.
 *
 * @param obj - The object to search.
 * @param keyPath - Dot-separated path (e.g., "workspaces.my-workspace.accessKey").
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
 * Formats a configuration value for display.
 *
 * @param value - The value to format.
 * @returns The formatted string.
 */
function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

/**
 * Gets a configuration value by key.
 *
 * This is the action handler for the `config get <key>` command.
 * Retrieves the value from merged, user, or project configuration based on options.
 *
 * @param key - The configuration key to retrieve.
 * @param options - Command options.
 * @param deps - Optional dependencies for testing.
 */
export async function configGetAction(
  key: string,
  options: ConfigGetOptions = {},
  deps: Partial<ConfigGetActionDeps> = {}
): Promise<void> {
  const {
    logger,
    loadUserConfig: loadUser,
    loadProjectConfig: loadProject,
    loadConfig: loadMerged,
  } = { ...defaultDeps, ...deps };

  let config: Partial<Config>;
  if (options.global) {
    config = loadUser();
  } else if (options.local) {
    config = loadProject();
  } else {
    config = loadMerged();
  }

  const value = getNestedValue(config as Record<string, unknown>, key);

  if (value === undefined) {
    logger.error(`Key not found: ${key}`);
    return;
  }

  logger.log(formatValue(value));
}
