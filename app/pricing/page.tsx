'use client';

/**
 * Pricing and payment flow for Enid+.
 *
 * Steps:
 *  1. Visitor lands and sees the comparison.
 *  2. Picks JazzCash or EasyPaisa.
 *  3. Sees the destination phone number and amount to send.
 *  4. Sends the money from their own app, comes back with the transaction ID.
 *  5. Submits the TID. The request goes into the admin queue.
 *  6. On approval, Enid+ activates on their account automatically. No code.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import {
  ENID_PLUS_PRICE_PKR,
  ENID_PLUS_FOUNDERS_PRICE_PKR,
  ENID_PLUS_FOUNDERS_LIMIT,
  ENID_PLUS_DURATION_MONTHS,
  PAYMENT_ACCOUNTS,
} from '@/lib/enid-plus';
import { useEnidPlus } from '@/lib/enid-plus.client';
import { toast } from 'sonner';
import { Copy, Check, Minus } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const FEATURES: { label: string; free: boolean; plus: boolean }[] = [
  { label: 'All 2,500+ past papers',           free: true,  plus: true  },
  { label: 'Aggregate calculator',            free: true,  plus: true  },
  { label: 'Save attempts and weak topics',   free: true,  plus: true  },
  { label: 'Study streaks',                   free: true,  plus: true  },
  { label: 'Report wrong questions',          free: true,  plus: true  },
  { label: 'Scratchpad and syllabus guide',   free: true,  plus: true  },
  { label: 'One Adaptive Daily Drill a day',  free: true,  plus: true  },
  { label: 'Unlimited Daily Drills',          free: false, plus: true  },
  { label: 'Mistake Vault',                   free: false, plus: true  },
  { label: 'Full timed mock exams',           free: false, plus: true  },
  { label: 'Goal tracker',                    free: false, plus: true  },
  { label: 'Export wrong-answer notebook',    free: false, plus: true  },
];

type Step = 'choose' | 'pay' | 'submit' | 'confirm';
type Method = 'jazzcash' | 'easypaisa';

export default function PricingPage() {
  const router = useRouter();
  const supabase = createClient();
  const root = useRef<HTMLElement>(null);
  const { isPlus, expiresAt, loading: plusLoading } = useEnidPlus();

  const [userId, setUserId] = useState<string | null>(null);
  const [foundersTaken, setFoundersTaken] = useState<number | null>(null);
  const [step, setStep] = useState<Step>('choose');
  const [method, setMethod] = useState<Method | null>(null);
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [latestRequest, setLatestRequest] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { count } = await supabase
        .from('redemption_codes')
        .select('code', { count: 'exact', head: true });
      setFoundersTaken(count ?? 0);

      if (user) {
        const { data } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setLatestRequest(data);
      }
    })();
  }, [supabase]);

  const isFounders =
    foundersTaken !== null && foundersTaken < ENID_PLUS_FOUNDERS_LIMIT;
  const price = isFounders ? ENID_PLUS_FOUNDERS_PRICE_PKR : ENID_PLUS_PRICE_PKR;

  const account = useMemo(() => (method ? PAYMENT_ACCOUNTS[method] : null), [method]);

  useGSAP(
    () => {
      gsap.from('.price-anim', {
        y: 8, autoAlpha: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out',
      });
    },
    { scope: root }
  );

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  async function handleSubmit() {
    if (!userId) {
      router.push('/login?next=/pricing');
      return;
    }
    if (!method || !senderPhone || !transactionId) {
      toast.error('Fill in every field');
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/payments/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method,
        sender_phone: senderPhone.trim(),
        transaction_id: transactionId.trim(),
        amount_pkr: price,
      }),
    });
    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? 'Could not submit');
      return;
    }
    setLatestRequest(data.payment_request);
    setStep('confirm');
  }

  // Active subscriber path
  if (!plusLoading && isPlus) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-6 md:px-10 py-24">
          <div className="grid grid-cols-12 gap-6">
            <div className="hidden md:block col-span-1 marginalia pt-1">
              Active
            </div>
            <div className="col-span-12 md:col-span-11">
              <p className="marginalia mb-4">Your subscription</p>
              <h1 className="text-5xl md:text-6xl font-light tracking-tighter text-coal-900">
                Enid<span className="text-accent">+</span> is active.
              </h1>
              <p className="mt-6 text-coal-600 max-w-xl text-lg">
                Your subscription runs until{' '}
                <strong className="text-coal-900 font-medium">
                  {expiresAt?.toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </strong>.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
                <Link
                  href="/drill"
                  className="press inline-flex items-center gap-2 text-base font-medium text-coal-900 border-b border-coal-900 pb-1"
                >
                  Go to Daily Drill
                  <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="link-draw text-base text-coal-600 hover:text-coal-900 tx-color"
                >
                  Back to dashboard
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
      <main ref={root} className="mx-auto max-w-6xl px-6 md:px-10 py-16 md:py-24">
        {/* Header */}
        <div className="grid grid-cols-12 gap-6 mb-20">
          <div className="hidden md:block col-span-1 marginalia pt-1">
            01 / Plans
          </div>
          <div className="col-span-12 md:col-span-11">
            <p className="price-anim marginalia mb-6">Pricing</p>
            <h1 className="price-anim text-5xl md:text-7xl font-light tracking-tighter text-coal-900 max-w-3xl leading-[0.95]">
              Free is free.
              <br />
              <span className="text-coal-500">Plus is</span>{' '}
              <span className="tabular-nums">Rs {price.toLocaleString()}</span>
              <span className="text-coal-500"> / 6 months.</span>
            </h1>
            {isFounders && foundersTaken !== null && (
              <p className="price-anim marginalia mt-8">
                Founders pricing: {ENID_PLUS_FOUNDERS_LIMIT - foundersTaken} of {ENID_PLUS_FOUNDERS_LIMIT} remaining
              </p>
            )}
          </div>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-12 gap-6 mb-24">
          <div className="hidden md:block col-span-1 marginalia pt-1">
            02 / Compare
          </div>
          <div className="col-span-12 md:col-span-11">
            <div className="border-t border-coal-rule">
              <div className="grid grid-cols-12 py-4 border-b border-coal-rule">
                <div className="col-span-6 md:col-span-8 marginalia">Feature</div>
                <div className="col-span-3 md:col-span-2 marginalia text-right">Free</div>
                <div className="col-span-3 md:col-span-2 marginalia text-right text-accent">Plus</div>
              </div>
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 py-4 border-b border-coal-rule items-center"
                >
                  <div className="col-span-6 md:col-span-8 text-coal-800">
                    {f.label}
                  </div>
                  <div className="col-span-3 md:col-span-2 text-right">
                    {f.free ? (
                      <Check className="inline h-4 w-4 text-coal-900" strokeWidth={2.5} />
                    ) : (
                      <Minus className="inline h-4 w-4 text-coal-500" strokeWidth={2.5} />
                    )}
                  </div>
                  <div className="col-span-3 md:col-span-2 text-right">
                    {f.plus && (
                      <Check className="inline h-4 w-4 text-accent" strokeWidth={2.5} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending payment notice */}
        {latestRequest?.status === 'pending' && step !== 'confirm' && (
          <div className="grid grid-cols-12 gap-6 mb-16">
            <div className="hidden md:block col-span-1" />
            <div className="col-span-12 md:col-span-11">
              <div className="border-t border-coal-rule pt-6">
                <p className="marginalia mb-2">Pending review</p>
                <p className="text-coal-700 text-lg">
                  Your payment was submitted on{' '}
                  {new Date(latestRequest.created_at).toLocaleDateString('en-GB')}.
                  We verify payments within 24 to 48 hours. Once yours is confirmed, Enid+ activates on your account on its own.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment flow */}
        <div className="grid grid-cols-12 gap-6">
          <div className="hidden md:block col-span-1 marginalia pt-1">
            03 / Pay
          </div>
          <div className="col-span-12 md:col-span-11">
            {step === 'choose' && (
              <>
                <p className="marginalia mb-6">Choose a method</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-coal-rule border border-coal-rule">
                  <button
                    onClick={() => { setMethod('jazzcash'); setStep('pay'); }}
                    className="press text-left bg-coal p-8 hover:bg-coal-50 tx-color"
                  >
                    <p className="marginalia mb-3">Option A</p>
                    <h3 className="text-2xl font-medium text-coal-900 mb-1">JazzCash</h3>
                    <p className="text-coal-500 text-sm">
                      Pay from any JazzCash account
                    </p>
                  </button>
                  <button
                    onClick={() => { setMethod('easypaisa'); setStep('pay'); }}
                    className="press text-left bg-coal p-8 hover:bg-coal-50 tx-color"
                  >
                    <p className="marginalia mb-3">Option B</p>
                    <h3 className="text-2xl font-medium text-coal-900 mb-1">EasyPaisa</h3>
                    <p className="text-coal-500 text-sm">
                      Pay from any EasyPaisa account
                    </p>
                  </button>
                </div>
              </>
            )}

            {step === 'pay' && account && (
              <>
                <button
                  onClick={() => setStep('choose')}
                  className="marginalia mb-6 text-coal-500 hover:text-coal-900 tx-color"
                >
                  ← Back
                </button>
                <h2 className="text-3xl font-light tracking-tight text-coal-900 mb-2">
                  Send Rs {price.toLocaleString()} to this number.
                </h2>
                <p className="text-coal-600 mb-10">
                  Open your {method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} app,
                  send the payment, then come back here with your transaction ID.
                </p>

                <dl className="border-t border-coal-rule">
                  <div className="grid grid-cols-12 py-5 border-b border-coal-rule">
                    <dt className="col-span-4 marginalia pt-1">Account number</dt>
                    <dd className="col-span-7 text-coal-900 font-medium tabular-nums">
                      {account.accountNumber}
                    </dd>
                    <button
                      onClick={() => copy(account.accountNumber, 'Number')}
                      className="col-span-1 text-coal-500 hover:text-coal-900 tx-color justify-self-end"
                      aria-label="Copy number"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-12 py-5 border-b border-coal-rule">
                    <dt className="col-span-4 marginalia pt-1">Account name</dt>
                    <dd className="col-span-8 text-coal-900 font-medium">
                      {account.accountName}
                    </dd>
                  </div>
                  <div className="grid grid-cols-12 py-5 border-b border-coal-rule">
                    <dt className="col-span-4 marginalia pt-1">Amount</dt>
                    <dd className="col-span-8 text-coal-900 font-medium tabular-nums">
                      Rs {price.toLocaleString()}
                    </dd>
                  </div>
                  <div className="grid grid-cols-12 py-5 border-b border-coal-rule">
                    <dt className="col-span-4 marginalia pt-1">Duration</dt>
                    <dd className="col-span-8 text-coal-900 font-medium">
                      {ENID_PLUS_DURATION_MONTHS} months from approval
                    </dd>
                  </div>
                </dl>

                <button
                  onClick={() => setStep('submit')}
                  className="press mt-10 inline-flex items-center gap-2 text-base font-medium text-coal-900 border-b border-coal-900 pb-1"
                >
                  I have sent the money
                  <span aria-hidden>→</span>
                </button>
              </>
            )}

            {step === 'submit' && (
              <>
                <button
                  onClick={() => setStep('pay')}
                  className="marginalia mb-6 text-coal-500 hover:text-coal-900 tx-color"
                >
                  ← Back
                </button>
                <h2 className="text-3xl font-light tracking-tight text-coal-900 mb-2">
                  Submit your transaction ID.
                </h2>
                <p className="text-coal-600 mb-10 max-w-xl">
                  We use the TID to verify the payment in our own JazzCash or
                  EasyPaisa account. Once it matches, we activate Enid+ on your account.
                </p>

                <div className="space-y-6 max-w-md">
                  <div>
                    <label className="block marginalia mb-2">
                      Your phone number
                    </label>
                    <input
                      type="tel"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="03XX-XXXXXXX"
                      className="w-full bg-transparent border-b border-coal-rule py-2 text-coal-900 placeholder:text-coal-500 focus:border-coal-900 focus:outline-none tx-color"
                    />
                    <p className="text-xs text-coal-500 mt-2">
                      The number you sent the payment from
                    </p>
                  </div>

                  <div>
                    <label className="block marginalia mb-2">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="From your SMS receipt"
                      className="w-full bg-transparent border-b border-coal-rule py-2 text-coal-900 font-mono placeholder:text-coal-500 focus:border-coal-900 focus:outline-none tx-color"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="press mt-10 inline-flex items-center gap-2 text-base font-medium text-coal-900 border-b border-coal-900 pb-1 disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit for review'}
                  <span aria-hidden>→</span>
                </button>
              </>
            )}

            {step === 'confirm' && (
              <>
                <p className="marginalia mb-6">Submitted</p>
                <h2 className="text-3xl md:text-4xl font-light tracking-tight text-coal-900 mb-4">
                  Payment received. Sit tight.
                </h2>
                <p className="text-coal-600 mb-10 max-w-xl">
                  We verify every payment by hand against our records. This
                  takes 24 to 48 hours. Once yours is confirmed, Enid+ turns
                  on for this account automatically. You do not need a code,
                  and there is nothing else to submit. Check back, or just
                  open Enid in a day or two and it will be active.
                </p>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                  <Link
                    href="/"
                    className="press inline-flex items-center gap-2 text-base font-medium text-coal-900 border-b border-coal-900 pb-1"
                  >
                    Back to home
                    <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href="/exams"
                    className="link-draw text-base text-coal-600 hover:text-coal-900 tx-color"
                  >
                    Practice in the meantime
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
