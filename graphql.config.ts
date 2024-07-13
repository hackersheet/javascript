require('dotenv').config({ path: '.env' });

import type { IGraphQLConfig } from 'graphql-config';

const config: IGraphQLConfig = {
  schema: {
    [`${process.env.HACKER_SHEET_API_ENDPOINT}`]: {
      headers: {
        Authorization: `Bearer ${process.env.HACKER_SHEET_API_ACCESS_TOKEN}`,
      },
    },
  },
};

export default config;
