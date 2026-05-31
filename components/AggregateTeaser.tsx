'use client';

import Link from 'next/link';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function AggregateTeaser() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      gsap.from('.agg-teaser-anim', {
        y: reduce ? 0 : 14,
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
    <section ref={root} className="border-t border-coal-rule">
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-6">
          <div className="hidden md:block col-span-1 marginalia pt-1">05 / Merit</div>
          <div className="col-span-12 md:col-span-11">
            <div className="relative overflow-hidden rounded-3xl glass p-8 md:p-12">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl"
                aria-hidden
              />
              <div className="relative">
                <p className="agg-teaser-anim marginalia mb-6">Aggregate calculator</p>
                <h2 className="agg-teaser-anim text-4xl md:text-5xl font-bold tracking-tight text-coal-900 max-w-2xl leading-[1.05]">
                  Know your merit number <span className="text-aurora">before the merit list does.</span>
                </h2>
                <p className="agg-teaser-anim mt-6 text-coal-600 leading-relaxed max-w-xl">
                  Put in your MDCAT, FSc and Matric marks. It applies the weighting each board
                  uses and gives you the aggregate they will. Runs in your browser. Nothing is
                  stored.
                </p>
                <div className="agg-teaser-anim mt-8">
                  <Link
                    href="/aggregate"
                    className="press group inline-flex items-center gap-2 rounded-full bg-aurora-line px-6 py-3 text-base font-semibold text-white shadow-glow tx-color hover:shadow-glow-lg"
                  >
                    Open the calculator
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
