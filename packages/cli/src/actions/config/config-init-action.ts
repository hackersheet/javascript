import fs from 'fs/promises';
import path from 'path';

import { input, confirm } from '@inquirer/prompts';

import { type Config, getUserConfigPath, getProjectConfigPath, loadConfigFromPath } from '../../utils/load-config';
import { saveConfig } from '../../utils/save-config';

/**
 * Minimal filesystem interface for dependency injection.
 */
export type FsLike = {
  mkdir: typeof fs.mkdir;
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
};

/**
 * Options for the config init command.
 */
export type ConfigInitOptions = {
  global?: boolean;
};

/**
 * Dependencies for the configInitAction function.
 */
export type ConfigInitActionDeps = {
  fsApi: FsLike;
  prompts: Prompts;
  logger: Logger;
  getUserConfigPath: typeof getUserConfigPath;
  getProjectConfigPath: typeof getProjectConfigPath;
  loadConfigFromPath: typeof loadConfigFromPath;
  saveConfig: typeof saveConfig;
  cwd: () => string;
};

const defaultDeps: ConfigInitActionDeps = {
  fsApi: { mkdir: fs.mkdir, access: fs.access },
  prompts: { input, confirm },
  logger: { log: console.log },
  getUserConfigPath,
  getProjectConfigPath,
  loadConfigFromPath,
  saveConfig,
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

/**
 * Options for the configuration wizard.
 */
export type ConfigWizardOptions = {
  confirmMessage?: string;
  headerMessage?: string;
};

/**
 * Result of the interactive configuration initialization.
 */
export type ConfigInitResult = {
  config: Partial<Config>;
  configPath: string;
  cancelled: boolean;
};

/**
 * Runs the interactive configuration wizard.
 *
 * This function gathers configuration through prompts and returns the result.
 * It can be used by both `config init` and `setup` commands.
 *
 * @param configPath - Path where the config will be saved.
 * @param deps - Dependencies for testing.
 * @param options - Options for customizing wizard messages.
 * @returns The configuration result.
 */
export async function runConfigWizard(
  configPath: string,
  deps: Partial<ConfigInitActionDeps> = {},
  options: ConfigWizardOptions = {}
): Promise<ConfigInitResult> {
  const { fsApi, prompts, logger, loadConfigFromPath: loadFromPath } = { ...defaultDeps, ...deps };

  const confirmMessage = options.confirmMessage ?? 'Configuration file already exists. Overwrite?';
  const headerMessage = options.headerMessage ?? '\n📝 Configuration Setup\n';

  const configExists = await fileExists(configPath, fsApi);
  if (configExists) {
    const overwrite = await prompts.confirm({
      message: confirmMessage,
      default: false,
    });
    if (!overwrite) {
      return { config: {}, configPath, cancelled: true };
    }
  }

  const existingConfig = loadFromPath(configPath) ?? {};

  logger.log(headerMessage);

  const workspaceSlug = await prompts.input({
    message: 'Workspace slug (optional, for API access)',
    default: existingConfig.defaultWorkspace ?? '',
  });

  const existingAccessKey = workspaceSlug && existingConfig.workspaces?.[workspaceSlug]?.accessKey;
  const accessKey = await prompts.input({
    message: 'Workspace access key (optional, for API access)',
    default: existingAccessKey ?? '',
  });

  const newFilenameTemplate = await prompts.input({
    message: 'New document filename template',
    default: existingConfig.newFilenameTemplate ?? DEFAULT_CONFIG.newFilenameTemplate,
  });

  const docsDirsInput = await prompts.input({
    message: 'Document directories (comma-separated)',
    default: existingConfig.docsDirs?.join(', ') ?? 'docs',
  });

  const docsDirs = docsDirsInput
    .split(',')
    .map((d) => d.trim())
    .filter((d) => d.length > 0);

  const workspaces: Config['workspaces'] = {};
  let defaultWorkspace: string | undefined;

  if (workspaceSlug && accessKey) {
    workspaces[workspaceSlug] = { accessKey };
    defaultWorkspace = workspaceSlug;
  }

  const config: Partial<Config> = {
    workspaces,
    ...(defaultWorkspace && { defaultWorkspace }),
    newFilenameTemplate: newFilenameTemplate || DEFAULT_CONFIG.newFilenameTemplate,
    docsDirs: docsDirs.length > 0 ? docsDirs : DEFAULT_CONFIG.docsDirs,
  };

  return { config, configPath, cancelled: false };
}

/**
 * Initializes configuration interactively.
 *
 * This is the action handler for the `config init` command.
 * Runs an interactive wizard to create or update configuration.
 *
 * @param options - Command options.
 * @param deps - Optional dependencies for testing.
 */
export async function configInitAction(
  options: ConfigInitOptions = {},
  deps: Partial<ConfigInitActionDeps> = {}
): Promise<void> {
  const {
    fsApi,
    logger,
    getUserConfigPath: getUserPath,
    getProjectConfigPath: getProjectPath,
    saveConfig: save,
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

  const result = await runConfigWizard(configPath, deps);

  if (result.cancelled) {
    return;
  }

  const dir = path.dirname(configPath);
  await fsApi.mkdir(dir, { recursive: true });

  await save(configPath, result.config);

  logger.log(`\n✨ ${configType.charAt(0).toUpperCase() + configType.slice(1)} configuration initialized!`);
  logger.log(`   Config: ${configPath}`);
}
