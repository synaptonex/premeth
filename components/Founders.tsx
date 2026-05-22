'use client';

import Link from 'next/link';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Founders() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from('.founders-anim', {
        y: 12,
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.07,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: root.current,
          start: 'top 78%',
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
            02 / Who
          </div>

          <div className="col-span-12 md:col-span-11">
            <p className="founders-anim marginalia mb-6">
              Who built this
            </p>

            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
              {/* The two portraits, side by side. They stack on phones and
                  sit beside each other from sm: up. */}
              <figure className="founders-anim">
                <div className="grid grid-cols-2 gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/founder-pinstripe.jpg"
                    alt="Dr. Shahbaz Waseem Gul."
                    className="w-full aspect-[3/4] object-cover rounded-xl border border-coal-rule bg-coal-50"
                    loading="lazy"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/founder-suit.jpg"
                    alt="Dr. Sharjeel Waseem Gul."
                    className="w-full aspect-[3/4] object-cover rounded-xl border border-coal-rule bg-coal-50"
                    loading="lazy"
                  />
                </div>
                <figcaption className="mt-3 text-sm text-coal-500">
                  Dr. Shahbaz Waseem Gul (left) and Dr. Sharjeel Waseem Gul
                  (right).
                </figcaption>
              </figure>

              {/* The story, stated as why the product exists */}
              <div>
                <h2 className="founders-anim text-3xl md:text-4xl font-light tracking-tighter text-coal-900 leading-[1.1]">
                  Two brothers who went the long way round.
                </h2>

                <div className="founders-anim mt-6 space-y-4 text-coal-700 leading-relaxed">
                  <p>
                    We are Shahbaz and Sharjeel, brothers and both doctors. We
                    were born in Canada, grew up in Oxford, Mississippi, and
                    went through American schools before starting a BS in
                    Pharmaceutical Sciences.
                  </p>
                  <p>
                    In 2021 we both came to Abbottabad for our MBBS. So we
                    have been students inside the American system and the
                    Pakistani one. Not many people have, and that is really
                    why Enid exists.
                  </p>
                  <p>
                    Most MDCAT tools are built for one exam and stop there.
                    We are building Enid for the student who is also asking
                    what happens after it, because we asked that ourselves
                    and had to work the answer out the hard way.
                  </p>
                </div>

                <div className="founders-anim mt-7 flex flex-wrap items-center gap-x-8 gap-y-3">
                  <Link
                    href="/pathways"
                    className="press inline-flex items-center gap-2 text-base font-medium text-coal-900 border-b border-coal-900 pb-1 hover:gap-3 tx-color"
                    style={{ transition: 'gap 200ms var(--ease-out)' }}
                  >
                    See where MDCAT can take you
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/about"
                    className="link-draw text-base text-coal-600 hover:text-coal-900 tx-color"
                  >
                    Read our story
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
