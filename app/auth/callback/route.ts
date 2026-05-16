import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Supabase sends users here after they click an email link (signup confirmation
// or password reset). The PKCE code in the URL gets exchanged for a session,
// then we redirect them onward.
//
// See: https://supabase.com/docs/guides/auth/server-side/nextjs

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code or exchange failed - kick the user back to login with a hint.
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
