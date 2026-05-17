// lib/supabase/admin.ts
// ─────────────────────────────────────────────────────────────────────────────
// A Supabase client that uses the service-role key. It BYPASSES Row Level
// Security entirely, so it must only ever be used inside trusted server-side
// API routes, and only AFTER the caller's identity and permission have already
// been checked with the normal (RLS-bound) client.
//
// Never import this into a client component. Never expose the service-role key
// to the browser. It is read from a server-only env var.
//
// Why this exists: money operations (activating a subscription, recording a
// redemption) are written by trusted server code. RLS on those tables is meant
// to stop USERS writing them directly. A server route that has already
// verified the user should not be fighting RLS, because an RLS denial is
// silent and a paying user would get nothing with no error shown.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error(
      'Service-role client is not configured. Set SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
