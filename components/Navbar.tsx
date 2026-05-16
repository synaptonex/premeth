'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Menu, X } from 'lucide-react';
import { useEnidPlus } from '@/lib/enid-plus.client';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isPlus } = useEnidPlus();

  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('enid_session_token');
    }
    router.push('/');
    router.refresh();
  }

  const linkCls = (href: string) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return `text-sm tx-color ${
      active ? 'text-coal-900' : 'text-coal-500 hover:text-coal-900'
    }`;
  };

  return (
    <header className="border-b border-coal-rule">
      <div className="mx-auto max-w-6xl px-6 md:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="text-coal-900 text-base font-medium tracking-tight">
          Enid
          {isPlus && <span className="text-accent ml-0.5">+</span>}
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/exams" className={linkCls('/exams')}>Papers</Link>
          <Link href="/aggregate" className={linkCls('/aggregate')}>Aggregate</Link>
          {user && (
            <Link href="/drill" className={linkCls('/drill')}>Drill</Link>
          )}
          {user && isPlus && (
            <>
              <Link href="/vault" className={linkCls('/vault')}>Vault</Link>
              <Link href="/mock" className={linkCls('/mock')}>Mock</Link>
            </>
          )}
          <Link href="/about" className={linkCls('/about')}>About</Link>
          {user && (
            <Link href="/dashboard" className={linkCls('/dashboard')}>Dashboard</Link>
          )}
          {!isPlus && (
            <Link href="/pricing" className={linkCls('/pricing')}>
              Enid<span className="text-accent">+</span>
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link
                href="/profile"
                className="text-sm text-coal-500 hover:text-coal-900 tx-color truncate max-w-[10rem]"
              >
                {user.email}
              </Link>
              <button
                onClick={signOut}
                className="text-sm text-coal-500 hover:text-coal-900 tx-color"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-coal-500 hover:text-coal-900 tx-color">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="press text-sm font-medium text-coal-900 border-b border-coal-900 pb-0.5 tx-color"
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 -mr-2 text-coal-900"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-coal-rule bg-coal px-6 py-6 space-y-4">
          <MobileLink href="/exams" onClick={() => setMenuOpen(false)}>Papers</MobileLink>
          <MobileLink href="/aggregate" onClick={() => setMenuOpen(false)}>Aggregate Calculator</MobileLink>
          {user && (
            <MobileLink href="/drill" onClick={() => setMenuOpen(false)}>Daily Drill</MobileLink>
          )}
          {user && isPlus && (
            <>
              <MobileLink href="/vault" onClick={() => setMenuOpen(false)}>Mistake Vault</MobileLink>
              <MobileLink href="/mock" onClick={() => setMenuOpen(false)}>Mock Exam</MobileLink>
              <MobileLink href="/goal" onClick={() => setMenuOpen(false)}>Goal Tracker</MobileLink>
            </>
          )}
          <MobileLink href="/about" onClick={() => setMenuOpen(false)}>About</MobileLink>
          {user ? (
            <>
              <MobileLink href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MobileLink>
              <MobileLink href="/profile" onClick={() => setMenuOpen(false)}>Profile</MobileLink>
              {!isPlus && (
                <Link
                  href="/pricing"
                  onClick={() => setMenuOpen(false)}
                  className="block text-base text-coal-900"
                >
                  Enid<span className="text-accent">+</span>
                </Link>
              )}
              <button onClick={signOut} className="block text-base text-coal-600">
                Sign out
              </button>
            </>
          ) : (
            <>
              {!isPlus && (
                <Link
                  href="/pricing"
                  onClick={() => setMenuOpen(false)}
                  className="block text-base text-coal-900"
                >
                  Enid<span className="text-accent">+</span>
                </Link>
              )}
              <MobileLink href="/login" onClick={() => setMenuOpen(false)}>Sign in</MobileLink>
              <MobileLink href="/signup" onClick={() => setMenuOpen(false)}>Create account</MobileLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}

function MobileLink({
  href, onClick, children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} onClick={onClick} className="block text-base text-coal-700">
      {children}
    </Link>
  );
}
