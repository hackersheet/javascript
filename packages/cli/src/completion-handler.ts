import { createClient } from '@hackersheet/core';
import tabtab from '@pnpm/tabtab';

import { loadCache, saveCache } from './utils/cache';
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
  loadCacheFn: (workspace: string) => string[] | null;
  saveCacheFn: (workspace: string, slugs: string[]) => Promise<void>;
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
 * Fetches document slugs from cache or API.
 *
 * @param workspace - The resolved workspace.
 * @param deps - Partial dependencies for testing.
 * @returns Array of document slugs.
 */
async function getDocumentSlugs(workspace: ResolvedWorkspace, deps: Partial<CompletionHandlerDeps>): Promise<string[]> {
  const { createClientFn, loadCacheFn, saveCacheFn } = {
    ...defaultDeps,
    ...deps,
  };

  // 1. Try to load from cache
  const cached = loadCacheFn(workspace.slug);
  if (cached) {
    return cached;
  }

  // 2. Fetch from API
  try {
    const url = `https://api.hackersheet.com/${workspace.slug}/v1/graphql`;
    const client = createClientFn({
      url,
      accessKey: workspace.accessKey,
    });

    const { documents, error } = await client.getDocuments({
      filter: { draft: false },
    });

    if (error || !documents) {
      return [];
    }

    const slugs = documents.map((doc) => doc.slug);

    // 3. Save to cache (fire and forget)
    saveCacheFn(workspace.slug, slugs).catch(() => {
      // Silently ignore cache errors
    });

    return slugs;
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
      config = (deps.loadConfigFn || defaultDeps.loadConfigFn)();
    } catch {
      // Config not available, proceed with basic completion
    }

    // Workspace option completion: hscli docs -w <TAB> or hscli --workspace <TAB>
    if (
      (env.prev === '--workspace' || env.prev === '-w') &&
      config
    ) {
      const workspaceSlugs = Object.keys(config.workspaces);
      return tabtab.log(workspaceSlugs);
    }

    // docs command slug completion: hscli docs <TAB>
    if (env.line.includes('docs') && config) {
      const workspaceOption = extractWorkspaceFromLine(env.line);
      const workspace = resolveWorkspace(config, workspaceOption);

      if (workspace) {
        const slugs = await getDocumentSlugs(workspace, deps);
        return tabtab.log(slugs);
      }
    }

    // Default command completion
    const commands = [
      'docs',
      'new',
      'setup',
      'config',
      'completion',
      'cache',
      '--help',
      '--version',
    ];
    return tabtab.log(commands);
  } catch {
    // Silently fail on errors to avoid breaking the shell
    return;
  }
}
