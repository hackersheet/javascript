import { unstable_cache } from 'next/cache';
import React from 'react';
import { EmbeddedTweet, TweetNotFound } from 'react-tweet';
import { getTweet as _getTweet } from 'react-tweet/api';

import type { XPostComponentProps } from '@hackersheet/react-document-content';

const getTweet = unstable_cache(async (id: string) => _getTweet(id), ['tweet'], {
  revalidate: 3600 * 24,
});

export default async function XPost({ id }: XPostComponentProps) {
  try {
    const tweet = await getTweet(id);
    return tweet ? <EmbeddedTweet tweet={tweet} /> : <TweetNotFound />;
  } catch (error) {
    console.error(error);
    return <TweetNotFound error={error} />;
  }
}
