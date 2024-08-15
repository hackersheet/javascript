import { TreeNode } from '@hackersheet/core';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PropsWithChildren } from 'react';

import { client } from '@/lib/hackersheet/client';

export type TreeLayoutProps = PropsWithChildren;

export default async function TreeLayout({ children }: TreeLayoutProps) {
  const { tree } = await client.getTree({ slug: 'tree' });

  if (!tree) notFound();

  return (
    <div className="flex gap-4 container">
      <div className="w-[320px] text-sm">
        <Nodes nodes={tree.nodes} />
      </div>
      <div className="flex-auto w-full">{children}</div>
    </div>
  );
}

function Nodes({ nodes }: { nodes: TreeNode[] }) {
  return (
    <ul className="pl-5 list-outside list-disc [&_ul]:list-[revert]">
      {nodes.map((node) => (
        <li key={node.id} className="my-2">
          {node.document !== null ? (
            <>
              <Link className="text-muted-foreground" href={`/tree/${node.fullSlug}`}>
                {node.name}
              </Link>
              {node.children && <Nodes nodes={node.children} />}
            </>
          ) : (
            <>
              <span className="font-black">{node.name}</span>
              {node.children && <Nodes nodes={node.children} />}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
