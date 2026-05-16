// app/api/admin/approve/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Admin approves a pending payment. We:
//   1. Verify the caller is_admin = true.
//   2. Mark the payment_request approved.
//   3. Generate a redemption_code bound to the buyer's user_id.
//   4. Return the code to the admin (they'll send it to the buyer via WhatsApp).
//
// The code is NOT auto-applied. The buyer types it into /redeem themselves.
// This is intentional — it gives the buyer a moment of "I'm using my code"
// ownership, and means a fat-fingered approval doesn't silently activate
// someone's account.
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

  // ─── Generate a unique code (retry on the rare collision) ─────────────────
  let code: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateRedemptionCode();
    const { data: existing } = await supabase
      .from('redemption_codes')
      .select('code')
      .eq('code', candidate)
      .maybeSingle();
    if (!existing) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    return NextResponse.json({ error: 'Code generation failed, try again' }, { status: 500 });
  }

  // ─── Insert the code, bound to the BUYER (not the admin) ──────────────────
  const { error: codeErr } = await supabase
    .from('redemption_codes')
    .insert({
      code,
      issued_to: pr.user_id,
      payment_request_id: pr.id,
      duration_months: ENID_PLUS_DURATION_MONTHS,
    });

  if (codeErr) {
    return NextResponse.json({ error: codeErr.message }, { status: 500 });
  }

  // ─── Mark the payment approved ────────────────────────────────────────────
  const { error: updateErr } = await supabase
    .from('payment_requests')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', pr.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    code,
    issued_to: pr.user_id,
    duration_months: ENID_PLUS_DURATION_MONTHS,
  });
}
