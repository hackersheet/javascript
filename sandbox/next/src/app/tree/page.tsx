import Link from 'next/link';
import { notFound } from 'next/navigation';

import { client } from '@/lib/hackersheet/client';

import 'katex/dist/katex.min.css';

import type { TreeNode } from '@hackersheet/core';

export default async function TreePage() {
  const { tree } = await client.getTree({ slug: 'tree01' });

  if (!tree) notFound();

  return (
    <main className="mx-auto max-w-screen-sm">
      <Nodes nodes={tree.nodes} />
    </main>
  );
}

function Nodes({ nodes }: { nodes: TreeNode[] }) {
  return (
    <ul className="pl-5 list-outside list-disc [&_ul]:list-[revert]">
      {nodes.map((node) => (
        <li key={node.id}>
          {node.document !== null ? (
            <>
              <Link href={`tree/${node.fullSlug}`}>{node.name}</Link>
              {node.children && <Nodes nodes={node.children} />}
            </>
          ) : (
            <>
              <span>{node.name}</span>
              {node.children && <Nodes nodes={node.children} />}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
