import { Command } from 'commander';

import { docsAction } from './actions/docs-action';
import { sandboxAction } from './actions/sandbox-action';
import { setupAction } from './actions/setup-action';

const program = new Command();

program.name('hscli').description('Hacker Sheet command line interface.').version('0.1.0');

program.command('setup').description('Setup Hacker Sheet in the current project.').action(setupAction);
program.command('docs').description('Fetch document content.').action(docsAction);
program.command('sandbox').description('Sandbox action.').action(sandboxAction);

program.parse();
