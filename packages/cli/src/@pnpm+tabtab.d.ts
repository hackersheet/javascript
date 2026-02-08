declare module '@pnpm/tabtab' {
  export interface ParseEnvResult {
    complete?: boolean;
    line: string;
    prev: string;
  }

  const tabtab: {
    parseEnv: (env: NodeJS.ProcessEnv) => ParseEnvResult;
    log: (items: string[]) => void;
    install: (options: { name: string; completer: string }) => Promise<void>;
  };

  export default tabtab;
}
