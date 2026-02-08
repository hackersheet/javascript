import tabtab from '@pnpm/tabtab';

import { colors, symbols } from '../../utils/colors';

import type { Logger } from '../../types/logger';

/**
 * Dependencies for the completionInstallAction function.
 */
export type CompletionInstallActionDeps = {
  logger: Logger;
  tabtabInstall: () => Promise<void>;
};

const defaultDeps: CompletionInstallActionDeps = {
  logger: { log: console.log, error: console.error },
  tabtabInstall: () => tabtab.install({ name: 'hscli', completer: 'hscli' }),
};

/**
 * Install shell completion.
 *
 * This is the action handler for the `completion install` command.
 * Installs the shell completion script for the current shell.
 *
 * @param deps - Optional dependencies for testing.
 */
export async function completionInstallAction(deps: Partial<CompletionInstallActionDeps> = {}): Promise<void> {
  const { logger, tabtabInstall } = { ...defaultDeps, ...deps };

  try {
    await tabtabInstall();

    logger.log(`${symbols.success()} ${colors.success('Shell completion installed!')}`);
    logger.log(`   ${colors.hint('Restart your shell or source your rc file to enable completion.')}`);
  } catch {
    // If tabtab fails, provide manual instruction
    logger.log(`${symbols.info()} ${colors.hint('Tabtab installation could not auto-setup completion.')}`);
    logger.log(`   ${colors.hint('Manual setup: Add the following to your ~/.zshrc or ~/.bashrc:')}`);
    logger.log('');
    logger.log(`   . <(hscli __completion)`);
    logger.log('');
    logger.log(`   ${colors.hint('Then restart your shell or run:')} source ~/.zshrc`);
  }
}
