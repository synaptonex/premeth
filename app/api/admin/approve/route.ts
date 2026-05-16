// app/api/admin/approve/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Admin approves a pending payment. On approval we now activate Enid+ for the
// buyer directly — no code to relay, no /redeem step. The flow is:
//
//   1. Verify the caller is_admin = true.
//   2. Load the pending payment_request.
//   3. Upsert the buyer's subscription (active, extended by duration).
//   4. Record a redemption_code marked already-redeemed, purely as an audit
//      trail linking the payment to the activation.
//   5. Mark the payment_request approved.
//
// Why auto-activate: the old flow made the buyer wait for a WhatsApp message
// and then retype a code. That shed buyers and made the team a relay service.
// The buyer's Enid+ is live the moment an admin clicks approve.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateRedemptionCode, ENID_PLUS_DURATION_MONTHS } from '@/lib/enid-plus';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  // ─── Admin gate ───────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }

  const { payment_request_id } = body ?? {};
  if (!payment_request_id) {
    return NextResponse.json({ error: 'Missing payment_request_id' }, { status: 400 });
  }

  // ─── Load the payment request ─────────────────────────────────────────────
  const { data: pr, error: prErr } = await supabase
    .from('payment_requests')
    .select('id, user_id, status')
    .eq('id', payment_request_id)
    .single();

  if (prErr || !pr) {
    return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
  }

  if (pr.status !== 'pending') {
    return NextResponse.json(
      { error: `Payment is already ${pr.status}` },
      { status: 409 }
    );
  }

  const now = new Date();

  // ─── Activate the subscription for the buyer ──────────────────────────────
  // If the buyer already has time left, extend from their current end so a
  // renewal never burns days. Otherwise start from now.
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('current_period_end')
    .eq('user_id', pr.user_id)
    .maybeSingle();

  const startFrom =
    existing && new Date(existing.current_period_end) > now
      ? new Date(existing.current_period_end)
      : now;

  const newEnd = new Date(startFrom);
  newEnd.setMonth(newEnd.getMonth() + ENID_PLUS_DURATION_MONTHS);

  const { error: subErr } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: pr.user_id,
        status: 'active',
        current_period_start: existing
          ? existing.current_period_end
          : now.toISOString(),
        current_period_end: newEnd.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  // ─── Audit trail: record a code, already redeemed ─────────────────────────
  // We still write a redemption_codes row so every activation is traceable to
  // a payment. It is marked redeemed immediately — nobody needs to type it.
  let code: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateRedemptionCode();
    const { data: clash } = await supabase
      .from('redemption_codes')
      .select('code')
      .eq('code', candidate)
      .maybeSingle();
    if (!clash) {
      code = candidate;
      break;
    }
  }

  if (code) {
    await supabase.from('redemption_codes').insert({
      code,
      issued_to: pr.user_id,
      payment_request_id: pr.id,
      duration_months: ENID_PLUS_DURATION_MONTHS,
      redeemed_at: now.toISOString(),
    });
  }

  // ─── Mark the payment approved ────────────────────────────────────────────
  const { error: updateErr } = await supabase
    .from('payment_requests')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: now.toISOString(),
    })
    .eq('id', pr.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    activated_for: pr.user_id,
    expires_at: newEnd.toISOString(),
    duration_months: ENID_PLUS_DURATION_MONTHS,
  });
}
