import { createClient } from '@hackersheet/core';
import tabtab from '@pnpm/tabtab';

import { loadCache, saveCache, type DocumentCacheItem } from './utils/cache';
import { loadConfig, type Config } from './utils/load-config';

/**
 * Resolved workspace information.
 */
type ResolvedWorkspace = {
  slug: string;
  accessKey: string;
};

/**
 * Dependencies for the completionHandler function.
 */
export type CompletionHandlerDeps = {
  loadConfigFn: () => Config;
  createClientFn: typeof createClient;
  loadCacheFn: (workspace: string) => DocumentCacheItem[] | null;
  saveCacheFn: (workspace: string, documents: DocumentCacheItem[]) => Promise<void>;
};

const defaultDeps: CompletionHandlerDeps = {
  loadConfigFn: loadConfig,
  createClientFn: createClient,
  loadCacheFn: loadCache,
  saveCacheFn: saveCache,
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
    return {
      slug: workspaceOption,
      accessKey: workspace.accessKey,
    };
  }

  // 2. defaultWorkspace configured
  if (config.defaultWorkspace) {
    const workspace = config.workspaces[config.defaultWorkspace];
    if (!workspace) return null;
    return {
      slug: config.defaultWorkspace,
      accessKey: workspace.accessKey,
    };
  }

  // 3. Single workspace auto-select
  if (workspaceSlugs.length === 1) {
    const slug = workspaceSlugs[0];
    const workspace = config.workspaces[slug];
    return {
      slug,
      accessKey: workspace.accessKey,
    };
  }

  // 4. Unable to resolve
  return null;
}

/**
 * Extracts the workspace slug from the command line.
 *
 * @param line - The command line string.
 * @returns The workspace slug if found, undefined otherwise.
 */
function extractWorkspaceFromLine(line: string): string | undefined {
  const workspaceMatch = line.match(/(?:-w|--workspace)\s+(\S+)/);
  return workspaceMatch?.[1];
}

/**
 * Fetches all documents from cache or API using cursor-based pagination.
 *
 * @param workspace - The resolved workspace.
 * @param deps - Partial dependencies for testing.
 * @returns Array of documents with slug and title.
 */
async function getDocuments(
  workspace: ResolvedWorkspace,
  deps: Partial<CompletionHandlerDeps>
): Promise<DocumentCacheItem[]> {
  const { createClientFn, loadCacheFn, saveCacheFn } = {
    ...defaultDeps,
    ...deps,
  };

  // 1. Try to load from cache
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
      after = lastDoc.id; // Use document ID as cursor for next page
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
 * Handles shell tab completion for the hscli command.
 *
 * This function is called by the shell completion system and provides
 * intelligent completion suggestions based on the command being typed.
 *
 * @param deps - Optional dependencies for testing.
 */
export async function completionHandler(deps: Partial<CompletionHandlerDeps> = {}): Promise<void> {
  const env = tabtab.parseEnv(process.env);

  // If not in completion mode, exit early
  if (!env.complete) {
    return;
  }

  try {
    let config: Config | null = null;
    try {
      config = (deps.loadConfigFn ?? defaultDeps.loadConfigFn)();
    } catch {
      // Config not available, proceed with basic completion
    }

    // Workspace option completion: hscli docs -w <TAB> or hscli --workspace <TAB>
    if ((env.prev === '--workspace' || env.prev === '-w') && config) {
      const workspaceSlugs = Object.keys(config.workspaces);
      return tabtab.log(workspaceSlugs);
    }

    // docs subcommand completion: hscli docs <TAB>
    if (env.prev === 'docs') {
      return tabtab.log(['show', 'list']);
    }

    // docs show command slug completion: hscli docs show <TAB>
    if (env.line.includes('docs show') && config) {
      const workspaceOption = extractWorkspaceFromLine(env.line);
      const workspace = resolveWorkspace(config, workspaceOption);

      if (workspace) {
        const documents = await getDocuments(workspace, deps);
        const completionItems = documents.map((doc) => ({
          name: doc.slug,
          description: doc.title,
        }));
        return tabtab.log(completionItems);
      }
    }

    // Default command completion
    const commands = ['docs', 'new', 'setup', 'config', 'completion', 'cache', '--help', '--version'];
    return tabtab.log(commands);
  } catch {
    // Silently fail on errors to avoid breaking the shell
    return;
  }
}
