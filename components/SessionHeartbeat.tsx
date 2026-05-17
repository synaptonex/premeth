'use client';

// components/SessionHeartbeat.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Mount once in the root layout. On mount, claims a session token from the
// server and stores it in localStorage. Polls every 60 seconds; if the server
// reports we've been kicked (someone signed in elsewhere), it logs out and
// shows a toast.
//
// Free users get a 401 from the heartbeat endpoint and this component does
// nothing - no DB writes, no toast, no log-out.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const TOKEN_KEY = 'enid_session_token';
const POLL_MS = 60_000;

export default function SessionHeartbeat() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function beat() {
      if (cancelled) return;

      // Don't even hit the endpoint if there's no logged-in session.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const token = localStorage.getItem(TOKEN_KEY);

      try {
        const res = await fetch('/api/session/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) return; // 401 = not signed in, nothing to do

        const data = await res.json();

        if (data.kicked) {
          // Wipe local token and sign out.
          localStorage.removeItem(TOKEN_KEY);
          await supabase.auth.signOut();
          toast.error('Signed out', {
            description:
              'Your Enid+ account was signed in on another device. Only one device can be active at a time.',
            duration: 8000,
          });
          router.push('/login?kicked=1');
          return;
        }

        if (data.token && data.token !== token) {
          localStorage.setItem(TOKEN_KEY, data.token);
        }
      } catch {
        // Network error - silently ignore, retry on next beat.
      }
    }

    // Initial beat, then poll.
    beat();
    const interval = setInterval(beat, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router]);

  return null; // Renders nothing.
}
