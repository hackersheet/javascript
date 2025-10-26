import { Command } from 'commander';

import { docsAction } from './actions/docs-action';
import { newAction } from './actions/new-action';
import { sandboxAction } from './actions/sandbox-action';
import { setupAction } from './actions/setup-action';

const program = new Command();

program.name('hscli').description('Hacker Sheet command line interface.').version('0.1.0');

program.command('setup').description('Setup Hacker Sheet in the current project.').action(setupAction);
program.command('docs <slug>').description('Fetch document content by slug.').action(docsAction);
program.command('new').description('Create a new document.').action(newAction);
program.command('sandbox').description('Sandbox action.').action(sandboxAction);

program.parse();
