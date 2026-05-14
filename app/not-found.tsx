import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <div className="font-display text-7xl md:text-8xl text-meth tracking-tight">
          404
        </div>
        <h1 className="font-display text-3xl text-paper mt-4">
          Page not found.
        </h1>
        <p className="text-ink-400 mt-2 mb-8">
          The page you're looking for isn't here. Maybe it never was.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/"
            className="press inline-flex items-center rounded-md bg-meth text-ink-950 px-4 py-2 font-medium hover:bg-meth-300 tx-color"
          >
            Go home
          </Link>
          <Link
            href="/exams"
            className="press inline-flex items-center rounded-md border border-ink-700 text-paper px-4 py-2 hover:border-meth/50 hover:text-meth tx-color"
          >
            Browse papers
          </Link>
        </div>
      </main>
    </>
  );
}
