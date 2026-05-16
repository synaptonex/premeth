'use client';

/**
 * Redeem a Premeth+ code. Bound to the buyer at issuance time, so a code
 * pasted from anyone else's account will be rejected.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { normalizeRedemptionCode } from '@/lib/premeth-plus';
import { toast } from 'sonner';

export default function RedeemPage() {
  const router = useRouter();
  const supabase = createClient();
  const [raw, setRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ expiresAt: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.replace('/login?next=/redeem');
    })();
  }, [router, supabase]);

  async function handleRedeem() {
    const code = normalizeRedemptionCode(raw);
    if (!code.startsWith('PRMTH-')) {
      toast.error('That does not look like a Premeth code');
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? 'Could not redeem');
      return;
    }
    setResult({ expiresAt: data.expires_at });
  }

  if (result) {
    const expiresAt = new Date(result.expiresAt);
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-6 md:px-10 py-24">
          <div className="grid grid-cols-12 gap-6">
            <div className="hidden md:block col-span-1 marginalia pt-1">
              Active
            </div>
            <div className="col-span-12 md:col-span-11">
              <p className="marginalia mb-6">Redeemed</p>
              <h1 className="text-5xl md:text-6xl font-light tracking-tighter text-coal-900">
                Welcome to Premeth<span className="text-accent">+</span>.
              </h1>
              <p className="mt-6 text-coal-600 text-lg max-w-xl">
                Your subscription runs until{' '}
                <strong className="text-coal-900 font-medium">
                  {expiresAt.toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </strong>.
              </p>
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-px bg-coal-rule border border-coal-rule max-w-2xl">
                <Link href="/drill" className="press bg-coal p-8 hover:bg-coal-50 tx-color">
                  <p className="marginalia mb-3">Start with</p>
                  <h3 className="text-xl font-medium text-coal-900 mb-1">Daily Drill</h3>
                  <p className="text-sm text-coal-500">
                    Thirty MCQs from your weak topics
                  </p>
                </Link>
                <Link href="/dashboard" className="press bg-coal p-8 hover:bg-coal-50 tx-color">
                  <p className="marginalia mb-3">Or</p>
                  <h3 className="text-xl font-medium text-coal-900 mb-1">Dashboard</h3>
                  <p className="text-sm text-coal-500">
                    See your stats and weak topics
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 md:px-10 py-24">
        <div className="grid grid-cols-12 gap-6">
          <div className="hidden md:block col-span-1 marginalia pt-1">
            01 / Redeem
          </div>
          <div className="col-span-12 md:col-span-11">
            <p className="marginalia mb-6">Redeem a code</p>
            <h1 className="text-5xl md:text-6xl font-light tracking-tighter text-coal-900">
              Paste your code.
            </h1>
            <p className="mt-6 text-coal-600 max-w-xl text-lg">
              The code we sent you after your payment. Format is
              PRMTH-XXXX-XXXX. Codes are bound to your account.
            </p>

            <div className="mt-12 max-w-md">
              <label className="block marginalia mb-2">Code</label>
              <input
                type="text"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="PRMTH-XXXX-XXXX"
                className="w-full bg-transparent border-b border-coal-rule py-3 text-coal-900 font-mono text-lg tracking-wider placeholder:text-coal-300 focus:border-coal-900 focus:outline-none tx-color"
                autoFocus
              />
              <button
                onClick={handleRedeem}
                disabled={submitting || !raw}
                className="press mt-8 inline-flex items-center gap-2 text-base font-medium text-coal-900 border-b border-coal-900 pb-1 disabled:opacity-50"
              >
                {submitting ? 'Redeeming…' : 'Redeem'}
                <span aria-hidden>→</span>
              </button>
            </div>

            <p className="mt-16 text-sm text-coal-500 max-w-md">
              Lost your code? Message us on WhatsApp at{' '}
              <a
                href="https://wa.me/923345121203"
                className="text-coal-900 underline underline-offset-2"
              >
                +92 334 5121203
              </a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
