import { YouTubeEmbed } from '@next/third-parties/google';
import React from 'react';

import type { YoutubeComponentProps } from '@hackersheet/react-document-content';

export default async function Youtube({ videoId, params, playLabel, ...props }: YoutubeComponentProps) {
  const paramsString = params
    ? Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string | number)}`)
        .join('&')
    : undefined;

  return (
    <div className="youtube-block">
      <YouTubeEmbed {...props} videoid={videoId} params={paramsString} playlabel={playLabel} />
    </div>
  );
}
