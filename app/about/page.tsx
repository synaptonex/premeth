'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Github, Mail, ArrowRight } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function AboutPage() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.about-eyebrow', { y: 12, autoAlpha: 0, duration: 0.4 })
        .from('.about-title',  { y: 24, autoAlpha: 0, duration: 0.6 }, '-=0.2')
        .from('.about-body p', { y: 12, autoAlpha: 0, duration: 0.45, stagger: 0.06 }, '-=0.3')
        .from('.about-card',   { y: 16, autoAlpha: 0, duration: 0.4, stagger: 0.08 }, '-=0.2');
    },
    { scope: root }
  );

  return (
    <>
      <Navbar />
      <main ref={root} className="mx-auto max-w-3xl px-5 py-16">
        <span className="about-eyebrow text-xs uppercase tracking-widest text-meth">
          About
        </span>
        <h1 className="about-title font-display text-5xl md:text-6xl text-paper tracking-tight mt-2">
          Built by students who got tired of the alternatives.
        </h1>

        <div className="about-body mt-8 space-y-5 text-ink-300 leading-relaxed text-lg">
          <p>
            Premeth started as a single repo of MCQ data: 2,500+ past papers,
            scrubbed and structured into JSON so anyone could build something
            with them. The original site at <a href="https://premeth.com" className="text-meth hover:underline">premeth.com</a> was the first thing built on top.
          </p>
          <p>
            This is v2. Same dataset, same "free forever, no signup needed for
            practice" rule. Three things changed:
          </p>
          <p>
            <strong className="text-paper">Diagrams render.</strong> If a question
            had a figure attached, it now shows up next to the question instead
            of being invisible.
          </p>
          <p>
            <strong className="text-paper">You can flag wrong answers.</strong>{' '}
            Past papers are noisy. Whoever transcribed them made typos. Whoever
            answered them sometimes got it wrong. Hit the flag, pick a reason,
            and the next person to open that question may see it fixed.
          </p>
          <p>
            <strong className="text-paper">Accounts are optional but useful.</strong>{' '}
            You can practice without one. If you sign up, your attempts get
            saved and the dashboard tells you which topics keep tripping you up.
          </p>
          <p>
            That's it. No upsells, no premium tier, no "limited free trial."
            The whole thing runs on a free Vercel deploy and a free Supabase
            project. Whichever student inherits this codebase next can keep it
            running for roughly $0 a month.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-3">
          <a
            href="https://github.com/eldrickbnt/premeth-data"
            target="_blank"
            rel="noopener noreferrer"
            className="about-card hover-lift rounded-xl border border-ink-800 bg-ink-900/40 p-5 hover:border-meth/30 tx-color block"
            style={{ transition: 'border-color 200ms var(--ease-out), transform 200ms var(--ease-out)' }}
          >
            <div className="inline-grid place-items-center h-10 w-10 rounded-lg bg-meth/10 border border-meth/20 text-meth mb-3">
              <Github className="h-5 w-5" />
            </div>
            <div className="font-display text-lg text-paper">Open-source data</div>
            <p className="text-sm text-ink-400 mt-1">
              All 2,500+ papers as JSON. Fork it, fix typos, send a PR.
            </p>
          </a>

          <a
            href="mailto:hi@premeth.com"
            className="about-card hover-lift rounded-xl border border-ink-800 bg-ink-900/40 p-5 hover:border-meth/30 tx-color block"
            style={{ transition: 'border-color 200ms var(--ease-out), transform 200ms var(--ease-out)' }}
          >
            <div className="inline-grid place-items-center h-10 w-10 rounded-lg bg-meth/10 border border-meth/20 text-meth mb-3">
              <Mail className="h-5 w-5" />
            </div>
            <div className="font-display text-lg text-paper">Get in touch</div>
            <p className="text-sm text-ink-400 mt-1">
              Found a bug? Want to contribute? Send a note.
            </p>
          </a>
        </div>

        <div className="about-card mt-10 rounded-xl border border-ink-800 bg-ink-900/40 p-6">
          <p className="text-paper font-display text-xl">Start practicing.</p>
          <p className="text-sm text-ink-400 mt-1 mb-4">
            No login wall between you and the papers.
          </p>
          <Link
            href="/exams"
            className="press inline-flex items-center gap-2 rounded-md bg-meth text-ink-950 px-5 py-2.5 font-medium hover:bg-meth-300 tx-color"
          >
            Browse the catalog <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
