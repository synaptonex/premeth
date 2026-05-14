import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Marquee from '@/components/Marquee';
import FAQ from '@/components/FAQ';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Features />

        {/* CTA strip */}
        <section className="relative mx-auto max-w-6xl px-5 py-24">
          <div className="relative overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/40 p-10 md:p-14">
            <div
              aria-hidden
              className="absolute -top-24 -right-24 w-96 h-96 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(62,224,137,0.18) 0%, rgba(62,224,137,0) 70%)',
              }}
            />
            <h3 className="relative font-display text-4xl md:text-5xl text-paper tracking-tight max-w-2xl">
              Pick a paper. Hit start. That's the whole onboarding.
            </h3>
            <p className="relative mt-4 text-ink-400 max-w-xl">
              No quiz to "match you to a program". No 10-question intake. The
              papers are right there.
            </p>
            <div className="relative mt-7 flex flex-wrap gap-3">
              <Link
                href="/exams"
                className="press group inline-flex items-center gap-2 rounded-md bg-meth text-ink-950 px-5 py-3 font-medium hover:bg-meth-300 tx-color"
              >
                Browse all 31 categories
                <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/signup"
                className="press inline-flex items-center rounded-md border border-ink-700 text-paper px-5 py-3 hover:border-meth/50 hover:text-meth tx-color"
              >
                Save your progress
              </Link>
            </div>
          </div>
        </section>

        <FAQ />
      </main>
      <Footer />
    </>
  );
}
