import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { Command } from 'commander';

import { docsAction } from './actions/docs-action';
import { genTreeAction } from './actions/gen-tree-action';
import { newAction } from './actions/new-action';
import { setupAction } from './actions/setup-action';

/**
 * Checks if an error is a prompt cancellation error.
 *
 * @param error - The error to check.
 * @returns True if the error is a prompt cancellation.
 */
function isPromptCancelled(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}

// Global error handler for prompt cancellation (Ctrl+C)
process.on('uncaughtException', (error) => {
  if (isPromptCancelled(error)) {
    console.log('\nCancelled.');
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

program.name('hscli').description('Hacker Sheet command line interface.').version(getVersion());

program.command('setup').description('Setup Hacker Sheet in the current project.').action(setupAction);
program.command('docs <slug>').description('Fetch document content by slug.').action(docsAction);
program.command('new').description('Create a new document.').action(newAction);
program
  .command('gen:tree')
  .description('Generate document tree.')
  .action(() => genTreeAction());

program.parse();
