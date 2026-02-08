import { getCacheDir } from '../../utils/cache';
import { colors } from '../../utils/colors';
import { getUserConfigPath, getProjectConfigPath } from '../../utils/load-config';

/**
 * Logger interface for output, enabling dependency injection in tests.
 */
export type Logger = {
  log: (...args: unknown[]) => void;
};

/**
 * Options for the config path command.
 */
export type ConfigPathOptions = {
  global?: boolean;
  local?: boolean;
  cache?: boolean;
};

/**
 * Dependencies for the configPathAction function.
 */
export type ConfigPathActionDeps = {
  logger: Logger;
  getUserConfigPath: typeof getUserConfigPath;
  getProjectConfigPath: typeof getProjectConfigPath;
  getCacheDir: typeof getCacheDir;
};

const defaultDeps: ConfigPathActionDeps = {
  logger: { log: console.log },
  getUserConfigPath,
  getProjectConfigPath,
  getCacheDir,
};

/**
 * Displays configuration file and cache directory paths.
 *
 * This is the action handler for the `config path` command.
 * Shows the paths to user and/or project configuration files, and cache directory.
 *
 * @param options - Command options.
 * @param deps - Optional dependencies for testing.
 */
export async function configPathAction(
  options: ConfigPathOptions = {},
  deps: Partial<ConfigPathActionDeps> = {}
): Promise<void> {
  const {
    logger,
    getUserConfigPath: getUserPath,
    getProjectConfigPath: getProjectPath,
    getCacheDir: getCacheDirFn,
  } = {
    ...defaultDeps,
    ...deps,
  };

  const userConfigPath = getUserPath();
  const projectConfigPath = getProjectPath();
  const cacheDirPath = getCacheDirFn();

  if (options.cache) {
    logger.log(colors.path(cacheDirPath));
    return;
  }

  if (options.global) {
    logger.log(colors.path(userConfigPath));
    return;
  }

  if (options.local) {
    logger.log(projectConfigPath ? colors.path(projectConfigPath) : colors.dim('(not found)'));
    return;
  }

  // Default: show all paths
  logger.log(`${colors.info('User:')}    ${colors.path(userConfigPath)}`);
  logger.log(
    `${colors.info('Project:')} ${projectConfigPath ? colors.path(projectConfigPath) : colors.dim('(not found)')}`
  );
  logger.log(`${colors.info('Cache:')}   ${colors.path(cacheDirPath)}`);
}
