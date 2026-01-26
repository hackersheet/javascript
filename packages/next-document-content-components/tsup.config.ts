import { defineConfig, Options } from 'tsup';
import fs from 'fs';
import path from 'path';

const baseConfig: Options = {
  target: 'esnext',
  clean: true,
  dts: true,
  bundle: false,
  sourcemap: true,
};

/**
 * ESM形式のビルド時に、相対インポートに .mjs 拡張子を追加するプラグイン
 * ディレクトリへのインポートには拡張子をつけない
 */
const createAddExtensionPlugin = () => ({
  name: 'add-extension',
  setup(build: any) {
    const importRegex = /from ['"](\.[^'"]*?)(?<!\.mjs)(?<!\.json)['"];/g;

    build.onLoad({ filter: /\.[jt]sx?$/ }, async (args: any) => {
      try {
        const content = await fs.promises.readFile(args.path, 'utf-8');
        const dir = path.dirname(args.path);

        const modified = content.replace(importRegex, (match: string, importPath: string) => {
          // Resolve the import path
          const targetPath = path.resolve(dir, importPath);
          const tsFile = targetPath + '.ts';
          const tsxFile = targetPath + '.tsx';

          // Check if .ts or .tsx file exists
          if (fs.existsSync(tsFile) || fs.existsSync(tsxFile)) {
            return `from "${importPath}.mjs";`;
          }

          // No extension for directories or non-existent paths
          return match;
        });

        return modified !== content ? { contents: modified, loader: 'default' } : null;
      } catch {
        // Silently continue if file can't be read
      }
    });
  },
});

export default defineConfig([
  {
    ...baseConfig,
    entry: ['./src/**/*.{ts,tsx}', '!./src/**/*.d.ts', '!./src/styles/**/*'],
    format: ['esm'],
    outDir: './dist/esm',
    outExtension: () => ({
      js: '.mjs',
    }),
    esbuildPlugins: [createAddExtensionPlugin()],
  },
  {
    ...baseConfig,
    entry: ['./src/**/*.{ts,tsx}', '!./src/**/*.d.ts', '!./src/styles/**/*'],
    format: ['cjs'],
    outDir: './dist/cjs',
  },
]);
