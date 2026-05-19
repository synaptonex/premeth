'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CATEGORIES, type CategoryInfo } from '@/lib/categories';
import { INDEXES } from '@/lib/data/indexes';
import { Search, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

type Group = CategoryInfo['group'];
const GROUPS: Group[] = ['Past Papers', 'Subject Drills', 'Programs', 'Other'];

export default function ExamsPage() {
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');

  // Per-category counts come straight from the bundled indexes.
  const counts = useMemo<Record<string, { papers: number; questions: number }>>(() => {
    const out: Record<string, { papers: number; questions: number }> = {};
    for (const [slug, idx] of Object.entries(INDEXES)) {
      const papers = idx.papers?.length ?? 0;
      const questions = (idx.papers ?? []).reduce(
        (s, p) => s + (p.questionCount ?? 0),
        0
      );
      out[slug] = { papers, questions };
    }
    return out;
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return CATEGORIES;
    const q = query.toLowerCase();
    return CATEGORIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
    );
  }, [query]);

  useGSAP(
    () => {
      gsap.from('.exam-card', {
        y: 16,
        autoAlpha: 0,
        duration: 0.35,
        stagger: { each: 0.025, from: 'start' },
        ease: 'power2.out',
      });
    },
    { scope: root, dependencies: [filtered.length] }
  );

  return (
    <>
      <Navbar />
      <main ref={root} className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-col gap-3 mb-10">
          <span className="text-xs uppercase tracking-widest text-accent">Catalog</span>
          <h1 className="font-display text-5xl md:text-6xl text-coal-900 tracking-tight">
            All 31 categories.
          </h1>
          <p className="text-coal-600 max-w-2xl">
            2,500+ papers, grouped by source and purpose. Pick one to see every
            paper inside. No login needed to practice.
          </p>
        </div>

        <div className="relative max-w-md mb-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-coal-500" />
          <input
            type="text"
            placeholder="Search categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-md bg-coal-50 border border-coal-rule text-coal-900 placeholder:text-coal-500 focus:border-accent focus:outline-none tx-color"
          />
        </div>

        {GROUPS.map((g) => {
          const groupItems = filtered.filter((c) => c.group === g);
          if (groupItems.length === 0) return null;
          return (
            <section key={g} className="mb-12">
              <h2 className="text-xs uppercase tracking-widest text-coal-500 mb-4">
                {g}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupItems.map((c) => {
                  const n = counts[c.slug] ?? { papers: 0, questions: 0 };
                  return (
                    <Link
                      key={c.slug}
                      href={`/papers/${c.slug}`}
                      className="exam-card group relative p-5 rounded-xl border border-coal-rule bg-coal-50/40 hover:border-accent/40 tx-color block"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-xl text-coal-900 group-hover:text-accent tx-color">
                          {c.name}
                        </h3>
                        <ChevronRight
                          className="h-4 w-4 text-coal-500 mt-1 shrink-0 transition-transform duration-200 ease-out-soft group-hover:translate-x-1 group-hover:text-accent"
                        />
                      </div>
                      <p className="text-coal-600 text-sm mt-1 leading-relaxed">
                        {c.description}
                      </p>
                      <div className="mt-4 flex items-center gap-3 text-xs">
                        <span className="text-coal-500">
                          <span className="text-coal-900 font-medium">
                            {n.papers.toLocaleString()}
                          </span>{' '}
                          papers
                        </span>
                        <span className="text-coal-500">·</span>
                        <span className="text-coal-500">
                          <span className="text-coal-900 font-medium">
                            {n.questions.toLocaleString()}
                          </span>{' '}
                          MCQs
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-coal-500">
            No categories match &ldquo;{query}&rdquo;.
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
