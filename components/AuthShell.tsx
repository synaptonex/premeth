'use client';

import Link from 'next/link';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function AuthShell({ title, subtitle, children, footer }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.auth-title', { y: 18, autoAlpha: 0, duration: 0.5 })
        .from('.auth-sub', { y: 10, autoAlpha: 0, duration: 0.4 }, '-=0.3')
        .from('.auth-form > *', { y: 8, autoAlpha: 0, duration: 0.35, stagger: 0.05 }, '-=0.2')
        .from('.auth-footer', { autoAlpha: 0, duration: 0.3 }, '-=0.1');
    },
    { scope: root }
  );

  const Brand = () => (
    <span className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-aurora-line text-white font-display font-bold text-sm leading-none shadow-glow">
        E
      </span>
      <span className="font-display font-bold tracking-tight text-coal-900">Enid</span>
    </span>
  );

  return (
    <div ref={root} className="min-h-screen grid lg:grid-cols-2">
      {/* Left: aurora visual panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 border-r border-coal-rule overflow-hidden">
        <div className="aurora-field aurora-animate" aria-hidden />
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" aria-hidden />

        <Link href="/" className="relative z-10"><Brand /></Link>

        <div className="relative z-10 max-w-sm">
          <blockquote className="font-display text-2xl md:text-3xl text-coal-900 leading-snug font-light">
            Free, no signup needed to practice. Sign up only if you want to{' '}
            <span className="text-aurora font-normal">save your attempts, track weak topics, and never lose your place.</span>
          </blockquote>
          <div className="mt-4 text-sm text-coal-600">The Enid team</div>
        </div>

        <div className="relative z-10 text-xs text-coal-500">
          © {new Date().getFullYear()} Enid · Educational use only.
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden mb-8 inline-block"><Brand /></Link>

          <h1 className="auth-title font-display text-3xl md:text-4xl font-bold text-coal-900 tracking-tight">
            {title}
          </h1>
          {subtitle && <p className="auth-sub mt-2 text-coal-600 text-sm">{subtitle}</p>}

          <div className="auth-form mt-7 space-y-4">{children}</div>

          {footer && <div className="auth-footer mt-6 text-sm text-coal-600">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
