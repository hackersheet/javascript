import { defineConfig, globalIgnores } from 'eslint/config';
import * as eslintPluginImport from 'eslint-plugin-import';
import eslint from '@eslint/js';
import eslintPluginNext from '@next/eslint-plugin-next';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    '**/node_modules/**',
    '**/.next/**',
    '**/out/**',
    '**/build/**',
    '**/next-env.d.ts',
    '**/*.config.*',
    '**/*.mjs',
    '**/dist/**',
  ]),
  {
    plugins: {
      import: eslintPluginImport,
      'unused-imports': eslintPluginUnusedImports,
      '@next/next': eslintPluginNext,
    },
  },
  {
    files: ['packages/**/*.{ts,tsx,js,jsx}', 'sandbox/**/*.{ts,tsx,js,jsx}'],
    extends: [eslint.configs.recommended, tseslint.configs.recommended],
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'object', 'type', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
  {
    files: ['sandbox/**/*.{ts,tsx,js,jsx}'],
    rules: {
      ...eslintPluginNext.configs.recommended.rules,
      ...eslintPluginNext.configs['core-web-vitals'].rules,
    },
    settings: {
      next: {
        rootDir: 'sandbox/next/src',
      },
    },
  }
);
