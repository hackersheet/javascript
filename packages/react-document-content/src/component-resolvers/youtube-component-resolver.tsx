import React from 'react';

import type { Document } from '@hackersheet/core';
import type { Element } from 'hast';
import type { FC, ReactNode } from 'react';
import type { ExtraProps } from 'react-markdown';

export type YoutubeComponentProps = {
  videoId: string;
  params?: { [key: string]: string | number | undefined };
  height?: number;
  width?: number;
  playLabel?: string;
  children?: ReactNode;
};

export type YoutubeComponentResolverProps = { children: ReactNode } & ExtraProps & {
    document: Document;
    YoutubeComponent: FC<YoutubeComponentProps>;
  };

export default function YoutubeComponentResolver({ children, node, YoutubeComponent }: YoutubeComponentResolverProps) {
  const childrenElm = <p>{children}</p>;

  if (!node) return childrenElm;

  const href = (node['children'][0] as Element).properties?.href;

  if (!href || typeof href !== 'string') return childrenElm;

  const id = getIdFromYoutubeUrl(href);

  if (!id) return childrenElm;

  const start = getStartFromYoutubeUrl(href);

  return <YoutubeComponent videoId={id} params={{ start: start }} children={children} />;
}

function getIdFromYoutubeUrl(value: string) {
  const matched =
    /^https?:\/\/(www\.)?youtube\.com\/watch\?(.*&)?v=(?<videoId>[^&]+)/.exec(value) ??
    /^https?:\/\/youtu\.be\/(?<videoId>[^?]+)/.exec(value) ??
    /^https?:\/\/(www\.)?youtube\.com\/embed\/(?<videoId>[^?]+)/.exec(value);

  if (matched?.groups?.videoId) {
    return matched.groups.videoId;
  }

  return null;
}

function getStartFromYoutubeUrl(value: string) {
  try {
    const url = new URL(value);
    const t = url.searchParams.get('t');

    if (!t) return;

    return Number(t.endsWith('s') ? t.slice(0, -1) : t);
  } catch {
    return;
  }
}
