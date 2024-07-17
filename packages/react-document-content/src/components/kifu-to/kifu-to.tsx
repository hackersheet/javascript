import React from 'react';

import { KifuToComponentProps } from '../../component-resolvers/kifu-to-component-resolver';

export default function KifuTo({ id, ply, label: defaultLabel }: KifuToComponentProps) {
  const fullId = `user-content-${id}`;
  const href = `?ply=${ply}#${fullId}`;
  const label = defaultLabel ?? `${ply}手目`;

  return <a href={href}>{label}</a>;
}
