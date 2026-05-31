'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FEATURES = [
  {
    n: '01',
    title: 'Every paper, free',
    body:
      'NUMS, AKU, ETEA, PMC, Punjab MDCAT, Sindh MDCAT and the rest. The full archive is open. No paper sits behind a paywall.',
  },
  {
    n: '02',
    title: 'Practice in the browser',
    body:
      'One MCQ per screen, keyboard shortcuts, instant feedback after each answer. Works on a phone, works offline once loaded.',
  },
  {
    n: '03',
    title: 'Diagrams and explanations',
    body:
      'Most questions ship with the original diagram and a written answer key. Where we can, we show working, not just the letter.',
  },
  {
    n: '04',
    title: 'Optional account',
    body:
      'Sign up if you want to track attempts and weak topics. Skip it if you\'d rather not. The papers are the same either way.',
  },
  {
    n: '05',
    title: 'Aggregate calculator',
    body:
      'Punch in your FSc and MDCAT scores and see what each university would actually count. Handles the formula differences between boards.',
  },
  {
    n: '06',
    title: 'Built by students',
    body:
      'No ad network, no investor pressure, no LMS bloat. The product changes when students who use it tell us what is missing.',
  },
];

export default function Features() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      gsap.from('.feat-card', {
        y: reduce ? 0 : 24,
        autoAlpha: 0,
        duration: reduce ? 0 : 0.6,
        stagger: reduce ? 0 : 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 78%', once: true },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative border-t border-coal-rule">
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-6 mb-14">
          <div className="hidden md:block col-span-1 marginalia pt-2">03 / Free</div>
          <div className="col-span-12 md:col-span-11">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-coal-900 max-w-2xl">
              What is free, and <span className="text-aurora">stays free.</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <article
              key={f.n}
              className="feat-card group relative overflow-hidden rounded-2xl glass p-6 tx-transform hover:-translate-y-1.5 hover:shadow-card-hover"
            >
              {/* Per-card glow that blooms on hover. */}
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/20 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
              />
              <div className="relative">
                <span className="text-2xl font-bold tracking-tight text-aurora tabular-nums">
                  {f.n}
                </span>
                <h3 className="mt-4 text-xl font-semibold leading-snug text-coal-900">
                  {f.title}
                </h3>
                <p className="mt-3 text-coal-600 leading-relaxed">{f.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
