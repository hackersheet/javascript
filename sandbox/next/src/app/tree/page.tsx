import { notFound, redirect } from 'next/navigation';

import { client } from '@/lib/hackersheet/client';

import 'katex/dist/katex.min.css';

export default async function TreePage() {
  const { tree } = await client.getTree({ slug: 'tree' });
  const fullSlug = tree?.flatNodes[0].fullSlug;

  if (!fullSlug) notFound();

  redirect(`/tree/${fullSlug}`);
}
