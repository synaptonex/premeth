'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AuthShell from '@/components/AuthShell';
import { toast } from 'sonner';
import { Eye, EyeOff, Check } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Supabase's reset link puts a recovery token in the URL hash, which the
  // client SDK picks up automatically and turns into a temporary session.
  // We just wait until that's happened before allowing submit.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      } else {
        const { data: sub } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
            setReady(true);
          }
        });
        // Stop listening after 5 seconds - if no session, the link is bad.
        setTimeout(() => sub.subscription.unsubscribe(), 5000);
      }
    });
  }, [supabase]);

  const checks = {
    length: password.length >= 8,
    letter: /[a-zA-Z]/.test(password),
    number: /\d/.test(password),
    match: password.length > 0 && password === confirm,
  };
  const canSubmit = ready && checks.length && checks.letter && checks.number && checks.match;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error('Could not update password', { description: error.message });
      return;
    }
    toast.success('Password updated. You are signed in.');
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <AuthShell
      title="Set a new password."
      subtitle={
        ready
          ? "You're signed in via your reset link. Pick a new password and you're done."
          : "Verifying your reset link…"
      }
      footer={
        <Link href="/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-coal-600 mb-1.5">
            New password
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              disabled={!ready}
              className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-coal-100 border border-coal-rule text-coal-900 placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-coal-500 hover:text-coal-900 tx-color"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-coal-600 mb-1.5">
            Confirm new password
          </label>
          <input
            type={showPw ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            disabled={!ready}
            className="w-full px-3 py-2.5 rounded-xl bg-coal-100 border border-coal-rule text-coal-900 placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color disabled:opacity-50"
          />
        </div>

        <ul className="space-y-1 text-xs">
          <PwCheck ok={checks.length} label="8+ characters" />
          <PwCheck ok={checks.letter} label="At least one letter" />
          <PwCheck ok={checks.number} label="At least one number" />
          <PwCheck ok={checks.match}  label="Passwords match" />
        </ul>

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="press w-full py-2.5 rounded-full bg-aurora-line text-white shadow-glow font-semibold hover:shadow-glow-lg disabled:opacity-40 disabled:cursor-not-allowed tx-color"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthShell>
  );
}

function PwCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={`flex items-center gap-1.5 ${ok ? 'text-accent' : 'text-coal-500'}`}
      style={{ transition: 'color 160ms var(--ease-out)' }}
    >
      <Check
        className="h-3 w-3"
        style={{ opacity: ok ? 1 : 0.3, transition: 'opacity 160ms var(--ease-out)' }}
      />
      {label}
    </li>
  );
}
