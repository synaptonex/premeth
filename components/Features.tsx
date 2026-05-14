'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookOpenText, Flag, PencilRuler, ShieldCheck, Timer, BarChart3 } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FEATURES = [
  {
    icon: BookOpenText,
    title: 'Diagram-aware questions',
    body: 'Physics and Bio questions now render their figures inline. No more half-questions where the diagram lived "in the original paper somewhere."',
  },
  {
    icon: Flag,
    title: 'Report broken MCQs',
    body: 'See a wrong answer or a typo? Flag it in two clicks. Reports go to the maintainers and the next reader sees a fixed question.',
  },
  {
    icon: PencilRuler,
    title: 'Scratchpad',
    body: 'Sketch free-body diagrams, organic structures, or working out — right next to the question. No paper, no tab-switching.',
  },
  {
    icon: Timer,
    title: 'Timed mock mode',
    body: 'Practice under exam pressure. 3-hour MDCAT-style sessions with a live countdown and end-of-test review.',
  },
  {
    icon: BarChart3,
    title: 'Track your weak topics',
    body: 'Every attempt is logged. Your dashboard shows which chapters keep tripping you up, so you stop guessing what to revise.',
  },
  {
    icon: ShieldCheck,
    title: 'Still free, still no ads',
    body: 'No paywalls. No "premium tier". No "limited free trial". Just the data, organized so you can actually use it.',
  },
];

export default function Features() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Stagger reveal on scroll. Cards come up from below, gentle ease-out.
      // Each card animates once, then stays put.
      gsap.from('.feature-card', {
        scrollTrigger: {
          trigger: root.current,
          start: 'top 80%',
        },
        y: 28,
        autoAlpha: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
      });

      // Section header — line draw across the eyebrow
      gsap.from('.feature-eyebrow-line', {
        scrollTrigger: {
          trigger: root.current,
          start: 'top 85%',
        },
        scaleX: 0,
        transformOrigin: 'left',
        duration: 0.7,
        ease: 'power3.out',
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative mx-auto max-w-6xl px-5 py-24">
      <div className="flex items-center gap-3 mb-3">
        <div className="feature-eyebrow-line h-px w-12 bg-meth" />
        <span className="text-xs uppercase tracking-widest text-meth">
          What's new
        </span>
      </div>
      <h2 className="font-display text-4xl md:text-5xl text-paper tracking-tight max-w-2xl">
        Three things students asked for. We built all three.
      </h2>
      <p className="mt-3 text-ink-400 max-w-xl">
        Premeth v2 keeps everything that worked, and fixes the things that
        didn't. Accounts are optional — practice still works without one.
      </p>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="feature-card hover-lift relative p-6 rounded-xl border border-ink-800 bg-ink-900/40 hover:border-meth/30 tx-color"
            style={{ transition: 'border-color 200ms var(--ease-out), transform 200ms var(--ease-out)' }}
          >
            <div className="inline-grid place-items-center h-10 w-10 rounded-lg bg-meth/10 border border-meth/20 text-meth mb-4">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xl text-paper mb-1.5">{f.title}</h3>
            <p className="text-ink-400 text-sm leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
