require('dotenv').config({ path: '.env' });

import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: {
    [`${process.env.HACKER_SHEET_API_ENDPOINT}`]: {
      headers: {
        Authorization: `Bearer ${process.env.HACKER_SHEET_API_ACCESS_TOKEN}`,
      },
    },
  },
  documents: ['packages/core/src/**/*.{ts,tsx}'],
  ignoreNoDocuments: true,
  generates: {
    'packages/core/src/gql/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' },
      },
      plugins: [],
    },
  },
  hooks: { afterAllFileWrite: ['pnpm format', 'pnpm eslint --fix'] },
};

export default config;
