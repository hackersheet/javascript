declare module '@pnpm/tabtab' {
  /**
   * Represents a completion item with name and optional description.
   * Description is shown in zsh and fish but not in bash.
   */
  export interface CompletionItem {
    /** The completion text to be inserted. */
    name: string;
    /** Optional description shown in zsh/fish. */
    description?: string;
  }

  /**
   * Parsed environment from the shell during completion.
   */
  export interface ParseEnvResult {
    /** True if we are in completion mode. */
    complete?: boolean;
    /** The full command line. */
    line: string;
    /** The previous word typed. */
    prev: string;
  }

  const tabtab: {
    /**
     * Parse environment variables to determine completion context.
     * @param env - process.env object
     * @returns Parsed completion environment
     */
    parseEnv: (env: NodeJS.ProcessEnv) => ParseEnvResult;

    /**
     * Output completion suggestions to the shell.
     * Accepts either string array (slugs) or completion items with descriptions.
     * @param items - Array of completion strings or items
     */
    log: (items: string[] | CompletionItem[]) => void;

    /**
     * Install shell completion for this command.
     * @param options - Installation options
     */
    install: (options: { name: string; completer: string }) => Promise<void>;
  };

  export default tabtab;
}
