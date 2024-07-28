import Link from 'next/link';
import React from 'react';
import { MdLink } from 'react-icons/md';

import type { HeadingComponentProps } from '@hackersheet/react-document-content';

export default function Heading({ HeadingTag, id, children }: HeadingComponentProps) {
  return (
    <HeadingTag id={id} className="heading">
      <Link href={`#${id}`}>
        <span className="heading-label">{children}</span>
        <span className="heading-link-icon">
          <MdLink />
        </span>
      </Link>
    </HeadingTag>
  );
}
