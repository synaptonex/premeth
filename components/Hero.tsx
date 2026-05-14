'use client';

import Link from 'next/link';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Sparkles } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Hero entrance: stagger headline words, then subtitle, then CTAs.
      // Custom strong ease-out (Emil's curve) — keeps the entrance feeling
      // intentional, not generic. Duration kept under the Emil 300ms rule for
      // anything UI; the headline is one-time so it can breathe a bit more.

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-eyebrow', { y: 12, autoAlpha: 0, duration: 0.5 })
        .from(
          '.hero-word',
          { y: 40, autoAlpha: 0, duration: 0.8, stagger: 0.08 },
          '-=0.2'
        )
        .from(
          '.hero-tagline',
          { y: 16, autoAlpha: 0, duration: 0.5 },
          '-=0.4'
        )
        .from(
          '.hero-cta > *',
          { y: 12, autoAlpha: 0, duration: 0.4, stagger: 0.08 },
          '-=0.2'
        )
        .from(
          '.hero-stat',
          { y: 12, autoAlpha: 0, duration: 0.4, stagger: 0.06 },
          '-=0.2'
        );

      // Subtle float on the green orb backdrop, never auto-playing once user scrolls past
      gsap.to('.orb', {
        y: 22,
        duration: 6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      // Scroll-driven parallax on the grid pattern (very subtle — Emil rule:
      // background motion should never compete with the foreground).
      gsap.to('.hero-grid', {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      className="relative overflow-hidden border-b border-ink-800"
    >
      {/* Background layers */}
      <div className="hero-grid absolute inset-0 bg-grid pointer-events-none opacity-60" />
      <div
        aria-hidden
        className="orb absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(62,224,137,0.18) 0%, rgba(62,224,137,0) 70%)',
        }}
      />
      <div
        aria-hidden
        className="orb absolute -bottom-40 -left-32 w-[32rem] h-[32rem] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(62,224,137,0.10) 0%, rgba(62,224,137,0) 70%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 pt-24 pb-28 md:pt-32 md:pb-36">
        <div className="hero-eyebrow inline-flex items-center gap-2 px-3 py-1 rounded-full border border-meth/30 bg-meth/5 mb-6">
          <Sparkles className="h-3.5 w-3.5 text-meth" />
          <span className="text-xs tracking-wide text-meth-200">
            Now with accounts, diagrams &amp; question reporting
          </span>
        </div>

        <h1 className="font-display text-[clamp(2.75rem,8vw,6rem)] leading-[0.95] tracking-tight text-paper">
          <span className="hero-word inline-block">Ensuring</span>{' '}
          <span className="hero-word inline-block">premed</span>{' '}
          <span className="hero-word inline-block">students</span>
          <br />
          <span className="hero-word inline-block">always</span>{' '}
          <span className="hero-word inline-block">stay</span>{' '}
          <span className="hero-word inline-block text-meth italic" style={{ fontStyle: 'italic' }}>
            premeth.
          </span>
        </h1>

        <p className="hero-tagline mt-7 max-w-xl text-ink-300 text-lg leading-relaxed">
          400,000+ MCQs from 2,500+ past papers, mapped to the PMDC 2026 syllabus.
          Free, no ads, no upsells. Practice without distractions.
        </p>

        <div className="hero-cta mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/exams"
            className="press group inline-flex items-center gap-2 rounded-md bg-meth text-ink-950 px-5 py-3 font-medium hover:bg-meth-300 tx-color"
          >
            Start cooking
            <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/signup"
            className="press inline-flex items-center rounded-md border border-ink-700 text-paper px-5 py-3 hover:border-meth/50 hover:text-meth tx-color"
          >
            Create an account
          </Link>
        </div>

        {/* Stats strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-ink-800 pt-8">
          {[
            { n: '400K+', l: 'MCQs indexed' },
            { n: '2,500+', l: 'Past papers' },
            { n: '31',     l: 'Categories' },
            { n: '64',     l: 'PMDC chapters' },
          ].map((s) => (
            <div key={s.l} className="hero-stat">
              <div className="font-display text-3xl text-paper">{s.n}</div>
              <div className="text-xs uppercase tracking-wider text-ink-500 mt-1">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
