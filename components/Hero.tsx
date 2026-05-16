'use client';

import Link from 'next/link';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // One restrained entrance. No staggered word reveal, no orb float.
      // The headline is content, not theatre.
      gsap.from('.hero-anim', {
        y: 8,
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power2.out',
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative">
      <div className="mx-auto max-w-6xl px-6 md:px-10 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="grid grid-cols-12 gap-6">
          {/* Marginalia: section index. The signature move. */}
          <div className="hidden md:block col-span-1 marginalia pt-2">
            01 / Hero
          </div>

          <div className="col-span-12 md:col-span-11">
            <p className="hero-anim marginalia mb-8">
              For MDCAT 2026 candidates
            </p>

            <h1 className="hero-anim text-5xl md:text-7xl lg:text-8xl font-light tracking-tighter leading-[0.95] text-coal-900 max-w-4xl">
              Practice 2,500 past papers.
              <br />
              <span className="text-coal-500">No signup. No ads.</span>
            </h1>

            <p className="hero-anim mt-8 text-lg text-coal-600 max-w-xl leading-relaxed">
              Premeth holds 400,000 MCQs from every public MDCAT paper since 2008.
              Practice any of them in the browser. Save your progress if you want to.
            </p>

            <div className="hero-anim mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
              <Link
                href="/exams"
                className="press inline-flex items-center gap-2 text-base font-medium text-coal-900 border-b border-coal-900 pb-1 hover:gap-3 tx-color"
                style={{ transition: 'gap 200ms var(--ease-out)' }}
              >
                Browse papers
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/signup"
                className="link-draw text-base text-coal-600 hover:text-coal-900 tx-color"
              >
                Create an account
              </Link>
            </div>

            {/* Hairline separator and stats. Numbers as composition elements. */}
            <div className="hero-anim mt-20 pt-8 border-t border-coal-rule">
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <Stat n="2,500" label="Past papers" />
                <Stat n="400,000" label="MCQs" />
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
    <div>
      <div className="text-3xl md:text-4xl font-light tracking-tighter text-coal-900 tabular-nums">
        {n}
      </div>
      <div className="marginalia mt-1">{label}</div>
    </div>
  );
}
