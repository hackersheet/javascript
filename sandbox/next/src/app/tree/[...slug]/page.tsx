import 'katex/dist/katex.min.css';

export default async function TreeNodePage({ params: { slug } }: { params: { slug: string[] } }) {
  return (
    <main className="mx-auto max-w-screen-sm">
      <h1 className="text-xl pt-10 pb-20">{slug.join('/')}</h1>
    </main>
  );
}
