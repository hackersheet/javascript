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
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { client } from '@/lib/hackersheet/client';

import 'katex/dist/katex.min.css';

export type PostPageProps = {
  params: Promise<{ documentSlug: string }>;
};

export const dynamic = 'force-static';
export const revalidate = 60;

/**
 * キャッシュされた document 取得
 * generateMetadata と default export の両方で共有される
 */
const getCachedDocument = cache(async (slug: string) => {
  return client.getDocument({ slug });
});

export async function generateMetadata(props: PostPageProps): Promise<Metadata> {
  const params = await props.params;
  const { documentSlug } = params;

  const { document } = await getCachedDocument(documentSlug);

  if (!document) {
    return {
      title: 'Not Found',
    };
  }

  return {
    title: document.title,
  };
}

export default async function PostPage(props: PostPageProps) {
  const params = await props.params;
  const { documentSlug } = params;

  const { document } = await getCachedDocument(documentSlug);

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
