'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { LogOut, User as UserIcon, Menu, X, Sparkles } from 'lucide-react';
import { usePremethPlus } from '@/lib/premeth-plus';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isPlus } = usePremethPlus();

  const [user, setUser] = useState<User | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!user) { setAvatar(null); return; }
    supabase.from('profiles').select('avatar_url').eq('id', user.id).single()
      .then(({ data }) => setAvatar(data?.avatar_url ?? null));
  }, [user, supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    // Clear the session token so SessionHeartbeat doesn't bounce us
    if (typeof window !== 'undefined') {
      localStorage.removeItem('premeth_session_token');
    }
    router.push('/');
    router.refresh();
  }

  const linkCls = (href: string) =>
    `tx-color text-sm hover:text-meth ${
      pathname === href || pathname.startsWith(href + '/') ? 'text-meth' : 'text-ink-300'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800/80 backdrop-blur-md bg-ink-950/70">
      <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-7 w-7 grid place-items-center rounded-md bg-meth/15 border border-meth/30 transition-transform duration-200 ease-out-strong group-hover:scale-110">
            <span className="text-meth font-display font-bold text-sm leading-none">P</span>
          </div>
          <span className="font-display font-semibold text-paper tracking-tight">
            Premeth
          </span>
          {isPlus && (
            <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-meth/15 text-meth border border-meth/30 font-mono">
              <Sparkles className="h-2.5 w-2.5" /> +
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/exams"     className={linkCls('/exams')}>Exams</Link>
          {/* Premeth+ feature nav, only when subscribed */}
          {user && isPlus && (
            <>
              <Link href="/drill" className={linkCls('/drill')}>Drill</Link>
              <Link href="/vault" className={linkCls('/vault')}>Vault</Link>
              <Link href="/mock"  className={linkCls('/mock')}>Mock</Link>
            </>
          )}
          <Link href="/draw"      className={linkCls('/draw')}>Scratchpad</Link>
          <Link href="/about"     className={linkCls('/about')}>About</Link>
          {user ? (
            <Link href="/dashboard" className={linkCls('/dashboard')}>Dashboard</Link>
          ) : null}
          {!isPlus && (
            <Link href="/pricing" className={linkCls('/pricing')}>
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Premeth+
              </span>
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-ink-800 hover:border-ink-700 tx-color"
                aria-label="Profile"
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <UserIcon className="h-4 w-4 text-ink-300" />
                )}
                <span className="text-sm text-ink-200 max-w-[8rem] truncate">
                  {user.email}
                </span>
              </Link>
              <button
                onClick={signOut}
                className="press p-2 rounded-md border border-ink-800 hover:border-ink-700 tx-color"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm text-ink-300 hover:text-paper tx-color px-2 py-1">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="press text-sm px-3 py-1.5 rounded-md bg-meth text-ink-950 font-medium hover:bg-meth-300 tx-color"
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile sheet */}
      {menuOpen && (
        <div className="md:hidden border-t border-ink-800 bg-ink-950 px-5 py-4 space-y-3">
          <Link href="/exams"     onClick={() => setMenuOpen(false)} className="block py-1 text-paper">Exams</Link>
          {user && isPlus && (
            <>
              <Link href="/drill" onClick={() => setMenuOpen(false)} className="block py-1 text-paper">
                <Sparkles className="inline h-3 w-3 mr-1 text-meth" /> Daily Drill
              </Link>
              <Link href="/vault" onClick={() => setMenuOpen(false)} className="block py-1 text-paper">
                <Sparkles className="inline h-3 w-3 mr-1 text-meth" /> Mistake Vault
              </Link>
              <Link href="/mock" onClick={() => setMenuOpen(false)} className="block py-1 text-paper">
                <Sparkles className="inline h-3 w-3 mr-1 text-meth" /> Mock Exam
              </Link>
              <Link href="/goal" onClick={() => setMenuOpen(false)} className="block py-1 text-paper">
                <Sparkles className="inline h-3 w-3 mr-1 text-meth" /> Goal Tracker
              </Link>
            </>
          )}
          <Link href="/draw"      onClick={() => setMenuOpen(false)} className="block py-1 text-paper">Scratchpad</Link>
          <Link href="/about"     onClick={() => setMenuOpen(false)} className="block py-1 text-paper">About</Link>
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block py-1 text-paper">Dashboard</Link>
              <Link href="/profile"   onClick={() => setMenuOpen(false)} className="block py-1 text-paper">Profile</Link>
              {!isPlus && (
                <Link href="/pricing" onClick={() => setMenuOpen(false)} className="block py-1 text-meth">
                  Upgrade to Premeth+
                </Link>
              )}
              <button onClick={signOut} className="block py-1 text-crimson">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/pricing" onClick={() => setMenuOpen(false)} className="block py-1 text-meth">
                Premeth+
              </Link>
              <Link href="/login"  onClick={() => setMenuOpen(false)} className="block py-1 text-paper">Sign in</Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)} className="block py-1 text-meth">Create account</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
