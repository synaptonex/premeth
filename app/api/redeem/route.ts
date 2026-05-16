// app/api/redeem/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// User submits a redemption code. We:
//
//   1. Look up the code.
//   2. Verify it exists, isn't already redeemed, and was issued to THIS user.
//      (This is the layer-1 anti-sharing check - the code is forever bound to
//      the buyer's account. Someone with the code but a different user_id
//      gets rejected here, even if they're logged in.)
//   3. Mark it redeemed.
//   4. Upsert the user's subscription row, extending from max(now, current_end)
//      by duration_months.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeRedemptionCode } from '@/lib/enid-plus';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }

  const raw = body?.code;
  if (typeof raw !== 'string' || raw.length < 5) {
    return NextResponse.json({ error: 'Code required' }, { status: 400 });
  }

  const code = normalizeRedemptionCode(raw);

  // ─── Fetch the code row ───────────────────────────────────────────────────
  const { data: codeRow, error: codeErr } = await supabase
    .from('redemption_codes')
    .select('code, issued_to, duration_months, redeemed_at')
    .eq('code', code)
    .maybeSingle();

  if (codeErr) {
    return NextResponse.json({ error: codeErr.message }, { status: 500 });
  }

  if (!codeRow) {
    return NextResponse.json(
      { error: 'Code not found. Double-check what your buyer-confirmation message said.' },
      { status: 404 }
    );
  }

  if (codeRow.redeemed_at) {
    return NextResponse.json(
      { error: 'This code has already been redeemed.' },
      { status: 409 }
    );
  }

  // ─── THE anti-sharing check ───────────────────────────────────────────────
  // The code was issued to a specific user_id. Even if someone else gets
  // their hands on it, they can't redeem it - they'd have to log in as the
  // buyer first, which means having the buyer's password, which means…
  // we're back to the account-sharing problem, not the code-sharing problem.
  if (codeRow.issued_to !== user.id) {
    return NextResponse.json(
      {
        error:
          "This code was issued to a different account. Codes can only be redeemed on the account that purchased them. If you bought this code, sign in with the email you used to submit your payment.",
      },
      { status: 403 }
    );
  }

  // ─── Compute the new period_end ───────────────────────────────────────────
  // If they already have an active sub, extend from current end. Otherwise,
  // extend from now.
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('current_period_end, status')
    .eq('user_id', user.id)
    .maybeSingle();

  const now = new Date();
  const startFrom =
    existing && new Date(existing.current_period_end) > now
      ? new Date(existing.current_period_end)
      : now;

  const newEnd = new Date(startFrom);
  newEnd.setMonth(newEnd.getMonth() + codeRow.duration_months);

  // ─── Upsert the subscription ──────────────────────────────────────────────
  const { error: subErr } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: user.id,
        status: 'active',
        current_period_start: existing ? existing.current_period_end : now.toISOString(),
        current_period_end: newEnd.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  // ─── Mark the code redeemed ───────────────────────────────────────────────
  const { error: markErr } = await supabase
    .from('redemption_codes')
    .update({ redeemed_at: now.toISOString() })
    .eq('code', code)
    .is('redeemed_at', null); // belt-and-suspenders: race-condition safe

  if (markErr) {
    return NextResponse.json({ error: markErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    expires_at: newEnd.toISOString(),
    duration_months: codeRow.duration_months,
  });
}
