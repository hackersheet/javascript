import { createClient } from '@hackersheet/core';

import { loadConfig, type Config, ConfigError } from '../utils/load-config';

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
 * Dependencies for the docsAction function.
 */
export type DocsActionDeps = {
  logger: Logger;
  exitHandler: ExitHandler;
  loadConfigFn: () => Config;
  createClientFn: typeof createClient;
};

const defaultDeps: DocsActionDeps = {
  logger: { log: console.log, error: console.error },
  exitHandler: { exit: (code) => process.exit(code) },
  loadConfigFn: loadConfig,
  createClientFn: createClient,
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
    return { slug, accessKey: config.workspaces[slug].accessKey };
  }

  // 4. Unable to resolve
  return null;
}

/**
 * Options for the docs action.
 */
export type DocsActionOptions = {
  /** Workspace slug to use (overrides default). */
  workspace?: string;
};

/**
 * Fetches and displays a document by its slug.
 *
 * This is the action handler for the `docs` command.
 * Retrieves document content from the Hacker Sheet API using the
 * configured workspace credentials.
 *
 * @param slug - The document slug to fetch.
 * @param options - Command options including workspace selection.
 * @param deps - Optional dependencies for testing.
 */
export async function docsAction(
  slug: string,
  options: DocsActionOptions = {},
  deps: Partial<DocsActionDeps> = {}
): Promise<void> {
  const { logger, exitHandler, loadConfigFn, createClientFn } = { ...defaultDeps, ...deps };

  if (!slug) {
    logger.error('Error: Missing required argument <slug>');
    logger.error('Usage: hscli docs <slug>');
    exitHandler.exit(1);
    return;
  }

  let config: Config;
  try {
    config = loadConfigFn();
  } catch (err) {
    if (err instanceof ConfigError) {
      logger.error(`Configuration error: ${err.message}`);
      if (err.configPath) {
        logger.error(`  File: ${err.configPath}`);
      }
    } else {
      logger.error(`Failed to load configuration: ${String(err)}`);
    }
    exitHandler.exit(1);
    return;
  }

  const resolved = resolveWorkspace(config, options.workspace);

  if (!resolved) {
    if (options.workspace) {
      logger.error(`Error: Workspace "${options.workspace}" is not configured.`);
    } else if (Object.keys(config.workspaces).length === 0) {
      logger.error('Error: No workspaces configured.');
    } else {
      logger.error('Error: Multiple workspaces configured but no default set.');
      logger.error('Use --workspace <slug> to specify which workspace to use,');
      logger.error('or set "defaultWorkspace" in your configuration.');
    }
    logger.error('Run "hscli setup" to configure your workspace.');
    exitHandler.exit(1);
    return;
  }

  const url = `https://api.hackersheet.com/${resolved.slug}/v1/graphql`;
  const client = createClientFn({
    url,
    accessKey: resolved.accessKey,
  });

  let result;
  try {
    result = await client.getDocument({ slug });
  } catch (err) {
    logger.error(`Error: Failed to connect to the API.`);
    logger.error(`  Details: ${String(err)}`);
    exitHandler.exit(1);
    return;
  }

  if (result.error) {
    logger.error(`Error: API returned an error.`);
    logger.error(`  Details: ${String(result.error)}`);
    exitHandler.exit(1);
    return;
  }

  if (result.document?.content === undefined) {
    logger.error(`Error: Document not found with slug "${slug}".`);
    exitHandler.exit(1);
    return;
  }

  logger.log(result.document.content);
}
