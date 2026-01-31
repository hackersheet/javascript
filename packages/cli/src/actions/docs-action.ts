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
 * Fetches and displays a document by its slug.
 *
 * This is the action handler for the `docs` command.
 * Retrieves document content from the Hacker Sheet API using the
 * configured workspace credentials.
 *
 * @param slug - The document slug to fetch.
 * @param deps - Optional dependencies for testing.
 */
export async function docsAction(slug?: string, deps: Partial<DocsActionDeps> = {}): Promise<void> {
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

  if (!config.workspaceSlug) {
    logger.error('Error: Workspace slug is not configured.');
    logger.error('Run "hscli setup" to configure your workspace.');
    exitHandler.exit(1);
    return;
  }

  if (!config.workspaceAccessKey) {
    logger.error('Error: Workspace access key is not configured.');
    logger.error('Run "hscli setup" to configure your workspace.');
    exitHandler.exit(1);
    return;
  }

  const url = `https://api.hackersheet.com/${config.workspaceSlug}/v1/graphql`;
  const client = createClientFn({
    url,
    accessKey: config.workspaceAccessKey,
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
