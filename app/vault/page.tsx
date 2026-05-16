'use client';

// app/vault/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Mistake Vault (Enid+).
//
// Lists questions you've previously gotten wrong, grouped into:
//   • Due now - items where due_at <= now()
//   • Coming up - due in future
//   • Mastered - stage >= 5 (means you've gotten it right at all intervals)
//
// Clicking a "due now" item drops you into a mini review of just that question.
// Stage advancement: correct = next stage, wrong = back to stage 1.
//
// Schedule:  stage 1 → next due in 1 day
//            stage 2 → 3 days
//            stage 3 → 7 days
//            stage 4 → 14 days
//            stage 5 → 30 days
//            stage 6+ → mastered, removed from queue (kept for stats)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { useEnidPlus } from '@/lib/enid-plus.client';
import { fetchPaper } from '@/lib/data';
import type { Question } from '@/lib/types';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, X as XIcon, Lightbulb,
  BookOpen, Calendar, CheckCircle2, Brain, Flag,
} from 'lucide-react';
import ReportModal from '@/components/ReportModal';

const STAGE_DAYS: Record<number, number> = {
  1: 1, 2: 3, 3: 7, 4: 14, 5: 30,
};
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

interface VaultRow {
  id: string;
  category: string;
  paper_id: string;
  question_index: number;
  question_text: string;
  subject: string | null;
  topic: string | null;
  stage: number;
  due_at: string;
  times_wrong: number;
  times_correct: number;
}

export default function VaultPage() {
  const supabase = createClient();
  const sub = useEnidPlus();
  const router = useRouter();
  const [rows, setRows] = useState<VaultRow[]>([]);
  const [loading, setLoading] = useState(true);

  // The currently-reviewing item (loaded on demand).
  const [reviewing, setReviewing] = useState<{ row: VaultRow; question: Question } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  async function refresh() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('mistake_vault')
      .select('*')
      .eq('user_id', user.id)
      .order('due_at', { ascending: true });
    setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (sub.loading) return;
    // The Vault list loads for everyone — a free user seeing their mistakes
    // pile up is the whole hook. The spaced-repetition review itself stays
    // Enid+, gated at the point of starting a review.
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub.loading]);

  const { due, upcoming, mastered } = useMemo(() => {
    const now = Date.now();
    const due: VaultRow[] = [];
    const upcoming: VaultRow[] = [];
    const mastered: VaultRow[] = [];
    for (const r of rows) {
      if (r.stage >= 6) {
        mastered.push(r);
      } else if (new Date(r.due_at).getTime() <= now) {
        due.push(r);
      } else {
        upcoming.push(r);
      }
    }
    return { due, upcoming, mastered };
  }, [rows]);

  async function openReview(row: VaultRow) {
    // Free users can see the Vault fill up, but starting a spaced-repetition
    // review is Enid+. Send them to pricing rather than into the review.
    if (!sub.isActive) {
      router.push('/pricing');
      return;
    }
    const paper = await fetchPaper(row.category, row.paper_id);
    if (!paper || !paper.questions[row.question_index]) {
      toast.error('Could not load this question. Try the next one.');
      return;
    }
    setReviewing({ row, question: paper.questions[row.question_index] });
    setSelected(null);
    setSubmitted(false);
  }

  async function submitReview(correct: boolean) {
    if (!reviewing) return;
    const { row } = reviewing;
    const newStage = correct ? Math.min(row.stage + 1, 6) : 1;
    const daysAhead = STAGE_DAYS[newStage] ?? 30;
    const newDueAt = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

    await supabase
      .from('mistake_vault')
      .update({
        stage: newStage,
        due_at: newDueAt,
        last_seen_at: new Date().toISOString(),
        times_correct: row.times_correct + (correct ? 1 : 0),
        times_wrong: row.times_wrong + (correct ? 0 : 1),
      })
      .eq('id', row.id);

    if (correct && newStage >= 6) {
      toast.success("Mastered! That one's out of your queue.");
    } else if (correct) {
      toast.success(`Got it. Next review in ${daysAhead} day${daysAhead === 1 ? '' : 's'}.`);
    } else {
      toast.info('Reset to day 1. This shows up again tomorrow.');
    }

    setReviewing(null);
    await refresh();
  }

  // ─── Gate ──────────────────────────────────────────────────────────────
  if (sub.loading || loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-5 py-20 text-center text-coal-600">
          Loading…
        </main>
      </>
    );
  }

  // ─── Review modal ─────────────────────────────────────────────────────
  if (reviewing) {
    const q = reviewing.question;
    const correctIndex = q.options.findIndex((o) => o.isCorrect);
    const reveal = submitted;
    const wasCorrect = selected === correctIndex;

    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-5 py-8">
          <button
            onClick={() => setReviewing(null)}
            className="press inline-flex items-center gap-1.5 text-sm text-coal-600 hover:text-coal-900 mb-5 tx-color"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to vault
          </button>

          <div className="border border-coal-rule bg-coal-50 p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs uppercase tracking-widest text-accent">
                Stage {reviewing.row.stage} review
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-coal-500">
                  Seen wrong {reviewing.row.times_wrong} time{reviewing.row.times_wrong === 1 ? '' : 's'}
                </span>
                <button
                  onClick={() => setReportOpen(true)}
                  className="press inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-coal-rule text-coal-600 hover:text-crimson hover:border-crimson/40 tx-color"
                  title="Report this question"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Report
                </button>
              </div>
            </div>

            <p className="text-coal-900 leading-relaxed mb-5">{q.text}</p>
            <div className="space-y-2 mb-5">
              {q.options.map((opt, i) => {
                const isCorrect = i === correctIndex;
                const isPicked = selected === i;
                return (
                  <button
                    key={i}
                    onClick={() => !submitted && setSelected(i)}
                    disabled={submitted}
                    className={`press w-full text-left border px-4 py-3 flex items-start gap-3 tx-color ${
                      reveal && isCorrect
                        ? 'border-accent bg-coal-50'
                        : reveal && isPicked && !isCorrect
                        ? 'border-crimson bg-crimson/5'
                        : isPicked
                        ? 'border-accent bg-coal-50'
                        : 'border-coal-rule hover:border-coal-300'
                    }`}
                  >
                    <span className="font-mono text-sm text-coal-500 shrink-0">{LETTERS[i]}</span>
                    <span className="flex-1 text-coal-800">{opt.text}</span>
                    {reveal && isCorrect && <Check className="h-4 w-4 text-accent" />}
                    {reveal && isPicked && !isCorrect && <XIcon className="h-4 w-4 text-accent" />}
                  </button>
                );
              })}
            </div>

            {reveal && (q.explanation || q.options[correctIndex]?.explanation) && (
              <div className="border border-coal-rule bg-coal/80 p-4 mb-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent mb-2">
                  <Lightbulb className="h-3.5 w-3.5" /> Explanation
                </div>
                <p className="text-sm text-coal-900 leading-relaxed">
                  {q.explanation || q.options[correctIndex]?.explanation}
                </p>
              </div>
            )}

            {!submitted ? (
              <button
                onClick={() => setSubmitted(true)}
                disabled={selected === null}
                className="press w-full inline-flex items-center justify-center gap-2 bg-accent text-coal px-5 py-2.5 font-medium hover:opacity-90 tx-color disabled:opacity-50"
              >
                Reveal answer
              </button>
            ) : (
              <button
                onClick={() => submitReview(wasCorrect)}
                className="press w-full inline-flex items-center justify-center gap-2 bg-accent text-coal px-5 py-2.5 font-medium hover:opacity-90 tx-color"
              >
                {wasCorrect ? 'Got it right, advance stage' : 'Got it wrong, reset to stage 1'}
              </button>
            )}
          </div>
        </main>

        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          category={reviewing.row.category}
          paperId={reviewing.row.paper_id}
          questionIndex={reviewing.row.question_index}
          questionText={reviewing.question.text}
        />
      </>
    );
  }

  // ─── Main list ─────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-accent">Enid+</span>
          <h1 className="text-4xl font-light tracking-tighter text-coal-900 mt-2">
            Mistake Vault.
          </h1>
          <p className="text-coal-600 mt-2">
            Every question you got wrong, scheduled for review on a spaced
            repetition curve. Get one right at all stages and it's gone.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <Stat icon={<Brain className="h-4 w-4" />} label="Due now" value={due.length} highlight />
          <Stat icon={<Calendar className="h-4 w-4" />} label="Coming up" value={upcoming.length} />
          <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Mastered" value={mastered.length} />
        </div>

        {!sub.isActive && rows.length > 0 && (
          <div className="mb-8 rounded-xl border border-accent/30 bg-accent/10 p-5">
            <p className="text-coal-900 font-medium">
              Reviewing on a schedule is an Enid+ feature.
            </p>
            <p className="text-sm text-coal-600 mt-1">
              Your mistakes are being collected here for free. Enid+ brings
              each one back at the right time, on a 1, 3, 7, 14, 30 day curve,
              until you have it down.
            </p>
            <Link
              href="/pricing"
              className="press inline-flex items-center gap-2 mt-4 bg-accent text-coal px-4 py-2 text-sm font-medium hover:opacity-90 tx-color"
            >
              Unlock spaced review <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="border border-coal-rule bg-coal-50 p-10 text-center">
            <Brain className="h-8 w-8 text-accent mx-auto mb-3" />
            <p className="text-coal-700 max-w-md mx-auto">
              Nothing here yet, which is fine. Practice a paper or run a
              drill. The questions you get wrong land here, and getting them
              wrong now is how you stop getting them wrong on the day that
              counts.
            </p>
          </div>
        ) : (
          <>
            {due.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl text-coal-900 mb-3">Due now</h2>
                <ul className="space-y-2">
                  {due.map((r) => <VaultItem key={r.id} row={r} onReview={() => openReview(r)} />)}
                </ul>
              </section>
            )}
            {upcoming.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl text-coal-900 mb-3">Coming up</h2>
                <ul className="space-y-2">
                  {upcoming.slice(0, 10).map((r) => (
                    <VaultItem key={r.id} row={r} muted />
                  ))}
                </ul>
                {upcoming.length > 10 && (
                  <p className="text-xs text-coal-500 mt-2">
                    +{upcoming.length - 10} more queued
                  </p>
                )}
              </section>
            )}
            {mastered.length > 0 && (
              <section>
                <h2 className="text-xl text-coal-900 mb-3">Mastered</h2>
                <p className="text-sm text-coal-500">
                  You've completed all 5 stages on {mastered.length} question
                  {mastered.length === 1 ? '' : 's'}. Nice work.
                </p>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

function Stat({ icon, label, value, highlight }: {
  icon: React.ReactNode; label: string; value: number; highlight?: boolean;
}) {
  return (
    <div className={`border p-4 ${
      highlight && value > 0
        ? 'border-accent bg-coal-50'
        : 'border-coal-rule bg-coal-50'
    }`}>
      <div className="text-coal-600 inline-flex items-center gap-1.5 text-xs uppercase tracking-wider">
        {icon} {label}
      </div>
      <div className={`text-2xl mt-1.5 ${
        highlight && value > 0 ? 'text-accent' : 'text-coal-900'
      }`}>
        {value}
      </div>
    </div>
  );
}

function VaultItem({
  row, onReview, muted,
}: { row: VaultRow; onReview?: () => void; muted?: boolean }) {
  const dueDate = new Date(row.due_at);
  const dueLabel = dueDate.toLocaleDateString();
  return (
    <li
      onClick={onReview}
      className={`border p-3 flex items-center gap-3 ${
        onReview
          ? 'border-coal-rule bg-coal-50 hover:border-accent cursor-pointer tx-color'
          : 'border-coal-rule bg-coal-50 opacity-70'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm text-coal-800 truncate">{row.question_text}</div>
        <div className="text-xs text-coal-500 mt-0.5 flex items-center gap-2">
          {row.topic && <span>{row.topic}</span>}
          {row.topic && <span className="text-coal-400">·</span>}
          <span>Stage {row.stage}</span>
          {!onReview && (
            <>
              <span className="text-coal-400">·</span>
              <span>Due {dueLabel}</span>
            </>
          )}
        </div>
      </div>
      {onReview && <ArrowRight className="h-4 w-4 text-coal-500 shrink-0" />}
    </li>
  );
}
