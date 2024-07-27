import { createClient } from '@hackersheet/core';
import { cache } from 'react';
const client = cache(() =>
  createClient({
    url: process.env.HACKERSHEET_API_ENDPOINT!,
    accessKey: process.env.HACKERSHEET_API_ACCESS_KEY!,
  })
)();
export { client };
