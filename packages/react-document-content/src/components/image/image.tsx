import React from 'react';

import { ImageComponentProps } from '../../component-resolvers';

export default function Image({ src, width, height, alt }: ImageComponentProps) {
  return <img src={src} width={width} height={height} alt={alt} />;
}
