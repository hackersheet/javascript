import type { Config } from './load-config';

/**
 * Resolved workspace information containing the slug and access key.
 */
export type ResolvedWorkspace = {
  slug: string;
  accessKey: string;
};

/**
 * Resolves the workspace to use based on options and config.
 *
 * Resolution order:
 * 1. Explicit workspace option if specified
 * 2. defaultWorkspace if configured
 * 3. Single workspace if only one exists
 * 4. null if none of the above
 *
 * @param config - The loaded configuration.
 * @param workspaceOption - The workspace slug from CLI option.
 * @returns The resolved workspace or null.
 */
export function resolveWorkspace(config: Config, workspaceOption?: string): ResolvedWorkspace | null {
  const workspaceSlugs = Object.keys(config.workspaces);

  // 1. Explicit workspace option specified
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
