import { type Tree } from '@hackersheet/core';
import {
  CodeBlock,
  Gist,
  Heading,
  Image,
  Link,
  LinkCard,
  Mermaid,
  XPost,
  Youtube,
} from '@hackersheet/next-document-content-components';
import { Kifu, KifuTo } from '@hackersheet/next-document-content-kifu';
import { DocumentContent } from '@hackersheet/react-document-content';
import documentContentStyle from '@hackersheet/react-document-content-styles/basic';
import { notFound } from 'next/navigation';

import { client } from '@/lib/hackersheet/client';

import 'katex/dist/katex.min.css';

export default async function TreeNodePage({ params: { slug } }: { params: { slug: string[] } }) {
  const fullSlug = slug.join('/');

  const { document } = await client.getTreeNodeDocument({ treeSlug: 'tree', nodeFullSlug: fullSlug });
  const { tree } = await client.getTree({ slug: 'tree' });

  if (!document || !tree) notFound();

  const prev = getPrevDocumentNode(tree, fullSlug);
  const next = getNextDocumentNode(tree, fullSlug);

  return (
    <main className="max-w-screen-sm">
      <h1 className="text-4xl pt-10 pb-20">{document.title}</h1>

      <DocumentContent
        document={document}
        tree={tree ?? undefined}
        style={documentContentStyle}
        permaLinkFormat="/tree/{{{slug}}}"
        components={{
          codeBlock: CodeBlock,
          gist: Gist,
          heading: Heading,
          image: Image,
          kifu: Kifu,
          kifuTo: KifuTo,
          link: Link,
          linkCard: LinkCard,
          mermaid: Mermaid,
          xPost: XPost,
          youtube: Youtube,
        }}
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
