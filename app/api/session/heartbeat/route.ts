// app/api/session/heartbeat/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Called by every page load while logged in.
//
//   Layer 2 — Single concurrent session:
//     We store the latest session_token on the subscription row. If a heartbeat
//     arrives with a token that doesn't match the latest, we tell the client
//     "you've been signed out from another device" and the client signs out.
//
//   Layer 3 — Fingerprint tripwire:
//     We log distinct (ip + user-agent) fingerprints. If >5 unique fingerprints
//     in 7 days, we flag the account for admin review. Flagging doesn't block
//     access — it just shows up in your admin dashboard.
//
// Only applies to Premeth+ users. Free users are not tracked.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

function fingerprint(ip: string | null, ua: string | null): string {
  return crypto
    .createHash('sha256')
    .update(`${ip ?? 'noip'}::${ua ?? 'noua'}`)
    .digest('hex')
    .slice(0, 32);
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ active: false }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const clientToken: string | undefined = body?.token;

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null;
  const ua = req.headers.get('user-agent') ?? null;
  const fp = fingerprint(ip, ua);

  // ─── Fetch the subscription ───────────────────────────────────────────────
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('current_session_token, current_period_end, status, fingerprint_count, flagged_for_review')
    .eq('user_id', user.id)
    .maybeSingle();

  // No sub means free user — nothing to enforce, just return active.
  if (!sub) return NextResponse.json({ active: true, premethPlus: false });

  const isActive =
    sub.status === 'active' && new Date(sub.current_period_end) > new Date();

  if (!isActive) {
    return NextResponse.json({ active: true, premethPlus: false, expired: true });
  }

  // ─── Layer 2: Concurrent session enforcement ──────────────────────────────
  if (!clientToken) {
    // Client doesn't have a token yet — claim one for them. Old session (if any)
    // is now invalidated.
    const newToken = crypto.randomBytes(24).toString('hex');
    await supabase
      .from('subscriptions')
      .update({
        current_session_token: newToken,
        current_session_started_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
    await logFingerprint(supabase, user.id, fp, ip, ua);
    return NextResponse.json({ active: true, premethPlus: true, token: newToken });
  }

  if (sub.current_session_token && sub.current_session_token !== clientToken) {
    // Someone else logged in. This session is dead.
    return NextResponse.json({
      active: false,
      premethPlus: true,
      kicked: true,
      reason: 'signed_in_elsewhere',
    });
  }

  // Token matches. Refresh activity timestamp.
  await logFingerprint(supabase, user.id, fp, ip, ua);
  return NextResponse.json({ active: true, premethPlus: true, token: clientToken });
}

async function logFingerprint(
  supabase: any,
  userId: string,
  fp: string,
  ip: string | null,
  ua: string | null
) {
  // Insert this fingerprint. Cheap, fire-and-forget; duplicates are fine.
  await supabase.from('session_fingerprints').insert({
    user_id: userId,
    fingerprint_hash: fp,
    ip_address: ip,
    user_agent: ua,
  });

  // Count distinct fingerprints in the last 7 days.
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from('session_fingerprints')
    .select('fingerprint_hash')
    .eq('user_id', userId)
    .gte('created_at', since);

  if (!recent) return;
  const distinct = new Set(recent.map((r: any) => r.fingerprint_hash)).size;

  if (distinct > 5) {
    await supabase
      .from('subscriptions')
      .update({ flagged_for_review: true, fingerprint_count: distinct })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('subscriptions')
      .update({ fingerprint_count: distinct })
      .eq('user_id', userId);
  }
}
