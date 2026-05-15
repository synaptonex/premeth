'use client';

// app/admin/payments/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Admin-only page. Lists pending payment requests, lets you approve/reject.
// Approving generates a code and shows it to you so you can copy it into a
// WhatsApp message to the buyer.
//
// To grant yourself admin: in Supabase SQL Editor, run:
//   update public.profiles set is_admin = true where id = '<your-auth-uid>';
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Check, X, Copy, ShieldAlert, ExternalLink, AlertCircle } from 'lucide-react';

interface PaymentRow {
  id: string;
  user_id: string;
  method: 'jazzcash' | 'easypaisa';
  sender_phone: string;
  transaction_id: string;
  amount_pkr: number;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface FlaggedSub {
  user_id: string;
  fingerprint_count: number;
  current_period_end: string;
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [pending, setPending] = useState<PaymentRow[]>([]);
  const [recent, setRecent] = useState<PaymentRow[]>([]);
  const [flagged, setFlagged] = useState<FlaggedSub[]>([]);
  const [showCode, setShowCode] = useState<{ code: string; userEmail?: string } | null>(null);

  async function refresh() {
    const [{ data: pendingRows }, { data: recentRows }, { data: flaggedRows }] = await Promise.all([
      supabase.from('payment_requests')
        .select('*').eq('status', 'pending').order('created_at', { ascending: true }),
      supabase.from('payment_requests')
        .select('*').neq('status', 'pending').order('created_at', { ascending: false }).limit(20),
      supabase.from('subscriptions')
        .select('user_id, fingerprint_count, current_period_end')
        .eq('flagged_for_review', true).limit(50),
    ]);
    setPending(pendingRows ?? []);
    setRecent(recentRows ?? []);
    setFlagged(flaggedRows ?? []);
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?next=/admin/payments');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', user.id).single();
      if (!profile?.is_admin) {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setAuthorized(true);
      await refresh();
      setLoading(false);
    })();
  }, [router, supabase]);

  async function approve(id: string) {
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_request_id: id }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error('Approve failed', { description: data.error });
      return;
    }
    setShowCode({ code: data.code });
    await refresh();
  }

  async function reject(id: string) {
    const reason = prompt('Why is this rejected? (shown to the buyer)');
    if (!reason) return;
    const res = await fetch('/api/admin/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_request_id: id, reason }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      toast.error('Reject failed', { description: error });
      return;
    }
    toast.success('Rejected');
    await refresh();
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-5xl px-5 py-20 text-center text-ink-400">
          Loading…
        </main>
      </>
    );
  }

  if (!authorized) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-md px-5 py-20 text-center">
          <ShieldAlert className="h-10 w-10 text-crimson mx-auto mb-3" />
          <h1 className="font-display text-3xl text-paper mb-2">Not authorized</h1>
          <p className="text-ink-400">This page is for Premeth admins only.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-meth">Admin</span>
          <h1 className="font-display text-4xl text-paper tracking-tight mt-2">
            Payment review.
          </h1>
          <p className="text-ink-400 mt-2">
            {pending.length} pending · {flagged.length} flagged account{flagged.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* ─── Generated code modal ────────────────────────────────────── */}
        {showCode && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-ink-950/80 backdrop-blur-sm p-5"
            onClick={() => setShowCode(null)}
          >
            <div
              className="w-full max-w-md rounded-xl border border-meth/40 bg-ink-900 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-xl text-paper mb-1">Code generated</h3>
              <p className="text-sm text-ink-400 mb-5">
                Copy this code and send it to the buyer on WhatsApp. They'll
                enter it at /redeem.
              </p>
              <div className="flex items-center gap-2 mb-5">
                <code className="flex-1 rounded-md bg-ink-950 border border-ink-800 px-4 py-3 font-mono text-lg text-meth text-center tracking-wider">
                  {showCode.code}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(showCode.code);
                    toast.success('Copied');
                  }}
                  className="press p-3 rounded-md border border-ink-700 hover:border-meth tx-color"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => setShowCode(null)}
                className="press w-full rounded-md bg-meth text-ink-950 px-5 py-2.5 font-medium hover:bg-meth-300 tx-color"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ─── Flagged accounts ────────────────────────────────────────── */}
        {flagged.length > 0 && (
          <section className="mb-10">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <h2 className="font-display text-lg text-paper">Accounts flagged for review</h2>
              </div>
              <p className="text-sm text-ink-400 mb-4">
                These Premeth+ accounts have logged in from {'>'}5 distinct devices/networks
                in the last 7 days. Worth checking in case the code is being shared.
              </p>
              <ul className="space-y-2">
                {flagged.map((f) => (
                  <li key={f.user_id} className="rounded-md border border-ink-800 bg-ink-900/40 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <code className="text-ink-300 truncate">{f.user_id}</code>
                      <span className="text-amber-400 shrink-0">
                        {f.fingerprint_count} fingerprints
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ─── Pending payments ────────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="font-display text-2xl text-paper mb-4">Pending ({pending.length})</h2>
          {pending.length === 0 ? (
            <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-8 text-center text-ink-500">
              No pending payments. Inbox zero.
            </div>
          ) : (
            <ul className="space-y-3">
              {pending.map((p) => (
                <PaymentCard key={p.id} p={p} onApprove={() => approve(p.id)} onReject={() => reject(p.id)} />
              ))}
            </ul>
          )}
        </section>

        {/* ─── Recent decisions ────────────────────────────────────────── */}
        <section>
          <h2 className="font-display text-2xl text-paper mb-4">Recent decisions</h2>
          <ul className="divide-y divide-ink-800 border-t border-b border-ink-800">
            {recent.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-ink-300 truncate">{p.transaction_id}</span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
                      p.status === 'approved'
                        ? 'bg-meth/15 text-meth border border-meth/30'
                        : 'bg-crimson/15 text-crimson border border-crimson/30'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    {p.method} · Rs {p.amount_pkr.toLocaleString()} · {p.sender_phone}
                  </div>
                </div>
                <div className="text-xs text-ink-500 shrink-0">
                  {new Date(p.created_at).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}

function PaymentCard({
  p, onApprove, onReject,
}: { p: PaymentRow; onApprove: () => void; onReject: () => void }) {
  return (
    <li className="rounded-xl border border-ink-800 bg-ink-900/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="font-display text-lg text-paper">
            Rs {p.amount_pkr.toLocaleString()} via {p.method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'}
          </div>
          <div className="text-xs text-ink-500 mt-0.5">
            Submitted {new Date(p.created_at).toLocaleString()}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onReject}
            className="press inline-flex items-center gap-1.5 rounded-md border border-ink-700 hover:border-crimson hover:text-crimson px-3 py-1.5 text-sm tx-color"
          >
            <X className="h-3.5 w-3.5" /> Reject
          </button>
          <button
            onClick={onApprove}
            className="press inline-flex items-center gap-1.5 rounded-md bg-meth text-ink-950 px-3 py-1.5 text-sm font-medium hover:bg-meth-300 tx-color"
          >
            <Check className="h-3.5 w-3.5" /> Approve & generate code
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <Field label="Sender phone" value={p.sender_phone} mono />
        <Field label="Transaction ID" value={p.transaction_id} mono copyable />
        <Field label="Buyer user ID" value={p.user_id} mono copyable />
        {p.notes && <Field label="Notes" value={p.notes} />}
      </div>
    </li>
  );
}

function Field({
  label, value, mono, copyable,
}: { label: string; value: string; mono?: boolean; copyable?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-0.5">{label}</div>
      <div className={`text-ink-200 flex items-center gap-2 ${mono ? 'font-mono' : ''}`}>
        <span className="truncate">{value}</span>
        {copyable && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(value);
              toast.success('Copied');
            }}
            className="press shrink-0 p-1 rounded hover:bg-ink-800 tx-color"
            title="Copy"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
