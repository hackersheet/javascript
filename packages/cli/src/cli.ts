import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { Command } from 'commander';

import { cacheClearAction } from './actions/cache/cache-clear-action';
import { completionInstallAction } from './actions/completion/completion-install-action';
import {
  configListAction,
  configGetAction,
  configSetAction,
  configDeleteAction,
  configPathAction,
  configInitAction,
} from './actions/config';
import { docsAction } from './actions/docs-action';
import { genTreeAction } from './actions/gen-tree-action';
import { newAction } from './actions/new-action';
import { setupAction } from './actions/setup-action';
import { completionHandler } from './completion-handler';
import { setNoColor, colors, symbols } from './utils/colors';

/**
 * Checks if an error is a prompt cancellation error.
 *
 * @param error - The error to check.
 * @returns True if the error is a prompt cancellation.
 */
function isPromptCancelled(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}

// Check for --no-color flag before parsing
if (process.argv.includes('--no-color')) {
  setNoColor(true);
}

// Global error handler for prompt cancellation (Ctrl+C)
process.on('uncaughtException', (error) => {
  if (isPromptCancelled(error)) {
    console.log(`\n${symbols.warning()} ${colors.warning('Cancelled.')}`);
    process.exit(0);
  }
  throw error;
});

/**
 * Reads the version from package.json.
 *
 * @returns The version string from package.json.
 */
function getVersion(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const packagePath = path.resolve(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

const program = new Command();

program
  .name('hscli')
  .description('Hacker Sheet command line interface.')
  .version(getVersion())
  .option('--no-color', 'Disable colored output');

program.command('setup').description('Setup Hacker Sheet in the current project.').action(setupAction);
program
  .command('docs <slug>')
  .description('Fetch document content by slug.')
  .option('-w, --workspace <slug>', 'Workspace to use')
  .action((slug, options) => docsAction(slug, options));
program.command('new').description('Create a new document.').action(newAction);
program
  .command('gen:tree')
  .description('Generate document tree.')
  .action(() => genTreeAction());

const configCommand = program.command('config').description('Manage CLI configuration.');

configCommand
  .command('list')
  .description('List all configuration values.')
  .option('-g, --global', 'Show only user configuration')
  .option('-l, --local', 'Show only project configuration')
  .option('--json', 'Output as JSON')
  .action((options) => configListAction(options));

configCommand
  .command('get <key>')
  .description('Get a configuration value.')
  .option('-g, --global', 'Get from user configuration')
  .option('-l, --local', 'Get from project configuration')
  .action((key, options) => configGetAction(key, options));

configCommand
  .command('set <key> <value>')
  .description('Set a configuration value.')
  .option('-g, --global', 'Set in user configuration')
  .action((key, value, options) => configSetAction(key, value, options));

configCommand
  .command('init')
  .description('Initialize configuration interactively.')
  .option('-g, --global', 'Initialize user configuration')
  .action((options) => configInitAction(options));

configCommand
  .command('delete <key>')
  .description('Delete a configuration value.')
  .option('-g, --global', 'Delete from user configuration')
  .action((key, options) => configDeleteAction(key, options));

configCommand
  .command('path')
  .description('Show configuration file paths.')
  .option('-g, --global', 'Show only user configuration path')
  .option('-l, --local', 'Show only project configuration path')
  .action((options) => configPathAction(options));

const completionCommand = program.command('completion').description('Manage shell completion.');

completionCommand
  .command('install')
  .description('Install shell completion.')
  .action(() => completionInstallAction());

const cacheCommand = program.command('cache').description('Manage CLI cache.');

cacheCommand
  .command('clear')
  .description('Clear slugs cache.')
  .action(() => cacheClearAction());

// Handle shell tab completion
if (process.env.COMP_CWORD !== undefined || process.env.COMP_LINE !== undefined) {
  (async () => {
    await completionHandler();
    process.exit(0);
  })().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  program.parse();
}
