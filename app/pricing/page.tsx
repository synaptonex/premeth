'use client';

// app/pricing/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The pricing page. Shows the free vs Premeth+ comparison table, then a
// JazzCash/EasyPaisa payment instructions block, then a form for the user to
// submit their transaction ID once they've sent the money.
//
// After submission they see "We're verifying — you'll get your code on
// WhatsApp within 24 hours". The admin reviews in /admin/payments.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import {
  PREMETH_PLUS_PRICE_PKR,
  PREMETH_PLUS_FOUNDERS_PRICE_PKR,
  PREMETH_PLUS_FOUNDERS_LIMIT,
  PREMETH_PLUS_DURATION_MONTHS,
  PAYMENT_ACCOUNTS,
  usePremethPlus,
} from '@/lib/premeth-plus';
import { toast } from 'sonner';
import {
  Check, X, Sparkles, Wallet, Smartphone, Copy, ArrowRight, ShieldCheck, Clock,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const FEATURES: { label: string; free: boolean; plus: boolean }[] = [
  { label: 'All 400,000+ MCQs and 2,500+ past papers', free: true, plus: true },
  { label: 'Diagrams, scratchpad, question reporting', free: true, plus: true },
  { label: 'Account, save attempts, weak-topic dashboard', free: true, plus: true },
  { label: 'Adaptive Daily Drill — 30 MCQs from your weakest chapters', free: false, plus: true },
  { label: 'Full timed mock exams (180-MCQ, 180-min PMDC simulation)', free: false, plus: true },
  { label: 'Mistake Vault — spaced repetition on every wrong answer', free: false, plus: true },
  { label: 'Goal tracker + adaptive study plan', free: false, plus: true },
  { label: 'Streaks & accountability', free: false, plus: true },
  { label: 'Export attempts as PDF', free: false, plus: true },
  { label: 'No "Support Premeth" prompts', free: false, plus: true },
];

export default function PricingPage() {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const sub = usePremethPlus();

  const [step, setStep] = useState<'choose' | 'pay' | 'submit' | 'done'>('choose');
  const [method, setMethod] = useState<'jazzcash' | 'easypaisa'>('jazzcash');
  const [amount, setAmount] = useState(PREMETH_PLUS_PRICE_PKR);

  const [senderPhone, setSenderPhone] = useState('');
  const [txid, setTxid] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useGSAP(() => {
    gsap.from('.pricing-row', {
      autoAlpha: 0, y: 8, duration: 0.4, stagger: 0.03, ease: 'power3.out',
    });
  }, { scope: root });

  async function submitPayment() {
    setSubmitting(true);
    const res = await fetch('/api/payments/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method,
        sender_phone: senderPhone,
        transaction_id: txid,
        amount_pkr: amount,
        notes,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const { error } = await res.json();
      toast.error('Could not submit', { description: error });
      return;
    }

    setStep('done');
    toast.success('Payment proof submitted', {
      description: "We'll verify and send your code within 24 hours.",
    });
  }

  const account = PAYMENT_ACCOUNTS[method];

  return (
    <>
      <Navbar />
      <main ref={root} className="mx-auto max-w-5xl px-5 py-12">
        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <span className="text-xs uppercase tracking-widest text-meth">Premeth+</span>
          <h1 className="font-display text-4xl md:text-5xl text-paper tracking-tight mt-2">
            All the data. Now with a coach.
          </h1>
          <p className="text-ink-400 mt-3 max-w-2xl mx-auto">
            Practice is — and always will be — free. Premeth+ adds the tools we
            wished we had for our own MDCAT prep: a personalized daily drill, a
            mistake vault that won't let you forget, and full mock-exam mode.
          </p>
        </div>

        {/* If already subscribed, show their status instead of the upsell. */}
        {sub.isActive ? (
          <div className="rounded-xl border border-meth/40 bg-meth/5 p-8 text-center mb-10">
            <div className="inline-grid place-items-center h-12 w-12 rounded-full bg-meth/20 border border-meth/40 mb-3">
              <ShieldCheck className="h-6 w-6 text-meth" />
            </div>
            <h2 className="font-display text-2xl text-paper">You're on Premeth+.</h2>
            <p className="text-ink-300 mt-2">
              {sub.daysRemaining} day{sub.daysRemaining === 1 ? '' : 's'} remaining
              {sub.expiresAt && ` · expires ${sub.expiresAt.toLocaleDateString()}`}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 justify-center">
              <Link
                href="/drill"
                className="press inline-flex items-center gap-2 rounded-md bg-meth text-ink-950 px-5 py-2.5 font-medium hover:bg-meth-300 tx-color"
              >
                Open Daily Drill <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/vault"
                className="press inline-flex items-center rounded-md border border-ink-700 px-5 py-2.5 hover:border-meth/50 hover:text-meth tx-color"
              >
                Mistake Vault
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ─── Comparison table ──────────────────────────────────────── */}
            <div className="overflow-hidden rounded-xl border border-ink-800 mb-10">
              <div className="grid grid-cols-[1fr,90px,90px] md:grid-cols-[1fr,140px,140px] bg-ink-900/60 border-b border-ink-800">
                <div className="p-4 text-xs uppercase tracking-wider text-ink-500">What you get</div>
                <div className="p-4 text-center">
                  <div className="text-xs uppercase tracking-wider text-ink-500">Free</div>
                  <div className="font-display text-paper">Rs 0</div>
                </div>
                <div className="p-4 text-center bg-meth/5 border-l border-meth/20">
                  <div className="text-xs uppercase tracking-wider text-meth">Premeth+</div>
                  <div className="font-display text-paper">Rs {PREMETH_PLUS_PRICE_PKR.toLocaleString()}</div>
                  <div className="text-[10px] text-ink-500 mt-0.5">/ {PREMETH_PLUS_DURATION_MONTHS} months</div>
                </div>
              </div>
              {FEATURES.map((f) => (
                <div
                  key={f.label}
                  className="pricing-row grid grid-cols-[1fr,90px,90px] md:grid-cols-[1fr,140px,140px] border-b border-ink-900 last:border-b-0"
                >
                  <div className="p-4 text-sm text-ink-200">{f.label}</div>
                  <div className="p-4 grid place-items-center">
                    {f.free ? (
                      <Check className="h-4 w-4 text-meth" />
                    ) : (
                      <X className="h-4 w-4 text-ink-700" />
                    )}
                  </div>
                  <div className="p-4 grid place-items-center bg-meth/[0.03] border-l border-meth/10">
                    {f.plus ? (
                      <Check className="h-4 w-4 text-meth" />
                    ) : (
                      <X className="h-4 w-4 text-ink-700" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-meth/30 bg-meth/5 p-4 mb-10 text-sm flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-meth shrink-0 mt-0.5" />
              <div>
                <strong className="text-paper">Founders' pricing.</strong>{' '}
                <span className="text-ink-300">
                  First {PREMETH_PLUS_FOUNDERS_LIMIT} buyers pay Rs{' '}
                  {PREMETH_PLUS_FOUNDERS_PRICE_PKR} instead of Rs {PREMETH_PLUS_PRICE_PKR}.
                  Pick that amount below if you qualify — we'll confirm when we
                  verify your transaction.
                </span>
              </div>
            </div>

            {/* ─── Step: choose & pay ──────────────────────────────────── */}
            {step === 'choose' && (
              <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-6 md:p-8">
                <h2 className="font-display text-2xl text-paper mb-1">
                  Step 1 — pick your payment method.
                </h2>
                <p className="text-sm text-ink-400 mb-6">
                  We'll show you the account number to send to.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => setMethod('jazzcash')}
                    className={`press rounded-lg border p-4 text-left tx-color ${
                      method === 'jazzcash'
                        ? 'border-meth bg-meth/5'
                        : 'border-ink-800 hover:border-ink-700'
                    }`}
                  >
                    <Wallet className="h-5 w-5 text-meth mb-2" />
                    <div className="font-medium text-paper">JazzCash</div>
                    <div className="text-xs text-ink-400">Send to our mobile account, then submit the TID.</div>
                  </button>
                  <button
                    onClick={() => setMethod('easypaisa')}
                    className={`press rounded-lg border p-4 text-left tx-color ${
                      method === 'easypaisa'
                        ? 'border-meth bg-meth/5'
                        : 'border-ink-800 hover:border-ink-700'
                    }`}
                  >
                    <Smartphone className="h-5 w-5 text-meth mb-2" />
                    <div className="font-medium text-paper">EasyPaisa</div>
                    <div className="text-xs text-ink-400">Send to our mobile account, then submit the TID.</div>
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => setAmount(PREMETH_PLUS_PRICE_PKR)}
                    className={`press rounded-lg border p-4 text-left tx-color ${
                      amount === PREMETH_PLUS_PRICE_PKR
                        ? 'border-meth bg-meth/5'
                        : 'border-ink-800 hover:border-ink-700'
                    }`}
                  >
                    <div className="text-xs uppercase tracking-wider text-ink-500">Standard</div>
                    <div className="font-display text-2xl text-paper">Rs {PREMETH_PLUS_PRICE_PKR.toLocaleString()}</div>
                  </button>
                  <button
                    onClick={() => setAmount(PREMETH_PLUS_FOUNDERS_PRICE_PKR)}
                    className={`press rounded-lg border p-4 text-left tx-color ${
                      amount === PREMETH_PLUS_FOUNDERS_PRICE_PKR
                        ? 'border-meth bg-meth/5'
                        : 'border-ink-800 hover:border-ink-700'
                    }`}
                  >
                    <div className="text-xs uppercase tracking-wider text-meth">Founders (first {PREMETH_PLUS_FOUNDERS_LIMIT})</div>
                    <div className="font-display text-2xl text-paper">Rs {PREMETH_PLUS_FOUNDERS_PRICE_PKR.toLocaleString()}</div>
                  </button>
                </div>

                <button
                  onClick={() => setStep('pay')}
                  className="press w-full inline-flex items-center justify-center gap-2 rounded-md bg-meth text-ink-950 px-5 py-3 font-medium hover:bg-meth-300 tx-color"
                >
                  Show me the account number <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {step === 'pay' && (
              <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-6 md:p-8">
                <h2 className="font-display text-2xl text-paper mb-1">
                  Step 2 — send Rs {amount.toLocaleString()} to this number.
                </h2>
                <p className="text-sm text-ink-400 mb-6">
                  Open your {method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} app, send
                  the money, then come back here.
                </p>

                <div className="rounded-lg border border-ink-800 bg-ink-950/60 p-5 mb-6">
                  <div className="text-xs uppercase tracking-wider text-ink-500 mb-2">
                    {method === 'jazzcash' ? 'JazzCash account' : 'EasyPaisa account'}
                  </div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <div className="font-display text-2xl text-paper">{account.accountNumber}</div>
                      <div className="text-sm text-ink-400">{account.accountName}</div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(account.accountNumber);
                        toast.success('Copied');
                      }}
                      className="press inline-flex items-center gap-2 rounded-md border border-ink-700 px-3 py-2 text-sm hover:border-meth/50 tx-color"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </button>
                  </div>
                  <p className="text-xs text-ink-500 mt-3">{account.note}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep('choose')}
                    className="press inline-flex items-center rounded-md border border-ink-700 px-4 py-2.5 hover:border-ink-500 tx-color"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('submit')}
                    className="press flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-meth text-ink-950 px-5 py-2.5 font-medium hover:bg-meth-300 tx-color"
                  >
                    I've sent it — let me submit my TID <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 'submit' && (
              <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-6 md:p-8">
                <h2 className="font-display text-2xl text-paper mb-1">
                  Step 3 — tell us the transaction details.
                </h2>
                <p className="text-sm text-ink-400 mb-6">
                  We'll verify against our account log. The TID is on the SMS
                  receipt from {method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'}.
                </p>

                <div className="space-y-4">
                  <Field
                    label="The number you sent from"
                    value={senderPhone}
                    onChange={setSenderPhone}
                    placeholder="03XX XXXXXXX"
                  />
                  <Field
                    label={`${method === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} Transaction ID (TID)`}
                    value={txid}
                    onChange={setTxid}
                    placeholder="e.g. 39248302394"
                  />
                  <Field
                    label="Notes (optional)"
                    value={notes}
                    onChange={setNotes}
                    placeholder="Anything we should know — e.g. 'sent at 2:14 PM'"
                  />
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setStep('pay')}
                    className="press inline-flex items-center rounded-md border border-ink-700 px-4 py-2.5 hover:border-ink-500 tx-color"
                  >
                    Back
                  </button>
                  <button
                    onClick={submitPayment}
                    disabled={!senderPhone || !txid || submitting}
                    className="press flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-meth text-ink-950 px-5 py-2.5 font-medium hover:bg-meth-300 tx-color disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting…' : 'Submit for verification'}
                  </button>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="rounded-xl border border-meth/40 bg-meth/5 p-8 text-center">
                <div className="inline-grid place-items-center h-14 w-14 rounded-full bg-meth/20 border border-meth/40 mb-4">
                  <Clock className="h-6 w-6 text-meth" />
                </div>
                <h2 className="font-display text-2xl text-paper mb-2">
                  Got it. We're verifying.
                </h2>
                <p className="text-ink-300 max-w-md mx-auto">
                  We'll cross-check your TID with our account log. Once verified
                  (usually within 24 hours), we'll send you a redemption code
                  via WhatsApp. Type it into{' '}
                  <Link href="/redeem" className="text-meth hover:underline">/redeem</Link>{' '}
                  to start your {PREMETH_PLUS_DURATION_MONTHS}-month access.
                </p>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

function Field({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (s: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-sm text-ink-300 mb-1.5">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md bg-ink-950 border border-ink-800 px-3 py-2.5 text-paper focus:outline-none focus:border-meth"
      />
    </label>
  );
}
