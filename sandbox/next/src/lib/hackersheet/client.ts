import { createClient } from '@hackersheet/core';
import { cache } from 'react';
const client = cache(() =>
  createClient({
    url: process.env.HACKER_SHEET_API_ENDPOINT!,
    accessKey: process.env.HACKER_SHEET_API_ACCESS_TOKEN!,
  })
)();
export { client };
