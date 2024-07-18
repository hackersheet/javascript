import { defineConfig, Options } from 'tsup';

const baseConfig: Options = {
  target: 'esnext',
  clean: true,
  dts: true,
  bundle: false,
};

export default defineConfig([
  {
    ...baseConfig,
    entry: ['./src', '!./src/styles'],
    format: ['esm'],
    outDir: './dist/esm',
  },
  {
    ...baseConfig,
    entry: ['./src', '!./src/styles'],
    format: ['cjs'],
    outDir: './dist/cjs',
  },
]);
