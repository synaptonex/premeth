'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AuthShell from '@/components/AuthShell';
import { toast } from 'sonner';
import { Eye, EyeOff, Check } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Live password strength checks — visible so users know what's expected.
  const checks = {
    length: password.length >= 8,
    letter: /[a-zA-Z]/.test(password),
    number: /\d/.test(password),
  };
  const usernameValid = /^[a-zA-Z0-9_]{3,24}$/.test(username);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!usernameValid) {
      toast.error('Username must be 3–24 characters, letters, numbers, or underscores.');
      return;
    }
    if (!checks.length || !checks.letter || !checks.number) {
      toast.error('Password needs 8+ characters with letters and a number.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      toast.error('Could not create account', { description: error.message });
      return;
    }

    toast.success('Check your inbox', {
      description: 'Click the confirmation link to finish signing up.',
    });
    router.push('/login');
  }

  return (
    <AuthShell
      title="Create your account."
      subtitle="Practice is free without an account. Sign up to save attempts and track weak topics."
      footer={
        <>
          Already have one?{' '}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-coal-600 mb-1.5">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
            placeholder="rana_med"
            autoComplete="username"
            required
            className="w-full px-3 py-2.5 rounded-md bg-coal-50 border border-coal-rule text-coal-900 placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color"
          />
          <p className="text-xs text-coal-500 mt-1.5">
            3–24 characters. Letters, numbers, underscores. You can change this later.
          </p>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-coal-600 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="w-full px-3 py-2.5 rounded-md bg-coal-50 border border-coal-rule text-coal-900 placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-coal-600 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              className="w-full pl-3 pr-10 py-2.5 rounded-md bg-coal-50 border border-coal-rule text-coal-900 placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color"
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
          <ul className="mt-2 space-y-1 text-xs">
            <PwCheck ok={checks.length} label="8+ characters" />
            <PwCheck ok={checks.letter} label="At least one letter" />
            <PwCheck ok={checks.number} label="At least one number" />
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="press w-full py-2.5 rounded-md bg-accent text-coal font-medium hover:bg-accent/90 disabled:opacity-50 tx-color"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-xs text-coal-500 leading-relaxed">
          By signing up you agree that we'll send you an email confirmation. We
          don't email you again unless you ask us to reset your password.
        </p>
      </form>
    </AuthShell>
  );
}

function PwCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={`flex items-center gap-1.5 ${
        ok ? 'text-accent' : 'text-coal-500'
      }`}
      style={{ transition: 'color 160ms var(--ease-out)' }}
    >
      <Check
        className="h-3 w-3"
        style={{
          opacity: ok ? 1 : 0.3,
          transition: 'opacity 160ms var(--ease-out)',
        }}
      />
      {label}
    </li>
  );
}
