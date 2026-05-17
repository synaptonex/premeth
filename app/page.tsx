import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import Founders from '@/components/Founders';
import Features from '@/components/Features';
import EnidPlusSection from '@/components/EnidPlusSection';
import AggregateTeaser from '@/components/AggregateTeaser';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Founders />
        <Features />
        <EnidPlusSection />
        <AggregateTeaser />

        {/* Closing call to action. Single line, no card, just an invitation. */}
        <section className="border-t border-coal-rule">
          <div className="mx-auto max-w-6xl px-6 md:px-10 py-24 md:py-32">
            <div className="grid grid-cols-12 gap-6">
              <div className="hidden md:block col-span-1 marginalia pt-1">
                06 / Start
              </div>
              <div className="col-span-12 md:col-span-11">
                <h2 className="text-4xl md:text-6xl font-light tracking-tighter text-coal-900 max-w-3xl leading-[1.05]">
                  Pick a paper.
                  <br />
                  <span className="text-coal-500">Hit start. That's the whole onboarding.</span>
                </h2>
                <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
                  <Link
                    href="/exams"
                    className="press inline-flex items-center gap-2 text-base font-medium text-coal-900 border-b border-coal-900 pb-1 hover:gap-3 tx-color"
                    style={{ transition: 'gap 200ms var(--ease-out)' }}
                  >
                    Browse the 31 categories
                    <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href="/signup"
                    className="link-draw text-base text-coal-600 hover:text-coal-900 tx-color"
                  >
                    Save your progress
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
