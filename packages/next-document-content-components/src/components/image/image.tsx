import NextImage from 'next/image';
import React from 'react';

import type { ImageComponentProps } from '@hackersheet/react-document-content';

export default function Image({ src, width, height, alt }: ImageComponentProps) {
  return <NextImage src={src} width={width} height={height} alt={alt} />;
}
