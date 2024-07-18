import Link from 'next/link';
import React from 'react';

import type { KifuToComponentProps } from '@hackersheet/react-document-content';

export default function KifuTo({ id, ply, label: defaultLabel }: KifuToComponentProps) {
  const fullId = `user-content-${id}`;
  const href = `?ply=${ply}#${fullId}`;
  const label = defaultLabel ?? `${ply}手目`;

  return <Link href={href}>{label}</Link>;
}
