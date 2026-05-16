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
      gsap.from('.agg-teaser-anim', {
        y: 10,
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.06,
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
    <section ref={root} className="border-t border-coal-rule">
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-6">
          <div className="hidden md:block col-span-1 marginalia pt-1">
            04 / Merit
          </div>
          <div className="col-span-12 md:col-span-11">
            <p className="agg-teaser-anim marginalia mb-6">
              Aggregate calculator
            </p>
            <h2 className="agg-teaser-anim text-4xl md:text-5xl font-light tracking-tighter text-coal-900 max-w-2xl leading-[1.05]">
              Know your merit number before the merit list does.
            </h2>
            <p className="agg-teaser-anim mt-6 text-coal-600 leading-relaxed max-w-xl">
              Put in your MDCAT, FSc and Matric marks. It applies the weighting
              each board uses and gives you the aggregate they will. Runs in
              your browser. Nothing is stored.
            </p>
            <div className="agg-teaser-anim mt-8">
              <Link
                href="/aggregate"
                className="press inline-flex items-center gap-2 text-base font-medium text-coal-900 border-b border-coal-900 pb-1 hover:gap-3 tx-color"
                style={{ transition: 'gap 200ms var(--ease-out)' }}
              >
                Open the calculator
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
