import { defineConfig } from 'tsup';

export default defineConfig({
  target: 'esnext',
  format: ['cjs', 'esm'],
  clean: true,
  dts: true,
  bundle: false,
  entry: ['./src/**/*.{ts,tsx}', '!./src/**/*.d.ts', '!./src/styles/**/*'],
});
