import { defineConfig } from 'tsup';

export default defineConfig({
  target: 'esnext',
  format: ['cjs', 'esm'],
  clean: true,
  dts: true,
  splitting: false,
  sourcemap: true,
});
