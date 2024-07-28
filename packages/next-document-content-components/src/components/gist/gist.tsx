import React from 'react';

import type { GistComponentProps } from '@hackersheet/react-document-content';

export default async function Gist({ gistId, username, filename }: GistComponentProps) {
  const src = (() => {
    const base = `https://gist.github.com/${username}/${gistId}.json`;

    if (filename) {
      return base + `?file=${filename}`;
    }

    return base;
  })();

  const result = await fetch(src);
  const json = await result.json();

  return (
    <div
      className="gist-block"
      dangerouslySetInnerHTML={{
        __html: json.div,
      }}
    />
  );
}
