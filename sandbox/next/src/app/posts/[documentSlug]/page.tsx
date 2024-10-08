import {
  CodeBlock,
  DirectoryTree,
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

export default async function PostPage({ params: { documentSlug } }: { params: { documentSlug: string } }) {
  const { document } = await client.getDocument({ slug: documentSlug });

  if (!document) notFound();

  return (
    <main className="mx-auto max-w-screen-sm">
      <h1 className="text-4xl pt-10 pb-20">{document.title}</h1>

      <DocumentContent
        document={document}
        style={documentContentStyle}
        permaLinkFormat="/posts/{{slug}}"
        components={{
          codeBlock: CodeBlock,
          directoryTree: DirectoryTree,
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
    </main>
  );
}
