import Image from 'next/image';
import React from 'react';

import type { LinkCardComponentProps } from '@hackersheet/react-document-content';

export default function LinkCard({
  domain,
  url,
  title,
  description,
  imageUrl,
  imageHeight,
  imageWidth,
}: LinkCardComponentProps) {
  const faviconUrl = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=16`;

  return (
    <a href={url} className="link-card">
      <div className="link-card-main">
        <div className="link-card-title-container">
          <div className="link-card-title">{title}</div>
        </div>
        <div className="link-card-description">{description}</div>
        <div className="link-card-domain">
          <picture>
            <img src={faviconUrl} alt={`${domain} favicon`} width={16} height={16} />
          </picture>
          <div>{domain}</div>
        </div>
      </div>
      {imageUrl && (
        <div className="link-card-image">
          <Image alt={title} src={imageUrl} height={imageHeight} width={imageWidth} />
        </div>
      )}
    </a>
  );
}
