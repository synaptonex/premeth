'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Mail, MessageCircle, ArrowRight } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function AboutPage() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.about-eyebrow', { y: 12, autoAlpha: 0, duration: 0.4 })
        .from('.about-title', { y: 24, autoAlpha: 0, duration: 0.6 }, '-=0.2')
        .from('.about-body p', { y: 12, autoAlpha: 0, duration: 0.45, stagger: 0.06 }, '-=0.3')
        .from('.about-section', { y: 16, autoAlpha: 0, duration: 0.45, stagger: 0.1 }, '-=0.2');
    },
    { scope: root }
  );

  return (
    <>
      <Navbar />
      <main ref={root}>
        {/* ---- Intro ---------------------------------------------------- */}
        <section className="border-t border-coal-rule">
          <div className="mx-auto max-w-6xl px-6 md:px-10 py-24 md:py-32">
            <div className="grid grid-cols-12 gap-6">
              <div className="hidden md:block col-span-1 marginalia pt-2">
                01 / About
              </div>
              <div className="col-span-12 md:col-span-11">
                <span className="about-eyebrow text-xs uppercase tracking-widest text-accent">
                  About Enid
                </span>
                <h1 className="about-title text-4xl md:text-6xl font-light tracking-tighter text-coal-900 max-w-3xl leading-[1.05] mt-3">
                  Built by students,
                  <br />
                  <span className="text-coal-500">
                    for the students coming next.
                  </span>
                </h1>

                <div className="about-body mt-10 space-y-5 text-coal-700 leading-relaxed text-lg max-w-2xl">
                  <p>
                    Enid began as a pile of data: thousands of past papers,
                    typed up and sorted into JSON so someone could actually
                    build with them. The first site to use that data was{' '}
                    <a
                      href="https://premeth.com"
                      className="text-accent hover:underline"
                    >
                      premeth.com
                    </a>
                    .
                  </p>
                  <p>
                    This is the second version. Same papers, same rule.
                    Practice is free and nothing hides behind a login. We
                    rebuilt it as one place for medical students to prepare,
                    whether they are sitting a local entry test or a licensing
                    exam abroad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- The first version --------------------------------------- */}
        <section className="about-section border-t border-coal-rule">
          <div className="mx-auto max-w-6xl px-6 md:px-10 py-20">
            <div className="grid grid-cols-12 gap-6">
              <div className="hidden md:block col-span-1 marginalia pt-2">
                02 / Origins
              </div>
              <div className="col-span-12 md:col-span-11">
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-coal-900">
                  Where it began
                </h2>
                <div className="mt-5 space-y-4 text-coal-700 leading-relaxed max-w-2xl">
                  <p>
                    The first version of premeth.com was made by{' '}
                    <span className="text-coal-900 font-medium">
                      Zain Ikhlaq
                    </span>
                    . He gave past-paper practice a clean, free home back when
                    there wasn&apos;t a good single place to find one. We are
                    standing on what he built, and starting it was his idea.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- The team behind v2 -------------------------------------- */}
        <section className="about-section border-t border-coal-rule">
          <div className="mx-auto max-w-6xl px-6 md:px-10 py-20">
            <div className="grid grid-cols-12 gap-6">
              <div className="hidden md:block col-span-1 marginalia pt-2">
                03 / The team
              </div>
              <div className="col-span-12 md:col-span-11">
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-coal-900">
                  Who took it forward
                </h2>

                <figure className="mt-8 max-w-2xl">
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

                <div className="mt-8 space-y-4 text-coal-700 leading-relaxed max-w-2xl">
                  <p>
                    Version 2 onwards is the work of{' '}
                    <span className="text-coal-900 font-medium">
                      Dr. Shahbaz Waseem Gul
                    </span>{' '}
                    and{' '}
                    <span className="text-coal-900 font-medium">
                      Dr. Sharjeel Waseem Gul
                    </span>
                    . We are brothers, and both US-IMGs. We were born in
                    Canada, grew up in Oxford, Mississippi, and went through
                    American schools before starting a BS in Pharmaceutical
                    Sciences.
                  </p>
                  <p>
                    In 2021 we both moved to Abbottabad to do our MBBS. Going
                    between the two systems shows you how differently students
                    are trained on each side, and that gap is most of why we
                    care about getting this right.
                  </p>
                  <p>
                    So we took what Zain started and built it out for the
                    students coming after us. One place, the same papers and
                    the same standard, whether you are studying here or
                    overseas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- A living dataset ---------------------------------------- */}
        <section className="about-section border-t border-coal-rule">
          <div className="mx-auto max-w-6xl px-6 md:px-10 py-20">
            <div className="grid grid-cols-12 gap-6">
              <div className="hidden md:block col-span-1 marginalia pt-2">
                04 / Upkeep
              </div>
              <div className="col-span-12 md:col-span-11">
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-coal-900">
                  A question bank that keeps improving
                </h2>
                <div className="mt-5 space-y-4 text-coal-700 leading-relaxed max-w-2xl">
                  <p>
                    Past papers are messy. Whoever typed them up made
                    mistakes, and whoever wrote the answer key sometimes got it
                    wrong. So Enid is never really finished. We keep working
                    on it.
                  </p>
                  <p>
                    We check questions, fix the ones that are wrong, and add
                    new papers as they come out. If you catch a mistake while
                    practicing, flag it. The next student to open that question
                    might find it already corrected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Links --------------------------------------------------- */}
        <section className="about-section border-t border-coal-rule">
          <div className="mx-auto max-w-6xl px-6 md:px-10 py-20">
            <div className="grid grid-cols-12 gap-6">
              <div className="hidden md:block col-span-1 marginalia pt-2">
                05 / Contact
              </div>
              <div className="col-span-12 md:col-span-11">
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-coal-900">
                  Get in touch
                </h2>
                <p className="mt-3 text-coal-600 leading-relaxed max-w-xl">
                  Found a wrong answer, want to suggest a paper, or just have a
                  question? Reach us directly. We read everything.
                </p>

                <div className="mt-8 rounded-xl border border-coal-rule bg-coal-50 p-6 md:p-8 max-w-xl">
                  <a
                    href="mailto:syncrasy26@gmail.com"
                    className="group flex items-center gap-4 py-3"
                  >
                    <div className="inline-grid place-items-center h-11 w-11 rounded-lg bg-accent/10 border border-accent/20 text-accent shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="marginalia">Email</div>
                      <div className="text-coal-900 group-hover:text-accent tx-color truncate">
                        syncrasy26@gmail.com
                      </div>
                    </div>
                  </a>

                  <div className="border-t border-coal-rule my-1" />

                  <a
                    href="https://wa.me/923345121203"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 py-3"
                  >
                    <div className="inline-grid place-items-center h-11 w-11 rounded-lg bg-accent/10 border border-accent/20 text-accent shrink-0">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="marginalia">WhatsApp</div>
                      <div className="text-coal-900 group-hover:text-accent tx-color">
                        +92 334 5121203
                      </div>
                    </div>
                  </a>
                </div>

                <div className="mt-10">
                  <h2 className="text-2xl md:text-4xl font-light tracking-tighter text-coal-900 leading-[1.1]">
                    Pick a paper. Hit start.
                  </h2>
                  <div className="mt-6">
                    <Link
                      href="/exams"
                      className="press inline-flex items-center gap-2 text-base font-medium text-coal-900 border-b border-coal-900 pb-1 hover:gap-3 tx-color"
                      style={{ transition: 'gap 200ms var(--ease-out)' }}
                    >
                      Browse the catalog
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
