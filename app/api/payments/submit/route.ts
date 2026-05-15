// app/api/payments/submit/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Student submits proof of JazzCash/EasyPaisa payment.
// We don't trust anything — we just queue it for admin review.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PREMETH_PLUS_PRICE_PKR, PREMETH_PLUS_FOUNDERS_PRICE_PKR } from '@/lib/premeth-plus';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }

  const { method, sender_phone, transaction_id, amount_pkr, receipt_url, notes } = body ?? {};

  // ─── Validate ─────────────────────────────────────────────────────────────
  if (!['jazzcash', 'easypaisa'].includes(method)) {
    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
  }
  if (typeof sender_phone !== 'string' || sender_phone.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
  }
  if (typeof transaction_id !== 'string' || transaction_id.length < 4) {
    return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
  }
  const amount = Number(amount_pkr);
  // Accept either the regular price or the founders' price.
  const validAmounts = [PREMETH_PLUS_PRICE_PKR, PREMETH_PLUS_FOUNDERS_PRICE_PKR];
  if (!validAmounts.includes(amount)) {
    return NextResponse.json(
      { error: `Amount must be ${PREMETH_PLUS_PRICE_PKR} PKR (or ${PREMETH_PLUS_FOUNDERS_PRICE_PKR} PKR for founders)` },
      { status: 400 }
    );
  }

  // ─── Check for duplicate TID — friendlier than the DB constraint error ────
  const { data: existingTid } = await supabase
    .from('payment_requests')
    .select('id, user_id, status')
    .eq('method', method)
    .eq('transaction_id', transaction_id)
    .maybeSingle();

  if (existingTid) {
    return NextResponse.json(
      { error: 'This transaction ID has already been submitted. If this is wrong, contact support.' },
      { status: 409 }
    );
  }

  // ─── Insert ───────────────────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('payment_requests')
    .insert({
      user_id: user.id,
      method,
      sender_phone: sender_phone.trim(),
      transaction_id: transaction_id.trim(),
      amount_pkr: amount,
      receipt_url: receipt_url ?? null,
      notes: notes?.trim() || null,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, status: 'pending' });
}
