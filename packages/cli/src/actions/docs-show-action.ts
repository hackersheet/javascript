import { createClient } from '@hackersheet/core';

import { loadDocumentCache, saveDocumentCache, type CachedDocument } from '../utils/cache';
import { colors, symbols } from '../utils/colors';
import { loadConfig, type Config, ConfigError } from '../utils/load-config';
import { resolveWorkspace } from '../utils/resolve-workspace';

/**
 * Logger interface for output, enabling dependency injection in tests.
 */
export type Logger = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

/**
 * Exit handler interface for process exit, enabling dependency injection in tests.
 */
export type ExitHandler = {
  exit: (code?: number) => void;
};

/**
 * Minimal client interface required by docsShowAction.
 */
type DocsShowClient = Pick<ReturnType<typeof createClient>, 'getDocument'>;

/**
 * Dependencies for the docsShowAction function.
 */
export type DocsShowActionDeps = {
  logger: Logger;
  exitHandler: ExitHandler;
  loadConfigFn: () => Config;
  createClientFn: (options: { url: string; accessKey: string }) => DocsShowClient;
  loadDocumentCacheFn: typeof loadDocumentCache;
  saveDocumentCacheFn: typeof saveDocumentCache;
};

const defaultDeps: DocsShowActionDeps = {
  logger: { log: console.log, error: console.error },
  exitHandler: { exit: (code) => process.exit(code) },
  loadConfigFn: loadConfig,
  createClientFn: createClient,
  loadDocumentCacheFn: loadDocumentCache,
  saveDocumentCacheFn: saveDocumentCache,
};

/**
 * Options for the docs action.
 */
export type DocsShowActionOptions = {
  /** Workspace slug to use (overrides default). */
  workspace?: string;
  /** Bypass cache and fetch from API, then update cache. */
  refresh?: boolean;
};

/**
 * Fetches and displays a document by its slug.
 *
 * This is the action handler for the `docs show` command.
 * Retrieves document content from the Hacker Sheet API using the
 * configured workspace credentials.
 *
 * @param slug - The document slug to fetch.
 * @param options - Command options including workspace selection.
 * @param deps - Optional dependencies for testing.
 */
export async function docsShowAction(
  slug: string,
  options: DocsShowActionOptions = {},
  deps: Partial<DocsShowActionDeps> = {}
): Promise<void> {
  const { logger, exitHandler, loadConfigFn, createClientFn, loadDocumentCacheFn, saveDocumentCacheFn } = {
    ...defaultDeps,
    ...deps,
  };

  if (!slug) {
    logger.error(`${symbols.error()} ${colors.error('Missing required argument')} ${colors.emphasis('<slug>')}`);
    logger.error(`${colors.hint('Usage: hscli docs <slug>')}`);
    exitHandler.exit(1);
    return;
  }

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

  // Try to load from cache first (unless refresh is requested)
  if (!options.refresh) {
    const cached = loadDocumentCacheFn(resolved.slug, slug);
    if (cached) {
      logger.log(cached.content);
      return;
    }
  }

  // Cache miss or refresh requested: fetch from API
  const url = `https://api.hackersheet.com/${resolved.slug}/v1/graphql`;
  const client = createClientFn({
    url,
    accessKey: resolved.accessKey,
  });

  let result;
  try {
    result = await client.getDocument({ slug });
  } catch (err) {
    logger.error(`${symbols.error()} ${colors.error('Failed to connect to the API.')}`);
    logger.error(`  ${colors.dim('Details:')} ${String(err)}`);
    exitHandler.exit(1);
    return;
  }

  if (result.error) {
    logger.error(`${symbols.error()} ${colors.error('API returned an error.')}`);
    logger.error(`  ${colors.dim('Details:')} ${String(result.error)}`);
    exitHandler.exit(1);
    return;
  }

  if (result.document?.content === undefined) {
    logger.error(`${symbols.error()} ${colors.error('Document not found with slug')} ${colors.emphasis(`"${slug}"`)}`);
    exitHandler.exit(1);
    return;
  }

  // Save to cache (fire and forget)
  const documentToCache: CachedDocument = {
    id: result.document.id,
    slug: result.document.slug,
    title: result.document.title,
    content: result.document.content,
    draft: result.document.draft,
  };
  saveDocumentCacheFn(resolved.slug, slug, documentToCache).catch(() => {
    // Silently ignore cache errors
  });

  logger.log(result.document.content);
}
