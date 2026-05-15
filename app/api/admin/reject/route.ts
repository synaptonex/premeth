// app/api/admin/reject/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }
  const { payment_request_id, reason } = body ?? {};
  if (!payment_request_id || typeof reason !== 'string' || !reason.trim()) {
    return NextResponse.json({ error: 'payment_request_id and reason required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('payment_requests')
    .update({
      status: 'rejected',
      rejection_reason: reason.trim(),
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', payment_request_id)
    .eq('status', 'pending');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
