'use client';

import Link from 'next/link';
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const cta = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Entrance: a confident spring-in stagger, not a restrained fade.
      gsap.from('.hero-anim', {
        y: reduce ? 0 : 20,
        autoAlpha: 0,
        duration: reduce ? 0 : 0.7,
        stagger: reduce ? 0 : 0.08,
        ease: 'power3.out',
      });

      if (reduce) return;

      // Scroll-linked parallax on the aurora field.
      gsap.to(field.current, {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });

      // Magnetic primary CTA.
      const btn = cta.current;
      if (btn) {
        const onMove = (e: PointerEvent) => {
          const r = btn.getBoundingClientRect();
          gsap.to(btn, {
            x: (e.clientX - (r.left + r.width / 2)) * 0.25,
            y: (e.clientY - (r.top + r.height / 2)) * 0.35,
            duration: 0.4,
            ease: 'power3.out',
          });
        };
        const onLeave = () => gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
        btn.addEventListener('pointermove', onMove);
        btn.addEventListener('pointerleave', onLeave);
        return () => {
          btn.removeEventListener('pointermove', onMove);
          btn.removeEventListener('pointerleave', onLeave);
        };
      }
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative overflow-hidden">
      {/* Signature move: the drifting aurora mesh. */}
      <div ref={field} className="aurora-field aurora-animate" aria-hidden />

      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10 pt-20 pb-24 md:pt-28 md:pb-36">
        <div className="grid grid-cols-12 gap-6">
          <div className="hidden md:block col-span-1 marginalia pt-3">01 / Hero</div>

          <div className="col-span-12 md:col-span-11">
            <span className="hero-anim glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-coal-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-bright opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-bright" />
              </span>
              For MDCAT 2026 candidates
            </span>

            <h1 className="hero-anim mt-8 text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.95] text-coal-900 max-w-4xl">
              Practice 2,500+ papers,{' '}
              <span className="text-aurora">mocks, and drills.</span>
              <br />
              <span className="text-coal-500 font-light">No signup. No ads.</span>
            </h1>

            <p className="hero-anim mt-8 text-lg md:text-xl text-coal-600 max-w-xl leading-relaxed">
              Enid holds 280,000+ MCQs across every public MDCAT paper, mock, and drill since 2008.
              Practice any of them in the browser. Save your progress if you want to.
            </p>

            <div className="hero-anim mt-10 flex flex-wrap items-center gap-5">
              <Link
                ref={cta}
                href="/exams"
                className="press group relative inline-flex items-center gap-2 rounded-full bg-aurora-line bg-[length:200%_100%] px-7 py-3.5 text-base font-semibold text-white shadow-glow tx-color hover:shadow-glow-lg focus-visible:shadow-glow-lg"
              >
                Browse papers
                <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/signup"
                className="link-draw text-base text-coal-600 hover:text-coal-900 tx-color"
              >
                Create an account
              </Link>
            </div>

            {/* Stats as glowing glass cards. */}
            <div className="hero-anim mt-20">
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat n="2,500+" label="Papers and tests" />
                <Stat n="280,000+" label="MCQs" />
                <Stat n="31" label="Categories" />
                <Stat n="2008" label="Earliest year" />
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="glass tx-transform rounded-2xl p-5 hover:-translate-y-1">
      <div className="text-3xl md:text-4xl font-bold tracking-tight text-aurora tabular-nums">
        {n}
      </div>
      <div className="marginalia mt-2">{label}</div>
    </div>
  );
}
