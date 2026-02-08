import { createClient } from '@hackersheet/core';

import { loadCache, saveCache, type DocumentCacheItem } from '../utils/cache';
import { colors, symbols } from '../utils/colors';
import { loadConfig, type Config, ConfigError } from '../utils/load-config';

import type { Logger } from '../types/logger';

/**
 * Exit handler interface for process exit, enabling dependency injection in tests.
 */
export type ExitHandler = {
  exit: (code?: number) => void;
};

/**
 * Dependencies for the docsListAction function.
 */
export type DocsListActionDeps = {
  logger: Logger;
  exitHandler: ExitHandler;
  loadConfigFn: () => Config;
  createClientFn: typeof createClient;
  loadCacheFn: (workspace: string) => DocumentCacheItem[] | null;
  saveCacheFn: (workspace: string, documents: DocumentCacheItem[]) => Promise<void>;
};

const defaultDeps: DocsListActionDeps = {
  logger: { log: console.log, error: console.error },
  exitHandler: { exit: (code) => process.exit(code) },
  loadConfigFn: loadConfig,
  createClientFn: createClient,
  loadCacheFn: loadCache,
  saveCacheFn: saveCache,
};

/**
 * Resolved workspace information.
 */
type ResolvedWorkspace = {
  slug: string;
  accessKey: string;
};

/**
 * Resolves the workspace to use based on options and config.
 *
 * Resolution order:
 * 1. --workspace option if specified
 * 2. defaultWorkspace if configured
 * 3. Single workspace if only one exists
 * 4. null if none of the above
 *
 * @param config - The loaded configuration.
 * @param workspaceOption - The workspace slug from CLI option.
 * @returns The resolved workspace or null.
 */
function resolveWorkspace(config: Config, workspaceOption?: string): ResolvedWorkspace | null {
  const workspaceSlugs = Object.keys(config.workspaces);

  // 1. --workspace option specified
  if (workspaceOption) {
    const workspace = config.workspaces[workspaceOption];
    if (!workspace) return null;
    return { slug: workspaceOption, accessKey: workspace.accessKey };
  }

  // 2. defaultWorkspace configured
  if (config.defaultWorkspace) {
    const workspace = config.workspaces[config.defaultWorkspace];
    if (!workspace) return null;
    return { slug: config.defaultWorkspace, accessKey: workspace.accessKey };
  }

  // 3. Single workspace auto-select
  if (workspaceSlugs.length === 1) {
    const slug = workspaceSlugs[0];
    const workspace = config.workspaces[slug];
    return { slug, accessKey: workspace.accessKey };
  }

  // 4. Unable to resolve
  return null;
}

/**
 * Fetches all documents using cursor-based pagination with caching.
 *
 * @param workspace - The resolved workspace.
 * @param deps - Partial dependencies for testing.
 * @returns Array of documents with slug and title.
 */
async function fetchAllDocuments(
  workspace: ResolvedWorkspace,
  deps: Partial<DocsListActionDeps>
): Promise<DocumentCacheItem[]> {
  const { createClientFn, loadCacheFn, saveCacheFn } = {
    ...defaultDeps,
    ...deps,
  };

  // 1. Try to load from cache first
  const cached = loadCacheFn(workspace.slug);
  if (cached) {
    return cached;
  }

  // 2. Fetch from API with cursor-based pagination to get all documents
  try {
    const url = `https://api.hackersheet.com/${workspace.slug}/v1/graphql`;
    const client = createClientFn({
      url,
      accessKey: workspace.accessKey,
    });

    const allDocuments: DocumentCacheItem[] = [];
    let after: string | undefined = undefined;
    const pageSize = 100; // Fetch 100 documents per request

    // Iterate through all pages
    while (true) {
      const { documents, error } = await client.getDocuments({
        filter: { draft: false },
        first: pageSize,
        after,
      });

      if (error || !documents || documents.length === 0) {
        break;
      }

      // Extract slug and title from each document
      const batch: DocumentCacheItem[] = documents.map((doc) => ({
        slug: doc.slug,
        title: doc.title,
      }));

      allDocuments.push(...batch);

      // If we got fewer documents than the page size, we've reached the end
      if (documents.length < pageSize) {
        break;
      }

      // Prepare for the next page: use the last document's ID as the cursor
      const lastDoc = documents[documents.length - 1];
      after = lastDoc.id;
    }

    // 3. Save to cache (fire and forget)
    saveCacheFn(workspace.slug, allDocuments).catch(() => {
      // Silently ignore cache errors
    });

    return allDocuments;
  } catch {
    return [];
  }
}

/**
 * Options for the docs list action.
 */
export type DocsListActionOptions = {
  /** Workspace slug to use (overrides default). */
  workspace?: string;
};

/**
 * Lists all available documents with their slugs and titles.
 *
 * This is the action handler for the `docs list` command.
 * Displays a table of available documents with slug and title columns.
 *
 * @param options - Command options including workspace selection.
 * @param deps - Optional dependencies for testing.
 */
export async function docsListAction(
  options: DocsListActionOptions = {},
  deps: Partial<DocsListActionDeps> = {}
): Promise<void> {
  const { logger, exitHandler, loadConfigFn, createClientFn, loadCacheFn, saveCacheFn } = {
    ...defaultDeps,
    ...deps,
  };

  let config: Config;
  try {
    config = loadConfigFn();
  } catch (err) {
    if (err instanceof ConfigError) {
      logger.error(`${symbols.error()} ${colors.error('Configuration error:')} ${err.message}`);
      if (err.configPath) {
        logger.error(`  File: ${colors.path(err.configPath)}`);
      }
    } else {
      logger.error(`${symbols.error()} ${colors.error('Failed to load configuration:')} ${String(err)}`);
    }
    exitHandler.exit(1);
    return;
  }

  const resolved = resolveWorkspace(config, options.workspace);

  if (!resolved) {
    if (options.workspace) {
      logger.error(
        `${symbols.error()} ${colors.error('Workspace')} ${colors.emphasis(`"${options.workspace}"`)} ${colors.error('is not configured.')}`
      );
    } else if (Object.keys(config.workspaces).length === 0) {
      logger.error(`${symbols.error()} ${colors.error('No workspaces configured.')}`);
    } else {
      logger.error(`${symbols.error()} ${colors.error('Multiple workspaces configured but no default set.')}`);
      logger.error(colors.hint('Use --workspace <slug> to specify which workspace to use,'));
      logger.error(colors.hint('or set "defaultWorkspace" in your configuration.'));
    }
    logger.error(colors.hint('Run "hscli setup" to configure your workspace.'));
    exitHandler.exit(1);
    return;
  }

  // Fetch all documents with caching
  const documents = await fetchAllDocuments(resolved, {
    createClientFn,
    loadCacheFn,
    saveCacheFn,
  });

  if (documents.length === 0) {
    logger.log(`${symbols.info()} ${colors.hint('No documents found.')}`);
    return;
  }

  // Display documents in a table format
  logger.log('');
  logger.log(`${colors.emphasis('Available Documents')} (${colors.success(String(documents.length))} total)`);
  logger.log('');

  // Calculate column widths
  const maxSlugLength = Math.max(4, Math.max(...documents.map((d) => d.slug.length)));
  const maxTitleLength = Math.max(5, Math.max(...documents.map((d) => d.title.length)));

  // Print header
  const slugHeader = 'SLUG'.padEnd(maxSlugLength);
  const titleHeader = 'TITLE'.padEnd(maxTitleLength);
  logger.log(`  ${colors.emphasis(slugHeader)}  ${colors.emphasis(titleHeader)}`);
  logger.log(`  ${'-'.repeat(maxSlugLength)}  ${'-'.repeat(maxTitleLength)}`);

  // Print rows
  for (const doc of documents) {
    const slugCol = doc.slug.padEnd(maxSlugLength);
    const titleCol = doc.title.padEnd(maxTitleLength);
    logger.log(`  ${colors.path(slugCol)}  ${titleCol}`);
  }

  logger.log('');
}
