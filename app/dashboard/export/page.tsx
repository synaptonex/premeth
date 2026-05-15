'use client';

/**
 * Export to PDF — Premeth+ feature.
 *
 * Rather than pulling in jsPDF (300kb+) and trying to lay out a document
 * with code, we render a clean print-stylesheet HTML page and let the
 * browser's "Print to PDF" do the work. It's higher quality, lighter,
 * and the user gets a real PDF with selectable text.
 *
 * What gets exported: the user's mistake vault — every wrong answer
 * they've ever made, grouped by subject and topic, with the correct
 * answer and explanation. This is the "wrong-answer notebook" that
 * Pakistani MDCAT students traditionally maintain on paper.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';
import { fetchPaper } from '@/lib/data';
import { INDEXES } from '@/lib/data/indexes';
import { usePremethPlus } from '@/lib/premeth-plus';
import type { Question } from '@/lib/types';
import { Printer, Loader2, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

type VaultRow = {
  id: string;
  category: string;
  paper_id: string;
  q_index: number;
  user_answer_index: number;
  added_at: string;
};

type ResolvedItem = {
  subject: string;
  topic: string;
  paper_name: string;
  question: Question;
  user_answer_index: number;
  added_at: string;
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export default function ExportPage() {
  const router = useRouter();
  const supabase = createClient();
  const { isPlus, loading: plusLoading } = usePremethPlus();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ResolvedItem[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (plusLoading) return;
    if (!isPlus) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?next=/dashboard/export');
        return;
      }

      const [{ data: vault }, { data: prof }] = await Promise.all([
        supabase
          .from('mistake_vault')
          .select('id, category, paper_id, q_index, user_answer_index, added_at')
          .eq('user_id', user.id)
          .order('added_at', { ascending: false })
          .limit(500), // cap to keep the PDF reasonable
        supabase.from('profiles').select('username').eq('id', user.id).single(),
      ]);

      setUsername(prof?.username ?? null);

      // Resolve each vault row to its actual question. We batch by paper
      // to avoid N+1 — fetch each paper once, then look up question indices.
      const byPaper = new Map<string, VaultRow[]>();
      for (const v of (vault ?? []) as VaultRow[]) {
        const key = `${v.category}/${v.paper_id}`;
        const arr = byPaper.get(key) ?? [];
        arr.push(v);
        byPaper.set(key, arr);
      }

      const resolved: ResolvedItem[] = [];
      for (const [key, rows] of byPaper) {
        const [category, paperId] = key.split('/');
        const paper = await fetchPaper(category, paperId);
        if (!paper) continue;
        const meta = INDEXES[category]?.papers.find((p) => p.id === paperId);
        for (const row of rows) {
          const q = paper.questions[row.q_index];
          if (!q) continue;
          resolved.push({
            subject: meta?.subject ?? 'Other',
            topic: meta?.topics?.[0] ?? 'General',
            paper_name: meta?.name ?? paperId,
            question: q,
            user_answer_index: row.user_answer_index,
            added_at: row.added_at,
          });
        }
      }

      // Sort: by subject, then topic, then date
      resolved.sort((a, b) => {
        if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
        if (a.topic !== b.topic) return a.topic.localeCompare(b.topic);
        return a.added_at.localeCompare(b.added_at);
      });

      setItems(resolved);
      setLoading(false);
    })();
  }, [isPlus, plusLoading, router, supabase]);

  function handlePrint() {
    window.print();
  }

  if (plusLoading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-5 py-20 text-center text-ink-400">
          Loading…
        </main>
      </>
    );
  }

  if (!isPlus) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-5 py-20">
          <div className="rounded-2xl border border-ink-800 bg-ink-900/40 p-10 text-center">
            <Lock className="h-8 w-8 text-meth mx-auto mb-3" />
            <h1 className="font-display text-3xl text-paper tracking-tight mb-2">
              PDF export is a Premeth+ feature.
            </h1>
            <p className="text-ink-300 max-w-md mx-auto mb-6">
              Print your wrong-answer notebook for offline revision.
            </p>
            <Link
              href="/pricing"
              className="press inline-flex items-center gap-2 rounded-md bg-meth text-ink-950 px-5 py-2.5 font-medium hover:bg-meth-300 tx-color"
            >
              See Premeth+ pricing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-5 py-20 text-center text-ink-400">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
          Building your notebook… this can take a moment for large vaults.
        </main>
      </>
    );
  }

  // Group items for nicer rendering
  const bySubject = new Map<string, ResolvedItem[]>();
  for (const item of items) {
    const arr = bySubject.get(item.subject) ?? [];
    arr.push(item);
    bySubject.set(item.subject, arr);
  }

  return (
    <>
      {/* Screen-only chrome */}
      <div className="print:hidden">
        <Navbar />
        <div className="mx-auto max-w-3xl px-5 py-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-paper tx-color mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-meth">
                Premeth+ · Export
              </span>
              <h1 className="font-display text-3xl text-paper tracking-tight mt-1">
                Wrong-answer notebook.
              </h1>
              <p className="text-ink-400 text-sm mt-1">
                {items.length} mistakes from your vault. Use your browser's "Save as PDF" option.
              </p>
            </div>
            <button
              onClick={handlePrint}
              disabled={items.length === 0}
              className="press inline-flex items-center gap-2 rounded-md bg-meth text-ink-950 px-4 py-2 font-medium hover:bg-meth-300 tx-color disabled:opacity-50"
            >
              <Printer className="h-4 w-4" /> Print / Save as PDF
            </button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-10 text-center">
              <p className="text-ink-300">
                Your vault is empty. Get something wrong first, then come back.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-ink-800 bg-paper p-1 overflow-hidden">
              {/* preview of the printable content */}
              <div className="max-h-96 overflow-y-auto">
                <PrintContent
                  items={items}
                  bySubject={bySubject}
                  username={username}
                  preview
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print-only content */}
      <div ref={printRef} className="hidden print:block">
        <PrintContent items={items} bySubject={bySubject} username={username} />
      </div>

      {/* Print stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 1.5cm;
            size: A4;
          }
          body {
            background: white !important;
            color: black !important;
            font-family: Georgia, 'Times New Roman', serif;
          }
          .print-page-break {
            page-break-before: always;
          }
          .print-avoid-break {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </>
  );
}

function PrintContent({
  items,
  bySubject,
  username,
  preview = false,
}: {
  items: ResolvedItem[];
  bySubject: Map<string, ResolvedItem[]>;
  username: string | null;
  preview?: boolean;
}) {
  const rootClass = preview
    ? 'p-8 text-ink-950 bg-paper'
    : 'p-0 text-black bg-white';

  return (
    <div className={rootClass} style={{ fontFamily: 'Georgia, serif' }}>
      {/* Title page */}
      <div className="text-center mb-12 pb-8 border-b border-gray-300">
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Wrong-Answer Notebook
        </h1>
        <p className="text-lg text-gray-700">
          {username ? `Compiled for ${username}` : 'Your personal revision book'}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          {items.length} mistakes · Generated {new Date().toLocaleDateString()}
        </p>
        <p className="text-xs text-gray-500 mt-4 italic">
          From premeth.com — Premeth+ subscriber
        </p>
      </div>

      {Array.from(bySubject.entries()).map(([subject, subjectItems], si) => (
        <section key={subject} className={si > 0 ? 'print-page-break' : ''}>
          <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-800 pb-1">
            {subject}
          </h2>
          <p className="text-sm text-gray-600 mb-6">{subjectItems.length} mistakes</p>

          {subjectItems.map((item, i) => {
            const correctIdx = item.question.options.findIndex((o) => o.isCorrect);
            return (
              <div key={`${subject}-${i}`} className="print-avoid-break mb-8 pb-6 border-b border-gray-200">
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">
                  {item.topic} · {item.paper_name}
                </div>
                <div className="font-semibold mb-3 leading-snug">
                  Q{i + 1}. {item.question.question}
                </div>
                <ol className="space-y-1 mb-3">
                  {item.question.options.map((opt, oi) => {
                    const isCorrect = oi === correctIdx;
                    const isUserChoice = oi === item.user_answer_index;
                    return (
                      <li
                        key={oi}
                        className={`text-sm pl-2 ${
                          isCorrect
                            ? 'font-semibold text-green-800'
                            : isUserChoice
                            ? 'line-through text-red-700'
                            : 'text-gray-800'
                        }`}
                      >
                        ({LETTERS[oi]}) {opt.text}
                        {isCorrect && ' ✓'}
                        {isUserChoice && !isCorrect && ' ✗ (you chose this)'}
                      </li>
                    );
                  })}
                </ol>
                {item.question.explanation && (
                  <div className="text-sm bg-gray-50 border-l-2 border-gray-400 pl-3 py-2 italic text-gray-800">
                    <strong className="not-italic">Why:</strong> {item.question.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
