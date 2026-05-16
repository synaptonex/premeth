'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const ROW_A = [
  'BIOLOGY — 81 MCQs',
  'CHEMISTRY — 45 MCQs',
  'PHYSICS — 36 MCQs',
  'ENGLISH — 9 MCQs',
  'LOGICAL REASONING — 9 MCQs',
  'PMDC 2026 SYLLABUS',
];

const ROW_B = [
  'UHS',  'NUMS', 'ETEA', 'AKU',  'FMDC', 'DUHS',
  'SZABMU', 'KMU', 'PMC',  'PMDC',
];

export default function Marquee() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Two rows scrolling in opposite directions, looped seamlessly via xPercent.
      // linear easing (per Emil rule: constant motion = linear).
      const rows = root.current?.querySelectorAll('.marquee-track') ?? [];
      rows.forEach((row, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        gsap.to(row, {
          xPercent: dir * 50,
          repeat: -1,
          duration: 36,
          ease: 'none',
        });
      });
    },
    { scope: root }
  );

  const Row = ({ items, big }: { items: string[]; big?: boolean }) => (
    <div className="overflow-hidden">
      <div className="marquee-track flex whitespace-nowrap">
        {[...items, ...items, ...items].map((s, i) => (
          <span
            key={i}
            className={`px-6 ${
              big ? 'font-display text-4xl md:text-6xl' : 'text-sm uppercase tracking-widest'
            } text-coal-900`}
          >
            {s}
            <span className="text-accent ml-6">⋆</span>
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <section ref={root} className="py-12 border-y border-coal-rule bg-coal space-y-6">
      <Row items={ROW_B} big />
      <Row items={ROW_A} />
    </section>
  );
}
