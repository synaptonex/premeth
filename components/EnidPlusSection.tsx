'use client';

import Link from 'next/link';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const PLUS_FEATURES = [
  { n: '01', title: 'Unlimited Daily Drills', body: 'Thirty MCQs pulled from whatever you are worst at right now, and it shifts as you improve. Free accounts get one a day. Plus removes the limit.' },
  { n: '02', title: 'Mistake Vault', body: 'Every wrong answer goes into a spaced-repetition queue. Review them on the schedule that resets each time you forget.' },
  { n: '03', title: 'Full mock exams', body: 'Two hundred MCQs, two hundred minutes, official PMDC subject weightages. Per-subject breakdown when you finish.' },
  { n: '04', title: 'Goal tracker', body: 'Set your exam date and a target accuracy. The app works out the daily pace you need to maintain.' },
  { n: '05', title: 'Everything stays unlocked', body: 'One subscription covers the drill, the vault, mocks and the goal tracker for six months. Streaks stay free for everyone.' },
  { n: '06', title: 'Wrong-answer notebook', body: 'Export your Mistake Vault as a PDF organised by subject and topic. Print it, study it offline.' },
];

export default function EnidPlusSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      gsap.from('.plus-card', {
        y: reduce ? 0 : 22,
        autoAlpha: 0,
        duration: reduce ? 0 : 0.6,
        stagger: reduce ? 0 : 0.07,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 80%', once: true },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative border-t border-coal-rule bg-coal-50 overflow-hidden">
      <div className="aurora-field aurora-animate opacity-60" aria-hidden />
      <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-6 mb-14">
          <div className="hidden md:block col-span-1 marginalia pt-1">04 / Plus</div>
          <div className="col-span-12 md:col-span-11">
            <p className="marginalia mb-6">Enid<span className="text-accent-bright">+</span></p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-coal-900 max-w-3xl leading-[1.05]">
              The papers, plus an app that <span className="text-aurora">actually pushes you to study.</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {PLUS_FEATURES.map((f) => (
            <article
              key={f.n}
              className="plus-card group relative overflow-hidden rounded-2xl glass p-6 tx-transform hover:-translate-y-1.5 hover:shadow-card-hover"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/20 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
              <div className="relative">
                <span className="text-2xl font-bold tracking-tight text-aurora tabular-nums">{f.n}</span>
                <h3 className="mt-4 text-xl font-semibold leading-snug text-coal-900">{f.title}</h3>
                <p className="mt-3 text-coal-600 leading-relaxed">{f.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="plus-card relative overflow-hidden rounded-3xl glass p-8 md:p-10">
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-aurora-3/20 blur-3xl" aria-hidden />
          <div className="relative grid grid-cols-12 gap-6 items-end">
            <div className="col-span-12 md:col-span-7">
              <p className="marginalia mb-2">Founders pricing</p>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl md:text-6xl font-extrabold tracking-tight text-aurora tabular-nums">Rs 999</span>
                <span className="text-coal-500">/ 6 months</span>
              </div>
              <p className="mt-3 text-coal-600 max-w-md">
                First 100 buyers. After that, Rs 1,499 / 6 months. Pay via JazzCash or EasyPaisa.
              </p>
            </div>
            <div className="col-span-12 md:col-span-5 md:flex md:justify-end">
              <Link
                href="/pricing"
                className="press group inline-flex items-center gap-2 rounded-full bg-aurora-line px-6 py-3 text-base font-semibold text-white shadow-glow tx-color hover:shadow-glow-lg"
              >
                See full breakdown
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-10 text-sm text-coal-500 max-w-2xl">
          Free Enid stays free. The 2,500+ papers, mocks, drills, the aggregate calculator, the
          syllabus guide and the dashboard cost nothing and require no account.
          Enid<span className="text-accent-bright">+</span> is additive.
        </p>
      </div>
    </section>
  );
}
