import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        <div className="aurora-field aurora-animate" aria-hidden />
        <div className="relative z-10 mx-auto max-w-xl px-5 py-32 text-center">
          <div className="font-display text-8xl md:text-9xl font-extrabold tracking-tight text-aurora">
            404
          </div>
          <h1 className="font-display text-3xl font-bold text-coal-900 mt-4">
            Page not found.
          </h1>
          <p className="text-coal-600 mt-2 mb-8">
            The page you&apos;re looking for isn&apos;t here. Maybe it never was.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="press inline-flex items-center rounded-full bg-aurora-line px-6 py-2.5 font-semibold text-white shadow-glow hover:shadow-glow-lg tx-color"
            >
              Go home
            </Link>
            <Link
              href="/exams"
              className="press inline-flex items-center rounded-full glass px-6 py-2.5 text-coal-900 hover:text-accent-bright tx-color"
            >
              Browse papers
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
