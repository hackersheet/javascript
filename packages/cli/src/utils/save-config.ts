import fs from 'fs/promises';
import path from 'path';

import { type Config, loadConfigFromPath } from './load-config';

/**
 * Minimal filesystem interface for dependency injection.
 */
export type FsLike = {
  mkdir: typeof fs.mkdir;
  writeFile: typeof fs.writeFile;
  readFile: typeof fs.readFile;
  access: typeof fs.access;
};

/**
 * Dependencies for save config functions.
 */
export type SaveConfigDeps = {
  fsApi: FsLike;
};

const defaultDeps: SaveConfigDeps = {
  fsApi: {
    mkdir: fs.mkdir,
    writeFile: fs.writeFile,
    readFile: fs.readFile,
    access: fs.access,
  },
};

/**
 * Saves configuration to the specified path.
 *
 * Creates parent directories if they don't exist.
 *
 * @param configPath - The path to the configuration file.
 * @param config - The configuration object to save.
 * @param deps - Optional dependencies for testing.
 */
export async function saveConfig(
  configPath: string,
  config: Partial<Config>,
  deps: Partial<SaveConfigDeps> = {}
): Promise<void> {
  const { fsApi } = { ...defaultDeps, ...deps };

  const dir = path.dirname(configPath);
  await fsApi.mkdir(dir, { recursive: true });

  const configJson = JSON.stringify(config, null, 2);
  await fsApi.writeFile(configPath, configJson, 'utf8');
}

/**
 * Sets a value at a nested path in an object.
 *
 * @param obj - The object to modify.
 * @param keyPath - Dot-separated path (e.g., "workspaces.my-workspace.accessKey").
 * @param value - The value to set.
 * @returns The modified object.
 */
function setNestedValue(obj: Record<string, unknown>, keyPath: string, value: unknown): Record<string, unknown> {
  const keys = keyPath.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;

  return obj;
}

/**
 * Deletes a value at a nested path in an object.
 *
 * @param obj - The object to modify.
 * @param keyPath - Dot-separated path (e.g., "workspaces.my-workspace.accessKey").
 * @returns The modified object.
 */
function deleteNestedValue(obj: Record<string, unknown>, keyPath: string): Record<string, unknown> {
  const keys = keyPath.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || typeof current[key] !== 'object' || current[key] === null) {
      return obj;
    }
    current = current[key] as Record<string, unknown>;
  }

  const lastKey = keys[keys.length - 1];
  delete current[lastKey];

  return obj;
}

/**
 * Updates a specific key in the configuration file.
 *
 * Loads the existing configuration, updates the specified key, and saves.
 * Creates the file if it doesn't exist.
 *
 * @param configPath - The path to the configuration file.
 * @param key - The key to update (supports dot notation for nested keys).
 * @param value - The value to set.
 * @param deps - Optional dependencies for testing.
 */
export async function updateConfigKey(
  configPath: string,
  key: string,
  value: unknown,
  deps: Partial<SaveConfigDeps> = {}
): Promise<void> {
  const existingConfig = loadConfigFromPath(configPath) ?? {};
  const updatedConfig = setNestedValue(existingConfig as Record<string, unknown>, key, value);
  await saveConfig(configPath, updatedConfig as Partial<Config>, deps);
}

/**
 * Deletes a specific key from the configuration file.
 *
 * Loads the existing configuration, removes the specified key, and saves.
 *
 * @param configPath - The path to the configuration file.
 * @param key - The key to delete (supports dot notation for nested keys).
 * @param deps - Optional dependencies for testing.
 */
export async function deleteConfigKey(
  configPath: string,
  key: string,
  deps: Partial<SaveConfigDeps> = {}
): Promise<void> {
  const existingConfig = loadConfigFromPath(configPath) ?? {};
  const updatedConfig = deleteNestedValue(existingConfig as Record<string, unknown>, key);
  await saveConfig(configPath, updatedConfig as Partial<Config>, deps);
}
