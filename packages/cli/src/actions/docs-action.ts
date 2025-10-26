import { createClient } from '@hackersheet/core';

import { loadConfig } from '../utils/load-config';

export async function docsAction(slug?: string) {
  if (!slug) {
    console.error('Usage: hscli docs <slug>');
    process.exit(1);
  }

  const config = loadConfig();
  const url = `https://api.hackersheet.com/${config.workspaceSlug}/v1/graphql`;
  const accessKey = config.workspaceAccessKey;
  const client = createClient({
    url,
    accessKey,
  });

  const result = await client.getDocument({ slug });

  if (result.error) {
    console.error('Error fetching document.');
    return;
  }

  console.log(result.document?.content);
}
