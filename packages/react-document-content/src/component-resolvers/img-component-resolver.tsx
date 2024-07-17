import React from 'react';

import type { Document } from '@hackersheet/core';
import type { FC, ReactNode } from 'react';
import type { ExtraProps } from 'react-markdown';

export type ImageComponentProps = {
  src: string;
  width: number;
  height: number;
  alt: string;
  children?: ReactNode;
};

export type ImgComponentResolverProps = JSX.IntrinsicElements['img'] &
  ExtraProps & {
    document: Document;
    ImageComponent: FC<ImageComponentProps>;
  };

export default function ImgComponentResolver({
  children,
  src,
  width,
  height,
  alt,
  ImageComponent,
}: ImgComponentResolverProps) {
  if (src && width && height && alt) {
    return <ImageComponent src={src} width={Number(width)} height={Number(height)} alt={alt} children={children} />;
  }

  return <>{children}</>;
}
