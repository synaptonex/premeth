'use client';

// Catches crashes that happen in the root layout itself, which the regular
// error boundary cannot reach. This one has to render its own <html> and
// <body> because the layout failed.

import { useEffect } from 'react';

export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#14130F',
          color: '#F0EBDD',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '420px', textAlign: 'center' }}>
          <h1 style={{ fontWeight: 300, fontSize: '28px' }}>
            Enid hit a snag.
          </h1>
          <p style={{ color: '#928C7F', lineHeight: 1.6 }}>
            The problem is on our end. Reload the page, and if it keeps
            happening, email syncrasy26@gmail.com.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: '20px',
              background: '#E0A341',
              color: '#14130F',
              border: 'none',
              padding: '10px 20px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
