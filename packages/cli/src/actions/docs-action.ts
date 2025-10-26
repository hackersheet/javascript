import { createClient } from '@hackersheet/core';

import { loadConfig } from '../utils/load-config';

export async function docsAction() {
  const config = loadConfig();
  const url = `https://api.hackersheet.com/${config.workspaceSlug}/v1/graphql`;
  const accessKey = config.workspaceAccessKey;
  const client = createClient({
    url,
    accessKey,
  });

  const result = await client.getDocument({ slug: 'upgrade-to-next-js-16' });

  if (result.error) {
    console.error('Error fetching document.');
    return;
  }

  console.log(result.document?.content);
}
