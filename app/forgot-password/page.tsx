'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import AuthShell from '@/components/AuthShell';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const redirectTo =
      `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setLoading(false);

    if (error) {
      toast.error('Could not send reset email', { description: error.message });
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your inbox."
        subtitle={`We sent a password reset link to ${email}.`}
        footer={
          <>
            Wrong email?{' '}
            <button
              onClick={() => setSent(false)}
              className="text-meth hover:underline"
            >
              Try a different one
            </button>
          </>
        }
      >
        <div className="rounded-lg border border-ink-800 bg-ink-900/40 p-5">
          <div className="inline-grid place-items-center h-10 w-10 rounded-lg bg-meth/10 border border-meth/20 text-meth mb-3">
            <Mail className="h-5 w-5" />
          </div>
          <p className="text-sm text-ink-300 leading-relaxed">
            The link is good for one hour. If you don't see it, check your spam
            folder. Once you click it, you'll set a new password and you'll be
            signed in.
          </p>
        </div>
        <Link
          href="/login"
          className="block text-center mt-4 text-sm text-ink-400 hover:text-meth tx-color"
        >
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to set a new one."
      footer={
        <>
          Remembered it?{' '}
          <Link href="/login" className="text-meth hover:underline">
            Sign in instead
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-ink-400 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            autoFocus
            className="w-full px-3 py-2.5 rounded-md bg-ink-900 border border-ink-800 text-paper placeholder:text-ink-600 focus:border-meth focus:outline-none tx-color"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="press w-full py-2.5 rounded-md bg-meth text-ink-950 font-medium hover:bg-meth-300 disabled:opacity-50 tx-color"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthShell>
  );
}
