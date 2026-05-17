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
    // Surface the error for debugging without exposing it to the user.
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen grid place-items-center bg-coal px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-widest text-accent">
          Something broke
        </p>
        <h1 className="mt-3 text-3xl font-light tracking-tighter text-coal-900">
          That page hit a snag.
        </h1>
        <p className="mt-3 text-coal-600 leading-relaxed">
          The problem is on our end, not yours. Try again, and if it keeps
          happening, let us know and we will look into it.
        </p>
        <div className="mt-7 flex items-center justify-center gap-x-6 gap-y-3 flex-wrap">
          <button
            onClick={reset}
            className="press inline-flex items-center gap-2 bg-accent text-coal px-5 py-2.5 font-medium hover:opacity-90 tx-color"
          >
            Try again
          </button>
          <Link
            href="/"
            className="link-draw text-coal-600 hover:text-coal-900 tx-color"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
