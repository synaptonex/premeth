import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <div className="font-display text-7xl md:text-8xl text-accent tracking-tight">
          404
        </div>
        <h1 className="font-display text-3xl text-coal-900 mt-4">
          Page not found.
        </h1>
        <p className="text-coal-600 mt-2 mb-8">
          The page you're looking for isn't here. Maybe it never was.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/"
            className="press inline-flex items-center rounded-md bg-accent text-coal px-4 py-2 font-medium hover:bg-accent/90 tx-color"
          >
            Go home
          </Link>
          <Link
            href="/exams"
            className="press inline-flex items-center rounded-md border border-coal-rule text-coal-900 px-4 py-2 hover:border-accent/50 hover:text-accent tx-color"
          >
            Browse papers
          </Link>
        </div>
      </main>
    </>
  );
}
