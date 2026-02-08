import fs from 'fs';
import os from 'os';
import path from 'path';

const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Represents a single cache entry for a workspace.
 */
export type SlugsCacheEntry = {
  slugs: string[];
  timestamp: number;
  workspace: string;
};

/**
 * Represents the entire cache structure.
 */
export type SlugsCache = Record<string, SlugsCacheEntry>;

/**
 * Dependencies for cache operations (for testing).
 */
export type CacheDeps = {
  fsApi: {
    readFile: (path: string, encoding: string) => string;
    writeFile: (path: string, data: string) => void;
    mkdir: (path: string, options?: { recursive?: boolean }) => void;
    unlink: (path: string) => void;
    access: (path: string) => void;
  };
  now: () => number;
};

/**
 * Get the cache directory path following XDG Base Directory spec.
 * Falls back to ~/.cache/hackersheet if XDG_CACHE_HOME is not set.
 *
 * @returns The cache directory path.
 */
export function getCacheDir(): string {
  const xdgCacheHome = process.env.XDG_CACHE_HOME;
  const home = os.homedir();

  if (xdgCacheHome) {
    return path.join(xdgCacheHome, 'hackersheet');
  }

  return path.join(home, '.cache', 'hackersheet');
}

/**
 * Get the full path to the slugs cache file.
 *
 * @returns The cache file path.
 */
export function getCachePath(): string {
  return path.join(getCacheDir(), 'slugs-cache.json');
}

/**
 * Check if a cache entry is still valid based on TTL.
 *
 * @param entry - The cache entry to validate.
 * @param ttl - Time to live in milliseconds.
 * @param now - Current timestamp in milliseconds.
 * @returns True if the cache entry is still valid.
 */
export function isCacheValid(entry: SlugsCacheEntry, ttl: number, now: number): boolean {
  return now - entry.timestamp < ttl;
}

/**
 * Load slugs from cache for a specific workspace.
 * Returns null if cache is missing, expired, or invalid.
 *
 * @param workspace - The workspace slug.
 * @param deps - Optional dependencies for testing.
 * @returns Array of slugs if cache is valid, null otherwise.
 */
export function loadCache(workspace: string, deps?: Partial<CacheDeps>): string[] | null {
  const cachePath = getCachePath();
  const { fsApi, now } = {
    fsApi: {
      readFile: (filePath: string, encoding: string) =>
        fs.readFileSync(filePath, encoding as BufferEncoding),
      writeFile: (filePath: string, data: string) => fs.writeFileSync(filePath, data, 'utf8'),
      mkdir: (filePath: string, options?: { recursive?: boolean }) => fs.mkdirSync(filePath, options),
      unlink: (filePath: string) => fs.unlinkSync(filePath),
      access: (filePath: string) => fs.accessSync(filePath),
    },
    now: () => Date.now(),
    ...deps,
  };

  try {
    fsApi.access(cachePath);
  } catch {
    return null;
  }

  try {
    const content = fsApi.readFile(cachePath, 'utf8');
    const cache: SlugsCache = JSON.parse(content);

    const entry = cache[workspace];
    if (!entry) {
      return null;
    }

    if (!isCacheValid(entry, DEFAULT_TTL, now())) {
      return null;
    }

    return entry.slugs;
  } catch {
    return null;
  }
}

/**
 * Save slugs to cache for a specific workspace.
 *
 * @param workspace - The workspace slug.
 * @param slugs - Array of document slugs to cache.
 * @param deps - Optional dependencies for testing.
 */
export async function saveCache(workspace: string, slugs: string[], deps?: Partial<CacheDeps>): Promise<void> {
  const cachePath = getCachePath();
  const cacheDir = getCacheDir();
  const { fsApi, now } = {
    fsApi: {
      readFile: (filePath: string, encoding: string) =>
        fs.readFileSync(filePath, encoding as BufferEncoding),
      writeFile: (filePath: string, data: string) => fs.writeFileSync(filePath, data, 'utf8'),
      mkdir: (filePath: string, options?: { recursive?: boolean }) => fs.mkdirSync(filePath, options),
      unlink: (filePath: string) => fs.unlinkSync(filePath),
      access: (filePath: string) => fs.accessSync(filePath),
    },
    now: () => Date.now(),
    ...deps,
  };

  try {
    fsApi.mkdir(cacheDir, { recursive: true });
  } catch {
    // Directory creation failed, silently continue
    return;
  }

  try {
    let cache: SlugsCache = {};

    try {
      fsApi.access(cachePath);
      const content = fsApi.readFile(cachePath, 'utf8');
      cache = JSON.parse(content);
    } catch {
      // Cache file doesn't exist or is invalid, start fresh
      cache = {};
    }

    cache[workspace] = {
      slugs,
      timestamp: now(),
      workspace,
    };

    fsApi.writeFile(cachePath, JSON.stringify(cache));
  } catch {
    // Silently fail if we can't write to cache
  }
}

/**
 * Clear the entire cache file.
 *
 * @param deps - Optional dependencies for testing.
 */
export async function clearCache(deps?: Partial<CacheDeps>): Promise<void> {
  const cachePath = getCachePath();
  const { fsApi } = {
    fsApi: {
      readFile: (filePath: string, encoding: string) =>
        fs.readFileSync(filePath, encoding as BufferEncoding),
      writeFile: (filePath: string, data: string) => fs.writeFileSync(filePath, data, 'utf8'),
      mkdir: (filePath: string, options?: { recursive?: boolean }) => fs.mkdirSync(filePath, options),
      unlink: (filePath: string) => fs.unlinkSync(filePath),
      access: (filePath: string) => fs.accessSync(filePath),
    },
    ...deps,
  };

  try {
    fsApi.access(cachePath);
    fsApi.unlink(cachePath);
  } catch {
    // File doesn't exist or can't be deleted, ignore
  }
}
