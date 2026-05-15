'use client';

// app/redeem/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// User types in the code they received via WhatsApp. The endpoint enforces:
//   - code exists
//   - not already redeemed
//   - issued_to == auth.uid()  ← the anti-sharing check
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Sparkles, ArrowRight, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function RedeemPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ expiresAt: string } | null>(null);

  async function redeem() {
    setSubmitting(true);
    const res = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    setSubmitting(false);

    const data = await res.json();
    if (!res.ok) {
      toast.error('Could not redeem', { description: data.error });
      return;
    }

    setSuccess({ expiresAt: data.expires_at });
    toast.success('Welcome to Premeth+');
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-5 py-16">
        <div className="text-center mb-8">
          <div className="inline-grid place-items-center h-12 w-12 rounded-full bg-meth/15 border border-meth/30 mb-3">
            <KeyRound className="h-5 w-5 text-meth" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-paper tracking-tight">
            Redeem your code.
          </h1>
          <p className="text-ink-400 mt-2">
            Type in the code we sent you via WhatsApp. It looks like{' '}
            <span className="font-mono text-ink-300">PRMTH-XXXX-XXXX</span>.
          </p>
        </div>

        {success ? (
          <div className="rounded-xl border border-meth/40 bg-meth/5 p-8 text-center">
            <div className="inline-grid place-items-center h-14 w-14 rounded-full bg-meth/20 border border-meth/40 mb-4">
              <Sparkles className="h-6 w-6 text-meth" />
            </div>
            <h2 className="font-display text-2xl text-paper mb-2">You're in.</h2>
            <p className="text-ink-300 mb-5">
              Premeth+ is now active until{' '}
              <strong className="text-paper">
                {new Date(success.expiresAt).toLocaleDateString()}
              </strong>.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/drill"
                className="press inline-flex items-center gap-2 rounded-md bg-meth text-ink-950 px-5 py-2.5 font-medium hover:bg-meth-300 tx-color"
              >
                Try the Daily Drill <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="press inline-flex items-center rounded-md border border-ink-700 px-5 py-2.5 hover:border-meth/50 tx-color"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-6">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="PRMTH-XXXX-XXXX"
              autoFocus
              className="w-full rounded-md bg-ink-950 border border-ink-800 px-4 py-3 text-paper font-mono text-lg text-center tracking-wider uppercase focus:outline-none focus:border-meth"
            />
            <button
              onClick={redeem}
              disabled={!code.trim() || submitting}
              className="press w-full mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-meth text-ink-950 px-5 py-3 font-medium hover:bg-meth-300 tx-color disabled:opacity-50"
            >
              {submitting ? 'Verifying…' : 'Redeem'}
            </button>

            <p className="text-xs text-ink-500 mt-5 leading-relaxed">
              Codes are bound to the account that paid for them. If this code was
              shared with you by a friend, it won't work — you'd need to sign in
              with that friend's account, which we don't recommend. Each code
              redeems exactly once.
            </p>
          </div>
        )}

        <p className="text-center text-sm text-ink-500 mt-6">
          Don't have a code yet?{' '}
          <Link href="/pricing" className="text-meth hover:underline">
            See pricing
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
