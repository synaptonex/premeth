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
      'Sign up if you want to track attempts and weak topics. Skip it if you do not. Either way the papers are the same.',
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
      gsap.from('.feat-row', {
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
    <section
      ref={root}
      className="border-t border-bone-rule"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-6 mb-16">
          <div className="hidden md:block col-span-1 marginalia pt-1">
            02 / Free
          </div>
          <div className="col-span-12 md:col-span-11">
            <h2 className="text-4xl md:text-5xl font-light tracking-tighter text-bone-900 max-w-2xl">
              What is free, and stays free.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="hidden md:block col-span-1" />
          <div className="col-span-12 md:col-span-11">
            <ul className="border-t border-bone-rule">
              {FEATURES.map((f) => (
                <li
                  key={f.n}
                  className="feat-row grid grid-cols-12 gap-4 py-7 border-b border-bone-rule"
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
      </div>
    </section>
  );
}
