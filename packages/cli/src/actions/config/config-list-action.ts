import {
  type Config,
  getUserConfigPath,
  getProjectConfigPath,
  loadUserConfig,
  loadProjectConfig,
  loadConfig,
} from '../../utils/load-config';

/**
 * Logger interface for output, enabling dependency injection in tests.
 */
export type Logger = {
  log: (...args: unknown[]) => void;
};

/**
 * Options for the config list command.
 */
export type ConfigListOptions = {
  global?: boolean;
  local?: boolean;
  json?: boolean;
};

/**
 * Dependencies for the configListAction function.
 */
export type ConfigListActionDeps = {
  logger: Logger;
  loadUserConfig: typeof loadUserConfig;
  loadProjectConfig: typeof loadProjectConfig;
  loadConfig: typeof loadConfig;
  getUserConfigPath: typeof getUserConfigPath;
  getProjectConfigPath: typeof getProjectConfigPath;
};

const defaultDeps: ConfigListActionDeps = {
  logger: { log: console.log },
  loadUserConfig,
  loadProjectConfig,
  loadConfig,
  getUserConfigPath,
  getProjectConfigPath,
};

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
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Displays configuration key-value pairs.
 *
 * @param config - The configuration to display.
 * @param logger - The logger instance.
 */
function displayConfig(config: Partial<Config>, logger: Logger): void {
  const entries: Array<[string, unknown]> = [];

  if (config.defaultWorkspace !== undefined) {
    entries.push(['defaultWorkspace', config.defaultWorkspace]);
  }
  if (config.newFilenameTemplate !== undefined) {
    entries.push(['newFilenameTemplate', config.newFilenameTemplate]);
  }
  if (config.newFileTemplatePath !== undefined) {
    entries.push(['newFileTemplatePath', config.newFileTemplatePath]);
  }
  if (config.docsDirs !== undefined && config.docsDirs.length > 0) {
    entries.push(['docsDirs', config.docsDirs]);
  }

  if (entries.length === 0 && (!config.workspaces || Object.keys(config.workspaces).length === 0)) {
    logger.log('  (no configuration set)');
    return;
  }

  for (const [key, value] of entries) {
    logger.log(`  ${key} = ${formatValue(value)}`);
  }

  if (config.workspaces && Object.keys(config.workspaces).length > 0) {
    logger.log('');
    logger.log('Workspaces:');
    for (const slug of Object.keys(config.workspaces)) {
      const isDefault = config.defaultWorkspace === slug;
      logger.log(`  ${slug}${isDefault ? ' (default)' : ''}`);
    }
  }
}

/**
 * Lists all configuration values.
 *
 * This is the action handler for the `config list` command.
 * Displays merged, user, or project configuration based on options.
 *
 * @param options - Command options.
 * @param deps - Optional dependencies for testing.
 */
export async function configListAction(
  options: ConfigListOptions = {},
  deps: Partial<ConfigListActionDeps> = {}
): Promise<void> {
  const {
    logger,
    loadUserConfig: loadUser,
    loadProjectConfig: loadProject,
    loadConfig: loadMerged,
    getUserConfigPath: getUserPath,
    getProjectConfigPath: getProjectPath,
  } = { ...defaultDeps, ...deps };

  const userConfigPath = getUserPath();
  const projectConfigPath = getProjectPath();

  if (options.json) {
    let config: Partial<Config>;
    if (options.global) {
      config = loadUser();
    } else if (options.local) {
      config = loadProject();
    } else {
      config = loadMerged();
    }
    logger.log(JSON.stringify(config, null, 2));
    return;
  }

  if (options.global) {
    logger.log('');
    logger.log('User configuration:');
    logger.log('');
    const config = loadUser();
    displayConfig(config, logger);
    logger.log('');
    logger.log(`Config file: ${userConfigPath}`);
    logger.log('');
    return;
  }

  if (options.local) {
    logger.log('');
    logger.log('Project configuration:');
    logger.log('');
    const config = loadProject();
    displayConfig(config, logger);
    logger.log('');
    logger.log(`Config file: ${projectConfigPath ?? '(not found)'}`);
    logger.log('');
    return;
  }

  // Default: show merged configuration
  const config = loadMerged();

  logger.log('');
  logger.log('Configuration (merged):');
  logger.log('');
  displayConfig(config, logger);
  logger.log('');
  logger.log('Config files:');
  logger.log(`  User:    ${userConfigPath}`);
  logger.log(`  Project: ${projectConfigPath ?? '(not found)'}`);
  logger.log('');
}
