import fs from 'fs';
import path from 'path';

import envPaths from 'env-paths';
import { findUpSync } from 'find-up';

const paths = envPaths('hackersheet', { suffix: '' });

/**
 * Configuration object for the Hacker Sheet CLI.
 */
export type Config = {
  /** The workspace slug for API access. */
  workspaceSlug: string;
  /** The access key for authenticating with the workspace API. */
  workspaceAccessKey: string;
  /** Mustache template for generating new document filenames. */
  newFilenameTemplate: string;
  /** Optional path (relative to project root) to a mustache template used for new file content. */
  newFileTemplatePath?: string;
  /** List of directories where documents can be created. */
  docsDirs: string[];
};

/**
 * Error thrown when configuration loading fails.
 */
export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly configPath?: string
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Default empty configuration.
 */
export const EMPTY_CONFIG: Config = {
  workspaceSlug: '',
  workspaceAccessKey: '',
  newFilenameTemplate: '',
  docsDirs: [],
};

/**
 * Returns the user config file path.
 *
 * @returns The path to the user configuration file.
 */
export function getUserConfigPath(): string {
  return path.join(paths.config, 'cli.config.json');
}

/**
 * Validates and extracts partial configuration from an unknown value.
 *
 * @param value - The value to validate.
 * @param configPath - Path to the config file for error messages.
 * @returns The validated partial configuration.
 * @throws {ConfigError} If validation fails.
 */
function validatePartialConfig(value: unknown, configPath: string): Partial<Config> {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigError(`Invalid configuration: expected object, got ${typeof value}`, configPath);
  }

  const obj = value as Record<string, unknown>;
  const result: Partial<Config> = {};

  if (typeof obj.workspaceSlug === 'string') {
    result.workspaceSlug = obj.workspaceSlug;
  }
  if (typeof obj.workspaceAccessKey === 'string') {
    result.workspaceAccessKey = obj.workspaceAccessKey;
  }
  if (typeof obj.newFilenameTemplate === 'string') {
    result.newFilenameTemplate = obj.newFilenameTemplate;
  }
  if (typeof obj.newFileTemplatePath === 'string') {
    result.newFileTemplatePath = obj.newFileTemplatePath;
  }
  if (Array.isArray(obj.docsDirs)) {
    result.docsDirs = obj.docsDirs.filter((d): d is string => typeof d === 'string');
  }

  return result;
}

/**
 * Loads configuration from a specific file path.
 *
 * @param configPath - The path to the configuration file.
 * @returns The parsed partial configuration, or null if the file does not exist.
 * @throws {ConfigError} If the file exists but cannot be read or parsed.
 */
export function loadConfigFromPath(configPath: string): Partial<Config> | null {
  if (!fs.existsSync(configPath)) {
    return null;
  }

  let content: string;
  try {
    content = fs.readFileSync(configPath, 'utf8');
  } catch (err) {
    throw new ConfigError(`Failed to read configuration file: ${String(err)}`, configPath);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new ConfigError(`Invalid JSON in configuration file: ${String(err)}`, configPath);
  }

  return validatePartialConfig(parsed, configPath);
}

/**
 * Loads the user configuration from the user config directory.
 *
 * @returns The parsed partial configuration, or an empty object if not found.
 * @throws {ConfigError} If the file exists but is invalid.
 */
export function loadUserConfig(): Partial<Config> {
  const configPath = getUserConfigPath();
  return loadConfigFromPath(configPath) ?? {};
}

/**
 * Loads the project configuration from `.hackersheet/cli.config.json`.
 *
 * @returns The parsed partial configuration, or an empty object if not found.
 * @throws {ConfigError} If the file exists but is invalid.
 */
export function loadProjectConfig(): Partial<Config> {
  const dir = findUpSync('.hackersheet', { cwd: process.cwd(), type: 'directory' });
  if (!dir) {
    return {};
  }

  const configPath = path.join(dir, 'cli.config.json');
  return loadConfigFromPath(configPath) ?? {};
}

/**
 * Loads the CLI configuration by merging user and project configurations.
 *
 * Configuration is loaded from two sources:
 * 1. User config: `~/.config/hackersheet/cli.config.json` (base)
 * 2. Project config: `.hackersheet/cli.config.json` (overrides)
 *
 * Project configuration takes precedence over user configuration (shallow merge).
 *
 * @returns The merged configuration object.
 * @throws {ConfigError} If a configuration file exists but is invalid JSON or has an invalid structure.
 */
export function loadConfig(): Config {
  const userConfig = loadUserConfig();
  const projectConfig = loadProjectConfig();

  return {
    ...EMPTY_CONFIG,
    ...userConfig,
    ...projectConfig,
  };
}
