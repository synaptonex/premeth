'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCategory, SUBJECT_COLORS } from '@/lib/categories';
import { INDEXES } from '@/lib/data/indexes';
import { Search, ChevronRight, ArrowLeft } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function PapersListPage() {
  const params = useParams<{ category: string }>();
  const root = useRef<HTMLDivElement>(null);
  const category = params?.category;

  const info = category ? getCategory(category) : undefined;
  const index = category ? INDEXES[category] : undefined;

  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  const subjects = useMemo(() => {
    if (!index) return [] as string[];
    return Array.from(
      new Set(index.papers.map((p) => p.subject).filter((s): s is string => !!s))
    ).sort();
  }, [index]);

  const filtered = useMemo(() => {
    if (!index) return [];
    const q = query.toLowerCase().trim();
    return index.papers.filter((p) => {
      const matchQ = !q || (p.name ?? '').toLowerCase().includes(q);
      const matchS = !subjectFilter || p.subject === subjectFilter;
      return matchQ && matchS;
    });
  }, [index, query, subjectFilter]);

  useGSAP(
    () => {
      gsap.from('.paper-row', {
        y: 12,
        autoAlpha: 0,
        duration: 0.35,
        stagger: { each: 0.012 },
        ease: 'power2.out',
      });
    },
    { scope: root, dependencies: [filtered.length] }
  );

  if (!info || !index) {
    if (typeof window !== 'undefined') notFound();
    return null;
  }

  return (
    <>
      <Navbar />
      <main ref={root} className="mx-auto max-w-5xl px-5 py-12">
        <Link
          href="/exams"
          className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-meth tx-color mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          All categories
        </Link>

        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-meth">
            {info.group}
          </span>
          <h1 className="font-display text-4xl md:text-5xl text-paper tracking-tight mt-2">
            {info.name}
          </h1>
          <p className="text-ink-400 mt-2 max-w-2xl">{info.description}</p>
          <div className="mt-4 text-sm text-ink-500">
            <span className="text-paper">{index.papers.length}</span> papers ·{' '}
            <span className="text-paper">
              {index.papers
                .reduce((s, p) => s + (p.questionCount ?? 0), 0)
                .toLocaleString()}
            </span>{' '}
            questions
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
            <input
              type="text"
              placeholder="Search papers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-md bg-ink-900 border border-ink-800 text-paper placeholder:text-ink-500 focus:border-meth focus:outline-none tx-color"
            />
          </div>
          {subjects.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSubjectFilter(null)}
                className={`press text-xs px-3 py-2 rounded-md border tx-color whitespace-nowrap ${
                  subjectFilter === null
                    ? 'bg-meth/15 text-meth border-meth/30'
                    : 'border-ink-800 text-ink-300 hover:border-ink-700'
                }`}
              >
                All subjects
              </button>
              {subjects.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubjectFilter(s)}
                  className={`press text-xs px-3 py-2 rounded-md border tx-color whitespace-nowrap ${
                    subjectFilter === s
                      ? 'bg-meth/15 text-meth border-meth/30'
                      : 'border-ink-800 text-ink-300 hover:border-ink-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Paper list */}
        <ul className="divide-y divide-ink-800 border-t border-b border-ink-800">
          {filtered.map((p) => (
            <li key={p.id} className="paper-row">
              <Link
                href={`/practice/${category}/${p.id}`}
                className="flex items-center justify-between gap-4 py-4 group"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-paper group-hover:text-meth tx-color truncate">
                      {p.name ?? p.id.replace(/_/g, ' ')}
                    </h3>
                    {p.subject && (
                      <span
                        className={`shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                          SUBJECT_COLORS[p.subject] ??
                          'bg-ink-800 text-ink-300 border-ink-700'
                        }`}
                      >
                        {p.subject}
                      </span>
                    )}
                    {p.year && (
                      <span className="text-xs text-ink-500">{p.year}</span>
                    )}
                  </div>
                  {p.topics?.length > 0 && (
                    <p className="text-xs text-ink-500 mt-1 truncate">
                      {p.topics.slice(0, 4).join(' · ')}
                      {p.topics.length > 4 && ` · +${p.topics.length - 4} more`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-ink-400">
                    <span className="text-paper font-medium">
                      {p.questionCount}
                    </span>{' '}
                    Qs
                  </span>
                  <ChevronRight className="h-4 w-4 text-ink-600 group-hover:text-meth group-hover:translate-x-1 transition-transform duration-200 ease-out-strong" />
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-ink-500">
            No papers match your filters.
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
