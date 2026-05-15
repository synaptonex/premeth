'use client';

/**
 * Premeth+ section for the homepage.
 *
 * Drop this in app/page.tsx wherever you want the upsell to appear —
 * I'd suggest placing it AFTER the existing <Features /> component and
 * BEFORE the final CTA strip, since by then the visitor has seen the
 * free offering and is primed to learn what the paid tier adds.
 *
 * The component is intentionally separate from <Features /> because the
 * brand commitment is "Premeth stays free forever." This section needs
 * to be visually distinct so a casual scroller can't confuse the paid
 * tier with the free product.
 */

import Link from 'next/link';
import { useRef } from 'react';
import {
  Sparkles, Zap, AlertOctagon, Timer, Flame, FileDown, Target, ArrowRight,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FEATURES = [
  {
    icon: Zap,
    title: 'Adaptive Daily Drill',
    description: '30 MCQs every day, hand-picked from your weakest topics. Gets harder as you improve.',
  },
  {
    icon: AlertOctagon,
    title: 'Mistake Vault',
    description: 'Every wrong answer goes into a spaced-repetition queue. Review them just before you forget.',
  },
  {
    icon: Timer,
    title: 'Full MDCAT Mock Exams',
    description: '180 MCQs, 180 minutes, exact PMDC subject quotas. Practice the test, not just the syllabus.',
  },
  {
    icon: Target,
    title: 'Goal Tracker',
    description: 'Set your exam date and target. We work out the daily pace you actually need to hit.',
  },
  {
    icon: Flame,
    title: 'Study Streaks',
    description: 'Hit your daily MCQ target to keep your streak alive. Compete with yourself, not strangers.',
  },
  {
    icon: FileDown,
    title: 'Export to PDF',
    description: 'Print your mistake vault as a clean wrong-answer notebook for offline revision.',
  },
];

export default function PremethPlusSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from('.plus-card', {
        y: 24,
        autoAlpha: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: root.current,
          start: 'top 75%',
          once: true,
        },
      });
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      className="relative mx-auto max-w-6xl px-5 py-20 border-t border-ink-800"
    >
      {/* Subtle background glow so this section feels different from Features */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] bg-meth/[0.04] blur-3xl rounded-full" />
      </div>

      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs uppercase tracking-wider bg-meth/15 text-meth border border-meth/30 mb-4">
          <Sparkles className="h-3 w-3" /> Premeth+
        </div>
        <h2 className="font-display text-4xl md:text-5xl text-paper tracking-tight">
          The free product is already excellent.
        </h2>
        <p className="text-ink-300 mt-3 text-lg">
          Premeth+ is for the student who wants more than papers — who wants the
          app to <em>actively coach them</em>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {FEATURES.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.title}
              className="plus-card rounded-xl border border-ink-800 bg-ink-900/40 p-5 hover:border-meth/40 tx-color"
            >
              <div className="inline-flex p-2 rounded-md bg-meth/10 border border-meth/30 mb-3">
                <Icon className="h-4 w-4 text-meth" />
              </div>
              <h3 className="font-display text-lg text-paper mb-1">
                {feat.title}
              </h3>
              <p className="text-sm text-ink-400 leading-relaxed">
                {feat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Pricing strip */}
      <div className="rounded-2xl border border-meth/30 bg-gradient-to-br from-meth/[0.06] to-transparent p-8 md:p-10 text-center">
        <div className="flex flex-wrap items-baseline justify-center gap-2 mb-2">
          <span className="font-display text-5xl text-paper tracking-tight">
            Rs 999
          </span>
          <span className="text-ink-400">/ 6 months</span>
          <span className="text-xs uppercase tracking-wider text-meth bg-meth/15 border border-meth/30 px-2 py-0.5 rounded-full ml-2">
            Founders price
          </span>
        </div>
        <p className="text-ink-400 text-sm mb-6">
          First 100 buyers only. Regular price Rs 1,499 / 6 months.
          Pay via JazzCash or EasyPaisa.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/pricing"
            className="press inline-flex items-center gap-2 rounded-md bg-meth text-ink-950 px-5 py-2.5 font-medium hover:bg-meth-300 tx-color"
          >
            See full breakdown <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/redeem"
            className="press inline-flex items-center gap-2 rounded-md border border-ink-700 text-ink-200 px-5 py-2.5 font-medium hover:border-meth/40 hover:text-meth tx-color"
          >
            I have a code
          </Link>
        </div>
      </div>

      <p className="text-center text-xs text-ink-500 mt-8 max-w-xl mx-auto">
        Free Premeth stays free forever. All 2,500+ papers, the aggregate calculator,
        syllabus guide, and dashboard — yours at no cost, no signup needed.
        Premeth+ is purely additive.
      </p>
    </section>
  );
}
