import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import HackersheetDocumentContent from '@/components/hackersheet/document-content';
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

      <HackersheetDocumentContent
        document={document}
        permaLinkFormat="/posts/{{slug}}"
      />
    </main>
  );
}
