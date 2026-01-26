import { defineConfig, Options } from 'tsup';
import fs from 'fs';

const baseConfig: Options = {
  target: 'esnext',
  clean: true,
  dts: true,
  bundle: false,
  sourcemap: true,
};

/**
 * ESM形式のビルド時に、相対インポートに .mjs 拡張子を追加するプラグイン
 */
const createAddExtensionPlugin = () => ({
  name: 'add-extension',
  setup(build: any) {
    const importRegex = /from ['"](\.[^'"]*?)(?<!\.mjs)(?<!\.json)['"];/g;

    build.onLoad({ filter: /\.[jt]sx?$/ }, async (args: any) => {
      try {
        const content = await fs.promises.readFile(args.path, 'utf-8');
        const modified = content.replace(importRegex, 'from "$1.mjs";');
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
