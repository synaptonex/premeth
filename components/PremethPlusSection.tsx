'use client';

import Link from 'next/link';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const PLUS_FEATURES = [
  {
    n: '01',
    title: 'Adaptive Daily Drill',
    body:
      'Thirty MCQs every day, drawn from the topics you are weakest on. The drill recomposes as you improve.',
  },
  {
    n: '02',
    title: 'Mistake Vault',
    body:
      'Every wrong answer goes into a spaced-repetition queue. Review them on the schedule that resets each time you forget.',
  },
  {
    n: '03',
    title: 'Full mock exams',
    body:
      'Two hundred MCQs, two hundred minutes, official PMDC subject weightages. Per-subject breakdown when you finish.',
  },
  {
    n: '04',
    title: 'Goal tracker',
    body:
      'Set your exam date and a target accuracy. The app works out the daily pace you need to maintain.',
  },
  {
    n: '05',
    title: 'Study streaks',
    body:
      'A streak day is a day you hit your daily MCQ target. Miss a day and the streak resets. No competing with strangers.',
  },
  {
    n: '06',
    title: 'Wrong-answer notebook',
    body:
      'Export your Mistake Vault as a PDF organised by subject and topic. Print it, study it offline.',
  },
];

export default function PremethPlusSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from('.plus-row', {
        y: 10,
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: root.current,
          start: 'top 80%',
          once: true,
        },
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="border-t border-bone-rule bg-bone-50">
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-6 mb-16">
          <div className="hidden md:block col-span-1 marginalia pt-1">
            03 / Plus
          </div>
          <div className="col-span-12 md:col-span-11">
            <p className="marginalia mb-6">
              Premeth<span className="text-accent">+</span>
            </p>
            <h2 className="text-4xl md:text-5xl font-light tracking-tighter text-bone-900 max-w-3xl leading-[1.05]">
              For the candidate who wants the app to coach them, not just hold the papers.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 mb-16">
          <div className="hidden md:block col-span-1" />
          <div className="col-span-12 md:col-span-11">
            <ul className="border-t border-bone-rule">
              {PLUS_FEATURES.map((f) => (
                <li
                  key={f.n}
                  className="plus-row grid grid-cols-12 gap-4 py-7 border-b border-bone-rule"
                >
                  <span className="col-span-12 md:col-span-1 marginalia pt-1">
                    {f.n}
                  </span>
                  <h3 className="col-span-12 md:col-span-4 text-xl text-bone-900 font-medium leading-snug">
                    {f.title}
                  </h3>
                  <p className="col-span-12 md:col-span-7 text-bone-600 leading-relaxed">
                    {f.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="hidden md:block col-span-1" />
          <div className="col-span-12 md:col-span-11">
            <div className="border-t border-bone-rule pt-8 grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-7">
                <p className="marginalia mb-2">Founders pricing</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-light tracking-tighter text-bone-900 tabular-nums">
                    Rs 999
                  </span>
                  <span className="text-bone-500">/ 6 months</span>
                </div>
                <p className="mt-3 text-bone-600 max-w-md">
                  First 100 buyers. After that, Rs 1,499 / 6 months.
                  Pay via JazzCash or EasyPaisa.
                </p>
              </div>
              <div className="col-span-12 md:col-span-5 md:flex md:items-end md:justify-end">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                  <Link
                    href="/pricing"
                    className="press inline-flex items-center gap-2 text-base font-medium text-bone-900 border-b border-bone-900 pb-1 hover:gap-3 tx-color"
                    style={{ transition: 'gap 200ms var(--ease-out)' }}
                  >
                    See full breakdown
                    <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href="/redeem"
                    className="link-draw text-base text-bone-600 hover:text-bone-900 tx-color"
                  >
                    I have a code
                  </Link>
                </div>
              </div>
            </div>

            <p className="mt-12 text-sm text-bone-500 max-w-2xl">
              Free Premeth stays free. The 2,500 papers, the aggregate calculator,
              the syllabus guide and the dashboard cost nothing and require no
              account. Premeth<span className="text-accent">+</span> is additive.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
