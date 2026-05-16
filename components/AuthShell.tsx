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
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.auth-title', { y: 18, autoAlpha: 0, duration: 0.5 })
        .from('.auth-sub',   { y: 10, autoAlpha: 0, duration: 0.4 }, '-=0.3')
        .from('.auth-form > *', { y: 8, autoAlpha: 0, duration: 0.35, stagger: 0.05 }, '-=0.2')
        .from('.auth-footer', { autoAlpha: 0, duration: 0.3 }, '-=0.1');

      // Slow ambient orb drift
      gsap.to('.auth-orb', { y: 24, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="min-h-screen grid lg:grid-cols-2">
      {/* Left: visual */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 bg-coal border-r border-coal-rule overflow-hidden">
        <div
          aria-hidden
          className="auth-orb absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(62,224,137,0.18) 0%, rgba(62,224,137,0) 70%)',
          }}
        />
        <div
          aria-hidden
          className="auth-orb absolute -bottom-40 -right-32 w-[36rem] h-[36rem] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(62,224,137,0.10) 0%, rgba(62,224,137,0) 70%)',
          }}
        />
        <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />

        <Link href="/" className="relative flex items-center gap-2">
          <div className="h-7 w-7 grid place-items-center rounded-md bg-accent/15 border border-accent/30">
            <span className="text-accent font-display font-bold text-sm leading-none">P</span>
          </div>
          <span className="font-display font-semibold text-coal-900">Enid</span>
        </Link>

        <div className="relative max-w-sm">
          <blockquote className="font-display text-2xl text-coal-900 leading-snug italic">
            &ldquo;Free, no signup needed to practice. Sign up only if you want
            to save your attempts, track weak topics, and never lose your place.&rdquo;
          </blockquote>
          <div className="mt-4 text-sm text-coal-600">— The Enid team</div>
        </div>

        <div className="relative text-xs text-coal-500">
          © {new Date().getFullYear()} Enid · Educational use only.
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-7 w-7 grid place-items-center rounded-md bg-accent/15 border border-accent/30">
              <span className="text-accent font-display font-bold text-sm leading-none">P</span>
            </div>
            <span className="font-display font-semibold text-coal-900">Enid</span>
          </Link>

          <h1 className="auth-title font-display text-3xl md:text-4xl text-coal-900 tracking-tight">
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
