import Link from 'next/link';

import { client } from '@/lib/hackersheet/client';

export default async function Home() {
  const { documents } = await client.getDocuments();

  return (
    <main className="mx-auto max-w-screen-sm">
      <ul className="list-disc">
        {documents &&
          documents.map((document) => (
            <li key={document.id} className="my-2">
              <Link href={`/posts/${document.slug}`}>{document.title}</Link>
            </li>
          ))}
      </ul>

      <hr />

      <ul className="list-disc">
        <li className="my-2">
          <Link href={`/tree`}>Tree</Link>
        </li>
      </ul>
    </main>
  );
}
