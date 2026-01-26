import { type Tree } from '@hackersheet/core';
import { Link } from '@hackersheet/next-document-content-components';
import { notFound } from 'next/navigation';

import HackersheetDocumentContent from '@/components/hackersheet-document-content';
import { client } from '@/lib/hackersheet/client';

import 'katex/dist/katex.min.css';

export default async function TreeNodePage(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;

  const { slug } = params;

  const fullSlug = slug.join('/');

  const { document } = await client.getTreeNodeDocument({ treeSlug: 'docs', nodeFullSlug: fullSlug });
  const { tree } = await client.getTree({ slug: 'docs' });

  if (!document || !tree) notFound();

  const prev = getPrevDocumentNode(tree, fullSlug);
  const next = getNextDocumentNode(tree, fullSlug);

  return (
    <main className="max-w-screen-sm">
      <h1 className="text-4xl pt-10 pb-20">{document.title}</h1>

      <HackersheetDocumentContent
        document={document}
        tree={tree ?? undefined}
        permaLinkFormat="/tree/{{{slug}}}"
      />

      <div className="py-12 flex">
        {prev && (
          <div className="border rounded px-4 py-2">
            <div>Prev</div>
            <Link href={`/tree/${prev.fullSlug}`}>{prev.name}</Link>
          </div>
        )}
        <div className="flex-auto"></div>
        {next && (
          <div className="border rounded py-2 px-4">
            <div>Next</div>
            <Link href={`/tree/${next.fullSlug}`}>{next.name}</Link>
          </div>
        )}
      </div>
    </main>
  );
}

function getNextDocumentNode(tree: Tree, currentSlug: string) {
  const current = tree.flatNodes.find((node) => node.fullSlug === currentSlug);

  if (!current) return null;

  return tree.flatNodes.find((node) => node.position > current.position && node.document !== null);
}

function getPrevDocumentNode(tree: Tree, currentSlug: string) {
  const current = tree.flatNodes.find((node) => node.fullSlug === currentSlug);

  if (!current) return null;

  return [...tree.flatNodes].reverse().find((node) => node.position < current.position && node.document !== null);
}
