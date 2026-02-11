import fs from 'fs/promises';
import path from 'path';

import { input, confirm } from '@inquirer/prompts';

import { runConfigWizard, type ConfigInitActionDeps } from './config';
import { colors, symbols } from '../utils/colors';
import { type Config, loadUserConfig, loadConfigFromPath } from '../utils/load-config';
import { saveConfig } from '../utils/save-config';

/**
 * Relative path from project root to the default new-file template.
 */
const DEFAULT_TEMPLATE_REL_PATH = '.hackersheet/templates/default-new-file.md';

/**
 * Default document directories when none are configured.
 */
const DEFAULT_DOCS_DIRS = ['docs'] as const;

/**
 * Builds the default .hsignore content based on docsDirs.
 *
 * Uses a whitelist approach: ignore all markdown and image files,
 * then allow only those in docsDirs and assets/ respectively.
 *
 * @param docsDirs - Document directories to whitelist for markdown files.
 * @returns The .hsignore file content.
 */
function buildHsignoreContent(docsDirs: readonly string[]): string {
  const lines = [
    '# Ignore all markdown files',
    '*.md',
    '',
    '# Allow markdown in document directories',
    ...docsDirs.map((dir) => `!${dir}/**/*.md`),
    '',
    '# Ignore all image files',
    '*.png',
    '*.jpg',
    '*.jpeg',
    '*.gif',
    '*.webp',
    '',
    '# Allow image files in assets/',
    '!assets/**',
    '',
  ];
  return lines.join('\n');
}

/**
 * Default content for the project README.md file.
 */
const DEFAULT_README_CONTENT = `# Hacker Sheet

Documents managed by [Hacker Sheet](https://hackersheet.com).

## Getting Started

### Create a new document

\`\`\`bash
hscli new
\`\`\`

## Push to a new Git repository

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <repository-url>
git push -u origin main
\`\`\`
`;

/**
 * Default content for the new-file template with frontmatter placeholders.
 */
const DEFAULT_TEMPLATE_CONTENT = `---
draft: true
emoji: ""
title: {{title}}
slug: ""
published_at: {{datetime}}
modified_at: {{datetime}}
tags: []
preview: null
---
`;

/**
 * Minimal filesystem interface for dependency injection.
 */
export type FsLike = {
  mkdir: typeof fs.mkdir;
  writeFile: typeof fs.writeFile;
  access: typeof fs.access;
};

/**
 * Interface for user prompts, enabling dependency injection in tests.
 */
export type Prompts = {
  input: typeof input;
  confirm: typeof confirm;
};

/**
 * Logger interface for output, enabling dependency injection in tests.
 */
export type Logger = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

/**
 * Dependencies for the initAction function.
 */
export type InitActionDeps = {
  fsApi: FsLike;
  prompts: Prompts;
  logger: Logger;
  cwd: () => string;
  configInitDeps?: Partial<ConfigInitActionDeps>;
};

const defaultDeps: InitActionDeps = {
  fsApi: fs,
  prompts: { input, confirm },
  logger: { log: console.log, error: console.error },
  cwd: () => process.cwd(),
};

/**
 * Logs a step completion message.
 *
 * @param logger - Logger instance.
 * @param relativePath - The relative path that was created.
 */
function logStep(logger: Logger, relativePath: string): void {
  logger.log(`  ${symbols.success()} Created ${relativePath}`);
}

/**
 * Creates the full project directory structure and writes all scaffold files.
 *
 * @param fsApi - Filesystem interface.
 * @param projectRoot - Project root directory path.
 * @param config - Configuration from the wizard.
 * @param logger - Logger instance.
 */
async function createProjectStructure(
  fsApi: FsLike,
  projectRoot: string,
  config: Partial<Config>,
  logger: Logger
): Promise<void> {
  const hackersheetDir = path.join(projectRoot, '.hackersheet');
  const configPath = path.join(hackersheetDir, 'cli.config.json');
  const treesDir = path.join(hackersheetDir, 'trees');
  const templatesDir = path.join(hackersheetDir, 'templates');
  const templatePath = path.join(projectRoot, DEFAULT_TEMPLATE_REL_PATH);
  const docsDirs = config.docsDirs ?? DEFAULT_DOCS_DIRS;

  logger.log('\nSetting up project structure...\n');

  await fsApi.mkdir(hackersheetDir, { recursive: true });
  logStep(logger, '.hackersheet/');

  await fsApi.mkdir(treesDir, { recursive: true });
  await fsApi.writeFile(path.join(treesDir, '.keep'), '', 'utf8');
  logStep(logger, '.hackersheet/trees/');

  await fsApi.mkdir(templatesDir, { recursive: true });
  logStep(logger, '.hackersheet/templates/');

  await fsApi.writeFile(templatePath, DEFAULT_TEMPLATE_CONTENT, 'utf8');
  logStep(logger, '.hackersheet/templates/default-new-file.md');

  for (const dir of docsDirs) {
    await fsApi.mkdir(path.join(projectRoot, dir), { recursive: true });
    logStep(logger, `${dir}/`);
  }

  const assetsDir = path.join(projectRoot, 'assets');
  await fsApi.mkdir(assetsDir, { recursive: true });
  await fsApi.writeFile(path.join(assetsDir, '.keep'), '', 'utf8');
  logStep(logger, 'assets/');

  const configWithTemplate: Partial<Config> = {
    ...config,
    newFileTemplatePath: DEFAULT_TEMPLATE_REL_PATH,
  };
  await fsApi.writeFile(configPath, JSON.stringify(configWithTemplate, null, 2), 'utf8');
  logStep(logger, '.hackersheet/cli.config.json');

  await fsApi.writeFile(path.join(projectRoot, 'README.md'), DEFAULT_README_CONTENT, 'utf8');
  logStep(logger, 'README.md');

  await fsApi.writeFile(path.join(projectRoot, '.gitignore'), '', 'utf8');
  logStep(logger, '.gitignore');

  await fsApi.writeFile(path.join(projectRoot, '.hsignore'), buildHsignoreContent(docsDirs), 'utf8');
  logStep(logger, '.hsignore');
}

/**
 * Initializes Hacker Sheet in the current project.
 *
 * This is the action handler for the `init` command.
 * Creates the `.hackersheet` directory structure, default template,
 * document directories, and `cli.config.json` configuration file.
 *
 * @param deps - Optional dependencies for testing.
 */
export async function initAction(deps: Partial<InitActionDeps> = {}): Promise<void> {
  const { fsApi, prompts, logger, cwd, configInitDeps } = { ...defaultDeps, ...deps };

  const userConfig = loadUserConfig();
  if (!userConfig.workspaces || Object.keys(userConfig.workspaces).length === 0) {
    logger.error(`${symbols.error()} ${colors.error('No workspaces configured.')}`);
    logger.error(`   ${colors.hint('Run')} ${colors.emphasis('hscli setup')} ${colors.hint('first.')}`);
    return;
  }

  const projectRoot = cwd();
  const configPath = path.join(projectRoot, '.hackersheet', 'cli.config.json');

  const wizardDeps: Partial<ConfigInitActionDeps> = {
    fsApi: { mkdir: fsApi.mkdir, access: fsApi.access },
    prompts,
    logger,
    loadConfigFromPath,
    saveConfig,
    ...configInitDeps,
  };

  const result = await runConfigWizard(configPath, 'project', wizardDeps, {
    confirmMessage: 'Project is already initialized. Overwrite configuration?',
    headerMessage: '\nHacker Sheet Project Initialization\n',
  });

  if (result.cancelled) {
    logger.log(`${symbols.warning()} ${colors.warning('Initialization cancelled.')}`);
    return;
  }

  await createProjectStructure(fsApi, projectRoot, result.config, logger);

  logger.log(`\n${symbols.success()} ${colors.success('Project initialization completed!')}`);
  logger.log(`   Next: Run ${colors.emphasis('hscli new')} to create your first document.`);
}
