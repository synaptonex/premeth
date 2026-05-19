'use client';

/**
 * "After MDCAT" pathways page.
 *
 * The honest differentiator made into a real surface: guidance for the
 * student thinking past the entry test, written from the founders' actual
 * IMG experience. The four pathway blurbs below are general framing. The
 * spots marked {/* FOUNDER NOTE *‍/} are where Shahbaz and Sharjeel's
 * specific, lived detail should go: timelines, costs, the hard-won stuff.
 */

import { useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Compass } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface Pathway {
  code: string;
  name: string;
  region: string;
  summary: string;
}

const PATHWAYS: Pathway[] = [
  {
    code: 'USMLE',
    name: 'The United States',
    region: 'USA',
    summary:
      'Start in third year. Aim to sit Step 1 at the end of fourth year, pick Step 2 back up when final year begins, and sit it after final year or just before house job. It costs more than any other route. The doors it opens are worth that.',
  },
  {
    code: 'AMC',
    name: 'Australia',
    region: 'AU',
    summary:
      'You start after MBBS. It is expensive, and right now the exam is brutal, only twenty to thirty out of a hundred pass. But if you get through, it is one of the strongest routes an MBBS graduate has.',
  },
  {
    code: 'PLAB / MRCP',
    name: 'The United Kingdom',
    region: 'UK',
    summary:
      'Everyone walked this road, and it has nearly dried up. Pick it if you have family or contacts in the UK. A Pakistani MBBS already lines up closely with UK training, and this is one of the cheaper paths to fund.',
  },
  {
    code: 'Middle East',
    name: 'The Gulf',
    region: 'ME',
    summary:
      'This one comes later, usually after FCPS and a few years of work. It is the cheapest of the four. Most doctors save quietly through their postgraduate years, sit the exams, and step straight into a senior post in the Gulf.',
  },
];

export default function PathwaysPage() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('.pw-anim', {
        y: 12,
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power2.out',
      });
      gsap.from('.pw-card', {
        y: 16,
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.pw-grid', start: 'top 80%', once: true },
      });
    },
    { scope: root }
  );

  return (
    <>
      <Navbar />
      <main ref={root}>
        {/* ── Intro ──────────────────────────────────────────────────── */}
        <section className="border-t border-coal-rule">
          <div className="mx-auto max-w-6xl px-6 md:px-10 py-20 md:py-28">
            <div className="grid grid-cols-12 gap-6">
              <div className="hidden md:block col-span-1 marginalia pt-2">
                01 / Pathways
              </div>
              <div className="col-span-12 md:col-span-11">
                <span className="pw-anim text-xs uppercase tracking-widest text-accent">
                  After MDCAT
                </span>
                <h1 className="pw-anim text-4xl md:text-6xl font-light tracking-tighter text-coal-900 max-w-3xl leading-[1.05] mt-3">
                  Getting in is step one.
                  <br />
                  <span className="text-coal-500">Then comes the longer road.</span>
                </h1>
                <div className="pw-anim mt-8 space-y-4 text-coal-700 leading-relaxed text-lg max-w-2xl">
                  <p>
                    Most MDCAT tools go quiet the moment you have a seat. We
                    did not want to build one of those. A Pakistani medical
                    degree can take you to the United States, the UK,
                    Australia or the Gulf, and what surprises most students is
                    how early the deciding moves get made.
                  </p>
                  <p>
                    We are writing this from experience. We both went through
                    the US system and then the Pakistani one, and we both sit
                    on the executive team at CureNova Research, which mentors
                    international medical graduates through licensing and
                    research. This is the short version of what we wish
                    someone had told us when we started.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── The four pathways ──────────────────────────────────────── */}
        <section className="border-t border-coal-rule">
          <div className="mx-auto max-w-6xl px-6 md:px-10 py-20">
            <div className="grid grid-cols-12 gap-6">
              <div className="hidden md:block col-span-1 marginalia pt-2">
                02 / Routes
              </div>
              <div className="col-span-12 md:col-span-11">
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-coal-900">
                  Four ways the degree can travel
                </h2>
                <p className="mt-3 text-coal-600 max-w-xl">
                  A plain overview of each. None of them is the right answer
                  on its own. The right answer depends on you.
                </p>

                <div className="pw-grid mt-8 grid md:grid-cols-2 gap-3">
                  {PATHWAYS.map((p) => (
                    <div
                      key={p.code}
                      className="pw-card rounded-xl border border-coal-rule bg-coal-50 p-6"
                    >
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-lg text-coal-900">{p.name}</h3>
                        <span className="marginalia">{p.region}</span>
                      </div>
                      <div className="mt-1 text-sm text-accent">{p.code}</div>
                      <p className="mt-3 text-sm text-coal-600 leading-relaxed">
                        {p.summary}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-xs text-coal-500 max-w-xl leading-relaxed">
                  Licensing rules shift year to year. Use this to get your
                  bearings, then confirm the current requirements with the
                  relevant body before you build a plan around them.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Where Enid fits ────────────────────────────────────────── */}
        <section className="border-t border-coal-rule">
          <div className="mx-auto max-w-6xl px-6 md:px-10 py-20">
            <div className="grid grid-cols-12 gap-6">
              <div className="hidden md:block col-span-1 marginalia pt-2">
                03 / Why this
              </div>
              <div className="col-span-12 md:col-span-11">
                <div className="inline-grid place-items-center h-11 w-11 rounded-lg bg-accent/10 border border-accent/20 text-accent mb-5">
                  <Compass className="h-5 w-5" />
                </div>
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-coal-900 max-w-2xl">
                  What we wish we had, built into one place
                </h2>
                <div className="mt-5 space-y-4 text-coal-700 leading-relaxed max-w-2xl">
                  <p>
                    Every one of these pathways is, underneath, an exam you
                    have to pass. As students, what we wanted was simple. A
                    place to practice that we could actually afford and keep
                    using, one that made the material stick.
                  </p>
                  <p>
                    Plenty of question banks exist. Few are built around
                    active recall. Fewer take the questions you got wrong and
                    put them back in front of you until they are no longer
                    weak spots. And none of them, as far as we have seen, were
                    built by people who walked the IMG path themselves.
                  </p>
                  <p>
                    That is what Enid is. The MDCAT bank is where it starts.
                    The way it is built, the spaced review and the adaptive
                    drill, is the part meant to carry you a lot further than
                    one exam.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
                  <Link
                    href="/exams"
                    className="press inline-flex items-center gap-2 text-base font-medium text-coal-900 border-b border-coal-900 pb-1 hover:gap-3 tx-color"
                    style={{ transition: 'gap 200ms var(--ease-out)' }}
                  >
                    Start practicing
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
        </section>
      </main>
      <Footer />
    </>
  );
}
