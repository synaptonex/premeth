'use client';

// Catches unexpected runtime errors in any route and shows a calm screen
// instead of a raw React crash. Next.js renders this automatically.

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative min-h-screen grid place-items-center px-6 overflow-hidden">
      <div className="aurora-field aurora-animate" aria-hidden />
      <div className="relative z-10 max-w-md text-center">
        <p className="marginalia text-accent-bright">Something broke</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-coal-900">
          That page hit a <span className="text-aurora">snag.</span>
        </h1>
        <p className="mt-3 text-coal-600 leading-relaxed">
          The problem is on our end, not yours. Try again, and if it keeps happening, let us
          know and we will look into it.
        </p>
        <div className="mt-7 flex items-center justify-center gap-5 flex-wrap">
          <button
            onClick={reset}
            className="press inline-flex items-center gap-2 rounded-full bg-aurora-line px-6 py-2.5 font-semibold text-white shadow-glow hover:shadow-glow-lg tx-color"
          >
            Try again
          </button>
          <Link href="/" className="link-draw text-coal-600 hover:text-coal-900 tx-color">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
