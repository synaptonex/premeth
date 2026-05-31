'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useEnidPlus } from '@/lib/enid-plus.client';

type Item = { href: string; label: string };

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

  // Build each tab's items, honouring auth + Plus gating.
  const studyItems: Item[] = [
    { href: '/exams', label: 'Papers' },
    ...(user ? [{ href: '/drill', label: 'Daily Drill' }] : []),
    ...(user && isPlus
      ? [
          { href: '/vault', label: 'Mistake Vault' },
          { href: '/mock', label: 'Mock Exam' },
        ]
      : []),
  ];
  const communityItems: Item[] = [
    { href: '/forum', label: 'Forum' },
    { href: '/leaderboard', label: 'Leaderboard' },
  ];
  const moreItems: Item[] = [
    { href: '/aggregate', label: 'Aggregate Calculator' },
    { href: '/pathways', label: 'Pathways' },
    { href: '/about', label: 'About' },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const groupActive = (items: Item[]) => items.some((i) => isActive(i.href));
  const dashActive = isActive('/dashboard');

  return (
    <header
      className={`sticky top-0 z-50 tx-color ${
        scrolled ? 'glass border-b border-coal-rule' : 'border-b border-transparent bg-coal/40'
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

        <nav className="hidden md:flex items-center gap-2">
          <Dropdown label="Study" items={studyItems} active={groupActive(studyItems)} isActive={isActive} />
          <Dropdown label="Community" items={communityItems} active={groupActive(communityItems)} isActive={isActive} />
          <Dropdown label="More" items={moreItems} active={groupActive(moreItems)} isActive={isActive} />
          <Link
            href="/dashboard"
            className={`relative px-3 py-2 text-sm rounded-lg tx-color ${
              dashActive
                ? 'text-coal-900 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-aurora-line'
                : 'text-coal-500 hover:text-coal-900'
            }`}
          >
            Dashboard
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-5">
          {!isPlus && (
            <Link href="/pricing" className="text-sm text-coal-500 hover:text-coal-900 tx-color">
              Enid<span className="text-accent-bright">+</span>
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/profile"
                className="text-sm text-coal-500 hover:text-coal-900 tx-color truncate max-w-[9rem]"
              >
                {user.email}
              </Link>
              <button onClick={signOut} className="text-sm text-coal-500 hover:text-coal-900 tx-color">
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
        <div className="md:hidden glass border-t border-coal-rule px-6 py-6 space-y-6 animate-fade-up">
          <MobileGroup title="Study" items={studyItems} onNavigate={() => setMenuOpen(false)} />
          <MobileGroup title="Community" items={communityItems} onNavigate={() => setMenuOpen(false)} />
          <MobileGroup title="More" items={moreItems} onNavigate={() => setMenuOpen(false)} />
          <div className="space-y-3">
            <p className="marginalia">Account</p>
            <MobileLink href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MobileLink>
            {!isPlus && (
              <Link
                href="/pricing"
                onClick={() => setMenuOpen(false)}
                className="block text-base text-coal-900"
              >
                Enid<span className="text-accent-bright">+</span>
              </Link>
            )}
            {user ? (
              <>
                <MobileLink href="/profile" onClick={() => setMenuOpen(false)}>Profile</MobileLink>
                <button onClick={signOut} className="block text-base text-coal-600">Sign out</button>
              </>
            ) : (
              <>
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
        </div>
      )}
    </header>
  );
}

function Dropdown({
  label, items, active, isActive,
}: {
  label: string;
  items: Item[];
  active: boolean;
  isActive: (href: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div ref={ref} className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`relative inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg tx-color ${
          active
            ? 'text-coal-900 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-aurora-line'
            : 'text-coal-500 hover:text-coal-900'
        }`}
      >
        {label}
        <ChevronDown
          className="h-3.5 w-3.5"
          style={{ transition: 'transform 200ms var(--ease-out)', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute left-0 top-full mt-2 min-w-[12rem] rounded-xl glass p-1.5 shadow-card z-50 animate-fade-up"
        >
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm tx-color ${
                isActive(it.href)
                  ? 'bg-coal-100 text-accent-bright'
                  : 'text-coal-700 hover:bg-coal-100 hover:text-coal-900'
              }`}
            >
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileGroup({
  title, items, onNavigate,
}: {
  title: string;
  items: Item[];
  onNavigate: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="marginalia">{title}</p>
      {items.map((it) => (
        <MobileLink key={it.href} href={it.href} onClick={onNavigate}>{it.label}</MobileLink>
      ))}
    </div>
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
