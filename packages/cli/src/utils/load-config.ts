import fs from 'fs';
import path from 'path';

import { findUpSync } from 'find-up';

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
const EMPTY_CONFIG: Config = {
  workspaceSlug: '',
  workspaceAccessKey: '',
  newFilenameTemplate: '',
  docsDirs: [],
};

/**
 * Validates the configuration object structure.
 *
 * @param value - The value to validate.
 * @param configPath - Path to the config file for error messages.
 * @returns The validated configuration.
 * @throws {ConfigError} If validation fails.
 */
function validateConfig(value: unknown, configPath: string): Config {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigError(`Invalid configuration: expected object, got ${typeof value}`, configPath);
  }

  const obj = value as Record<string, unknown>;

  // Validate required string fields with defaults
  const workspaceSlug = typeof obj.workspaceSlug === 'string' ? obj.workspaceSlug : '';
  const workspaceAccessKey = typeof obj.workspaceAccessKey === 'string' ? obj.workspaceAccessKey : '';
  const newFilenameTemplate = typeof obj.newFilenameTemplate === 'string' ? obj.newFilenameTemplate : '';

  // Validate optional string field
  const newFileTemplatePath =
    obj.newFileTemplatePath === undefined
      ? undefined
      : typeof obj.newFileTemplatePath === 'string'
        ? obj.newFileTemplatePath
        : undefined;

  // Validate docsDirs array
  let docsDirs: string[] = [];
  if (Array.isArray(obj.docsDirs)) {
    docsDirs = obj.docsDirs.filter((d): d is string => typeof d === 'string');
  }

  return {
    workspaceSlug,
    workspaceAccessKey,
    newFilenameTemplate,
    newFileTemplatePath,
    docsDirs,
  };
}

/**
 * Loads the CLI configuration from `.hackersheet/cli.config.json`.
 *
 * Searches for the `.hackersheet` directory starting from the current
 * working directory and traversing up. If found, reads and parses the
 * `cli.config.json` file.
 *
 * @returns The parsed configuration object, or an empty config if not found.
 * @throws {ConfigError} If the configuration file exists but is invalid JSON or has an invalid structure.
 */
export function loadConfig(): Config {
  const dir = findUpSync('.hackersheet', { cwd: process.cwd(), type: 'directory' });
  if (!dir) return EMPTY_CONFIG;

  const configPath = path.join(dir, 'cli.config.json');
  if (!fs.existsSync(configPath)) return EMPTY_CONFIG;

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

  return validateConfig(parsed, configPath);
}
