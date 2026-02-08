import fs from 'fs';
import os from 'os';
import path from 'path';

const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * A single document entry in the cache.
 */
export type DocumentCacheItem = {
  /** Document slug. */
  slug: string;
  /** Document title. */
  title: string;
};

/**
 * Represents a single cache entry for a workspace.
 */
export type DocumentsCacheEntry = {
  documents: DocumentCacheItem[];
  timestamp: number;
  workspace: string;
};

/**
 * Represents the entire cache structure.
 */
export type DocumentsCache = Record<string, DocumentsCacheEntry>;

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
export function isCacheValid(entry: DocumentsCacheEntry, ttl: number, now: number): boolean {
  return now - entry.timestamp < ttl;
}

/**
 * Load documents from cache for a specific workspace.
 * Returns null if cache is missing, expired, invalid, or in old format.
 *
 * @param workspace - The workspace slug.
 * @param deps - Optional dependencies for testing.
 * @returns Array of documents if cache is valid, null otherwise.
 */
export function loadCache(workspace: string, deps?: Partial<CacheDeps>): DocumentCacheItem[] | null {
  const cachePath = getCachePath();
  const { fsApi, now } = {
    fsApi: {
      readFile: (filePath: string, encoding: string) => fs.readFileSync(filePath, encoding as BufferEncoding),
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
    const cache: DocumentsCache = JSON.parse(content);

    const entry = cache[workspace];
    if (!entry) {
      return null;
    }

    // Backward compatibility: old cache format had "slugs" field instead of "documents"
    if ('slugs' in (entry as unknown as Record<string, unknown>) && !('documents' in entry)) {
      return null;
    }

    if (!isCacheValid(entry, DEFAULT_TTL, now())) {
      return null;
    }

    return entry.documents;
  } catch {
    return null;
  }
}

/**
 * Save documents to cache for a specific workspace.
 *
 * @param workspace - The workspace slug.
 * @param documents - Array of documents to cache.
 * @param deps - Optional dependencies for testing.
 */
export async function saveCache(
  workspace: string,
  documents: DocumentCacheItem[],
  deps?: Partial<CacheDeps>
): Promise<void> {
  const cachePath = getCachePath();
  const cacheDir = getCacheDir();
  const { fsApi, now } = {
    fsApi: {
      readFile: (filePath: string, encoding: string) => fs.readFileSync(filePath, encoding as BufferEncoding),
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
    let cache: DocumentsCache = {};

    try {
      fsApi.access(cachePath);
      const content = fsApi.readFile(cachePath, 'utf8');
      cache = JSON.parse(content);
    } catch {
      // Cache file doesn't exist or is invalid, start fresh
      cache = {};
    }

    cache[workspace] = {
      documents,
      timestamp: now(),
      workspace,
    };

    fsApi.writeFile(cachePath, JSON.stringify(cache, null, 2));
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
      readFile: (filePath: string, encoding: string) => fs.readFileSync(filePath, encoding as BufferEncoding),
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

/**
 * Represents a cached document with full content.
 */
export type CachedDocument = {
  id: string;
  slug: string;
  title: string;
  content: string;
  draft: boolean;
  [key: string]: unknown;
};

/**
 * Get the directory path for cached documents.
 *
 * @param workspace - The workspace slug.
 * @returns The documents cache directory path.
 */
export function getDocumentsCacheDir(workspace: string): string {
  return path.join(getCacheDir(), 'documents', workspace);
}

/**
 * Load a document from cache by slug.
 *
 * @param workspace - The workspace slug.
 * @param slug - The document slug.
 * @returns The cached document if found, null otherwise.
 */
export function loadDocumentCache(workspace: string, slug: string): CachedDocument | null {
  const cacheDir = getDocumentsCacheDir(workspace);
  const cacheFile = path.join(cacheDir, `${slug}.json`);

  try {
    const content = fs.readFileSync(cacheFile, 'utf8');
    return JSON.parse(content) as CachedDocument;
  } catch {
    return null;
  }
}

/**
 * Save a document to cache by slug.
 *
 * @param workspace - The workspace slug.
 * @param slug - The document slug.
 * @param document - The document to cache.
 */
export async function saveDocumentCache(workspace: string, slug: string, document: CachedDocument): Promise<void> {
  const cacheDir = getDocumentsCacheDir(workspace);

  try {
    await fs.promises.mkdir(cacheDir, { recursive: true });
    const cacheFile = path.join(cacheDir, `${slug}.json`);
    await fs.promises.writeFile(cacheFile, JSON.stringify(document, null, 2), 'utf8');
  } catch {
    // Silently fail if we can't write to cache
  }
}

/**
 * Clear the documents cache directory for all workspaces.
 */
export async function clearDocumentsCache(): Promise<void> {
  const cacheDir = getCacheDir();
  const documentsDir = path.join(cacheDir, 'documents');

  try {
    // Recursively remove the entire documents directory
    if (fs.existsSync(documentsDir)) {
      fs.rmSync(documentsDir, { recursive: true, force: true });
    }
  } catch {
    // Directory doesn't exist or can't be deleted, ignore
  }
}
