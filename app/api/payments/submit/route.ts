// app/api/payments/submit/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Student submits proof of JazzCash/EasyPaisa payment.
// We don't trust anything — we just queue it for admin review.
//
// Pricing is enforced server-side: we call premeth_plus_current_price() RPC
// (defined in migration 0003) which returns 999 if founders' slots are still
// open, else 1499. The client cannot pick a cheaper price by tampering with
// the request — the API rejects anything that doesn't match the current
// server-decided price.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  // ─── Server-side price enforcement ────────────────────────────────────────
  // Call the SECURITY DEFINER RPC. This returns the only valid amount right
  // now: 999 while founders' slots remain, 1499 once they're sold out.
  const { data: currentPrice, error: priceErr } = await supabase
    .rpc('premeth_plus_current_price');

  if (priceErr || typeof currentPrice !== 'number') {
    return NextResponse.json(
      { error: 'Could not verify current price — please refresh and try again.' },
      { status: 500 }
    );
  }

  const amount = Number(amount_pkr);
  if (amount !== currentPrice) {
    return NextResponse.json(
      {
        error: `The current price is Rs ${currentPrice.toLocaleString()}. Please refresh the pricing page — the founders' deal may have just sold out.`,
      },
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
