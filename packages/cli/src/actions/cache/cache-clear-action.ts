import { clearCache, clearDocumentsCache } from '../../utils/cache';
import { colors, symbols } from '../../utils/colors';

import type { Logger } from '../../types/logger';

/**
 * Dependencies for the cacheClearAction function.
 */
export type CacheClearActionDeps = {
  logger: Logger;
  clearCacheFunc: typeof clearCache;
  clearDocumentsCacheFunc: typeof clearDocumentsCache;
};

const defaultDeps: CacheClearActionDeps = {
  logger: { log: console.log, error: console.error },
  clearCacheFunc: clearCache,
  clearDocumentsCacheFunc: clearDocumentsCache,
};

/**
 * Clear the CLI cache.
 *
 * This is the action handler for the `cache clear` command.
 * Deletes the cached slug data and document content to force a fresh fetch from the API.
 *
 * @param deps - Optional dependencies for testing.
 */
export async function cacheClearAction(deps: Partial<CacheClearActionDeps> = {}): Promise<void> {
  const { logger, clearCacheFunc, clearDocumentsCacheFunc } = { ...defaultDeps, ...deps };

  try {
    await clearCacheFunc();
    await clearDocumentsCacheFunc();
    logger.log(`${symbols.success()} ${colors.success('Cache cleared successfully!')}`);
  } catch (error) {
    logger.error(`${symbols.error()} ${colors.error('Failed to clear cache')}`);
    throw error;
  }
}
