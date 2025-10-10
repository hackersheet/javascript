import React from 'react';

import type { ImageComponentProps } from '@hackersheet/react-document-content';

export default function Image({ src, width, height, alt }: ImageComponentProps) {
  return (
    <picture>
      <img src={src} width={width} height={height} alt={alt} />
    </picture>
  );
}
