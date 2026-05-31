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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    return `relative text-sm tx-color ${
      active
        ? 'text-coal-900 after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-aurora-line'
        : 'text-coal-500 hover:text-coal-900'
    }`;
  };

  return (
    <header
      className={`sticky top-0 z-50 tx-color ${
        scrolled
          ? 'glass border-b border-coal-rule'
          : 'border-b border-transparent bg-coal/40'
      }`}
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="group text-coal-900 text-lg font-bold tracking-tight tx-color hover:text-aurora"
        >
          Enid
          {isPlus && <span className="text-accent-bright ml-0.5">+</span>}
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/exams" className={linkCls('/exams')}>Papers</Link>
          <Link href="/pathways" className={linkCls('/pathways')}>Pathways</Link>
          <Link href="/aggregate" className={linkCls('/aggregate')}>Aggregate</Link>
          <Link href="/forum" className={linkCls('/forum')}>Forum</Link>
          <Link href="/leaderboard" className={linkCls('/leaderboard')}>Leaderboard</Link>
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
              Enid<span className="text-accent-bright">+</span>
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-5">
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
                className="press inline-flex items-center rounded-full bg-aurora-line bg-[length:200%_100%] px-4 py-2 text-sm font-semibold text-white shadow-glow tx-color hover:shadow-glow-lg focus-visible:shadow-glow-lg"
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 -mr-2 text-coal-900 rounded-lg tx-color hover:bg-coal-100"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden glass border-t border-coal-rule px-6 py-6 space-y-4 animate-fade-up">
          <MobileLink href="/exams" onClick={() => setMenuOpen(false)}>Papers</MobileLink>
          <MobileLink href="/pathways" onClick={() => setMenuOpen(false)}>After MDCAT</MobileLink>
          <MobileLink href="/aggregate" onClick={() => setMenuOpen(false)}>Aggregate Calculator</MobileLink>
          <MobileLink href="/forum" onClick={() => setMenuOpen(false)}>Forum</MobileLink>
          <MobileLink href="/leaderboard" onClick={() => setMenuOpen(false)}>Leaderboard</MobileLink>
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
                  Enid<span className="text-accent-bright">+</span>
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
                  Enid<span className="text-accent-bright">+</span>
                </Link>
              )}
              <MobileLink href="/login" onClick={() => setMenuOpen(false)}>Sign in</MobileLink>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="press inline-flex items-center rounded-full bg-aurora-line px-4 py-2 text-sm font-semibold text-white shadow-glow"
              >
                Create account
              </Link>
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
    <Link href={href} onClick={onClick} className="block text-base text-coal-700 hover:text-coal-900 tx-color">
      {children}
    </Link>
  );
}
