'use client';

// app/mock/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Timed Mock Exam (Enid+).
//
// PMDC MDCAT format: 200 MCQs in 200 minutes, broken down by subject
// per the official PMDC weightages (34/27/27/9/3):
//   • Biology    - 68 MCQs
//   • Chemistry  - 54 MCQs
//   • Physics    - 54 MCQs
//   • English    - 18 MCQs
//   • Logical Reasoning - 6 MCQs
//
// Behavior:
//   • Countdown clock at top, locked at 200:00 - when it hits 0, auto-submit.
//   • Side panel showing question grid (answered/unanswered/flagged).
//   • Flag-for-review toggle on each question.
//   • No explanations until the exam ends.
//   • Save to mock_exam_attempts with full subject breakdown.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';
import { useEnidPlus } from '@/lib/enid-plus.client';
import { INDEXES } from '@/lib/data/indexes';
import { fetchPaper } from '@/lib/data';
import type { Question } from '@/lib/types';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, Flag, Lock, Clock, Trophy,
  AlertTriangle, Sparkles,
} from 'lucide-react';

// Official PMDC MDCAT weightages (Biology 34%, Chem 27%, Phys 27%, Eng 9%, LR 3%)
// applied to the standard 200-MCQ format. The 3-hour duration also matches
// PMDC's historical paper structure. PMDC announced a 180-MCQ format in
// mid-2025; we use the 200 split because it (a) gives more practice material,
// (b) preserves exact 34/27/27/9/3 weightages without rounding artefacts, and
// (c) makes the math easy: 1 MCQ ≈ 1 minute, so the student can self-pace.
const SUBJECT_QUOTAS: Record<string, number> = {
  Biology: 68,
  Chemistry: 54,
  Physics: 54,
  English: 18,
  'Logical Reasoning': 6,
};
const TOTAL_MCQS = Object.values(SUBJECT_QUOTAS).reduce((a, b) => a + b, 0); // = 200
const TIME_LIMIT_SECONDS = 200 * 60; // 200 minutes, 1 minute per MCQ
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

interface MockQuestion {
  question: Question;
  source: { category: string; paper_id: string; question_index: number };
  subject: string;
}

type Status = 'gate' | 'intro' | 'building' | 'taking' | 'finished' | 'empty';

export default function MockExamPage() {
  const supabase = createClient();
  const router = useRouter();
  const sub = useEnidPlus();

  const [status, setStatus] = useState<Status>('gate');
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [flagged, setFlagged] = useState<boolean[]>([]);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const finishedRef = useRef(false);

  // ─── Gate ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sub.loading) return;
    if (!sub.isActive) setStatus('gate');
    else setStatus('intro');
  }, [sub.loading, sub.isActive]);

  // ─── Timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'taking') return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, TIME_LIMIT_SECONDS - elapsed);
      setTimeLeft(left);
      if (left === 0 && !finishedRef.current) {
        finishedRef.current = true;
        finish();
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, startedAt]);

  // ─── Build the exam ────────────────────────────────────────────────────
  async function buildExam() {
    setStatus('building');
    const pool: MockQuestion[] = [];

    // For each subject, sample papers from the matching subject_* category +
    // any other category where the paper subject matches.
    for (const [subject, quota] of Object.entries(SUBJECT_QUOTAS)) {
      const candidatePapers: { category: string; paper_id: string }[] = [];
      for (const [cat, idx] of Object.entries(INDEXES)) {
        for (const p of idx.papers ?? []) {
          if (p.subject === subject) {
            candidatePapers.push({ category: cat, paper_id: p.id });
          }
        }
      }
      const sampled = shuffle(candidatePapers).slice(0, Math.ceil(quota / 5));
      let collected: MockQuestion[] = [];
      for (const c of sampled) {
        if (collected.length >= quota) break;
        const paper = await fetchPaper(c.category, c.paper_id);
        if (!paper) continue;
        const matching = paper.questions
          .map((q, i) => ({ q, i }))
          .filter(({ q }) => (q.subject ?? '') === subject || subject === 'Logical Reasoning');
        const picks = shuffle(matching).slice(0, Math.min(5, quota - collected.length));
        for (const { q, i } of picks) {
          collected.push({
            question: q,
            source: { category: c.category, paper_id: c.paper_id, question_index: i },
            subject,
          });
        }
      }
      pool.push(...collected.slice(0, quota));
    }

    if (pool.length < TOTAL_MCQS * 0.5) {
      setStatus('empty');
      return;
    }

    setQuestions(pool);
    setAnswers(new Array(pool.length).fill(null));
    setFlagged(new Array(pool.length).fill(false));
    setQIndex(0);
    setStartedAt(Date.now());
    setTimeLeft(TIME_LIMIT_SECONDS);
    finishedRef.current = false;
    setStatus('taking');
  }

  const q = questions[qIndex];
  const score = useMemo(
    () =>
      questions.reduce((s, qq, i) => {
        const a = answers[i];
        if (a === null) return s;
        return qq.question.options[a]?.isCorrect ? s + 1 : s;
      }, 0),
    [questions, answers]
  );
  const answeredCount = answers.filter((a) => a !== null).length;

  const pickAnswer = useCallback((idx: number) => {
    setAnswers((prev) => { const n = [...prev]; n[qIndex] = idx; return n; });
  }, [qIndex]);

  const toggleFlag = useCallback(() => {
    setFlagged((prev) => { const n = [...prev]; n[qIndex] = !n[qIndex]; return n; });
  }, [qIndex]);

  async function finish() {
    setStatus('finished');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const duration = Math.floor((Date.now() - startedAt) / 1000);

    // Subject breakdown.
    const breakdown: Record<string, { correct: number; total: number }> = {};
    questions.forEach((qq, i) => {
      const b = breakdown[qq.subject] ?? { correct: 0, total: 0 };
      b.total += 1;
      if (answers[i] !== null && qq.question.options[answers[i]!]?.isCorrect) {
        b.correct += 1;
      }
      breakdown[qq.subject] = b;
    });

    // Add wrong answers to mistake vault.
    const vaultRows = questions
      .map((qq, i) => ({ qq, i }))
      .filter(({ qq, i }) =>
        answers[i] !== null && !qq.question.options[answers[i]!]?.isCorrect
      )
      .map(({ qq, i }) => ({
        user_id: user.id,
        category: qq.source.category,
        paper_id: qq.source.paper_id,
        question_index: qq.source.question_index,
        question_text: qq.question.text.slice(0, 500),
        subject: qq.question.subject ?? null,
        topic: qq.question.topic ?? null,
        stage: 1,
        due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        times_wrong: 1,
        last_seen_at: new Date().toISOString(),
      }));

    if (vaultRows.length > 0) {
      // Upsert in chunks to avoid payload limits.
      const CHUNK = 50;
      for (let i = 0; i < vaultRows.length; i += CHUNK) {
        await supabase.from('mistake_vault').upsert(
          vaultRows.slice(i, i + CHUNK),
          { onConflict: 'user_id,category,paper_id,question_index' }
        );
      }
    }

    await supabase.from('mock_exam_attempts').insert({
      user_id: user.id,
      exam_type: 'mdcat_simulation',
      questions: questions.map((qq, i) => ({
        category: qq.source.category,
        paper_id: qq.source.paper_id,
        question_index: qq.source.question_index,
        correct_index: qq.question.options.findIndex((o) => o.isCorrect),
        user_answer: answers[i],
      })),
      score,
      total: questions.length,
      subject_breakdown: breakdown,
      duration_seconds: duration,
      time_limit_seconds: TIME_LIMIT_SECONDS,
    });
  }

  // ─── Render ────────────────────────────────────────────────────────────
  if (sub.loading) {
    return (
      <><Navbar />
        <main className="mx-auto max-w-2xl px-5 py-20 text-center text-coal-600">Loading…</main>
      </>
    );
  }

  if (status === 'gate') {
    return (
      <><Navbar />
        <main className="mx-auto max-w-lg px-5 py-20 text-center">
          <Lock className="h-10 w-10 text-accent mx-auto mb-3" />
          <h1 className="text-3xl font-light tracking-tighter text-coal-900 mb-2">Enid+ only</h1>
          <p className="text-coal-600 mb-6">
            Full timed MDCAT simulations. 200 MCQs, 200 minutes, real exam interface,
            per-subject breakdown when you're done.
          </p>
          <Link
            href="/pricing"
            className="press inline-flex items-center gap-2 bg-accent text-coal px-5 py-2.5 font-medium hover:opacity-90 tx-color"
          >
            See Enid+ <ArrowRight className="h-4 w-4" />
          </Link>
        </main>
      </>
    );
  }

  if (status === 'intro') {
    return (
      <><Navbar />
        <main className="mx-auto max-w-2xl px-5 py-12">
          <div className="text-center mb-10">
            <Clock className="h-10 w-10 text-accent mx-auto mb-3" />
            <h1 className="text-4xl font-light tracking-tighter text-coal-900">Full timed mock exam.</h1>
            <p className="text-coal-600 mt-2">PMDC MDCAT format. 200 MCQs in 200 minutes.</p>
          </div>
          <div className="border border-coal-rule bg-coal-50 p-6 mb-8">
            <h3 className="font-medium text-coal-900 mb-3">What to expect</h3>
            <ul className="space-y-2 text-sm text-coal-700">
              {Object.entries(SUBJECT_QUOTAS).map(([subj, n]) => (
                <li key={subj} className="flex justify-between">
                  <span>{subj}</span>
                  <span className="text-coal-500">{n} MCQs</span>
                </li>
              ))}
              <li className="flex justify-between border-t border-coal-rule pt-2 mt-2 font-medium">
                <span>Total</span>
                <span>{TOTAL_MCQS} MCQs · 200 min</span>
              </li>
            </ul>
          </div>
          <div className="border border-coal-rule bg-coal-50 p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-coal-600 shrink-0 mt-0.5" />
            <p className="text-sm text-coal-700">
              Once you start, the timer doesn't pause. If you close the tab, the
              timer keeps going. Treat this like the real exam.
            </p>
          </div>
          <button
            onClick={buildExam}
            className="press w-full inline-flex items-center justify-center gap-2 bg-accent text-coal px-5 py-3 font-medium hover:opacity-90 tx-color"
          >
            Start the exam <ArrowRight className="h-4 w-4" />
          </button>
        </main>
      </>
    );
  }

  if (status === 'building') {
    return (
      <><Navbar />
        <main className="mx-auto max-w-lg px-5 py-20 text-center">
          <Sparkles className="h-8 w-8 text-accent mx-auto mb-3 animate-pulse" />
          <p className="text-coal-700">Assembling your exam…</p>
          <p className="text-xs text-coal-500 mt-1">Sampling from 2,500+ past papers</p>
        </main>
      </>
    );
  }

  if (status === 'empty') {
    return (
      <><Navbar />
        <main className="mx-auto max-w-lg px-5 py-20 text-center">
          <h1 className="text-3xl font-light tracking-tighter text-coal-900 mb-2">Could not build exam</h1>
          <p className="text-coal-600">Not enough question data available right now. Try again later.</p>
        </main>
      </>
    );
  }

  if (status === 'finished') {
    const pct = Math.round((score / questions.length) * 100);
    const breakdown: Record<string, { correct: number; total: number }> = {};
    questions.forEach((qq, i) => {
      const b = breakdown[qq.subject] ?? { correct: 0, total: 0 };
      b.total += 1;
      if (answers[i] !== null && qq.question.options[answers[i]!]?.isCorrect) b.correct += 1;
      breakdown[qq.subject] = b;
    });
    return (
      <><Navbar />
        <main className="mx-auto max-w-xl px-5 py-12">
          <div className="text-center mb-8">
            <div className="inline-grid place-items-center h-16 w-16 rounded-full bg-coal-100 border border-coal-rule mb-4">
              <Trophy className="h-7 w-7 text-accent" />
            </div>
            <h1 className="text-4xl font-light tracking-tighter text-coal-900">Exam complete.</h1>
            <p className="text-coal-600 mt-2">
              {score} / {questions.length} · <span className={pct >= 75 ? 'text-coal-900' : pct >= 50 ? 'text-coal-500' : 'text-accent'}>{pct}%</span>
            </p>
          </div>
          <div className="border border-coal-rule bg-coal-50 p-5 mb-8">
            <h3 className="font-medium text-coal-900 mb-3">By subject</h3>
            <ul className="space-y-3">
              {Object.entries(breakdown).map(([subj, b]) => {
                const p = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
                return (
                  <li key={subj}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-coal-800">{subj}</span>
                      <span className="text-coal-600">{b.correct} / {b.total} · {p}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-coal-100 overflow-hidden">
                      <div
                        className={`h-full ${
                          p >= 75 ? 'bg-coal-900' : p >= 50 ? 'bg-coal-500' : 'bg-accent'
                        }`}
                        style={{ width: `${Math.max(p, 4)}%`, transition: 'width 600ms ease' }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="text-center text-sm text-coal-600 mb-6">
            All wrong answers were added to your Mistake Vault.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/vault"
              className="press inline-flex items-center gap-2 bg-accent text-coal px-5 py-2.5 font-medium hover:opacity-90 tx-color"
            >
              Review mistakes
            </Link>
            <Link
              href="/dashboard"
              className="press inline-flex items-center border border-coal-300 px-5 py-2.5 hover:border-accent tx-color"
            >
              Dashboard
            </Link>
          </div>
        </main>
      </>
    );
  }

  // ─── Taking ────────────────────────────────────────────────────────────
  if (!q) return null;
  const correctIndex = q.question.options.findIndex((o) => o.isCorrect);
  const selected = answers[qIndex];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-6">
        {/* Top bar: timer + counters */}
        <div className="sticky top-14 z-20 -mx-5 px-5 py-3 mb-5 border-b border-coal-rule bg-coal/80 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Clock className={`h-5 w-5 ${timeLeft < 600 ? 'text-accent' : 'text-accent'}`} />
              <span className={`text-2xl ${timeLeft < 600 ? 'text-accent' : 'text-coal-900'}`}>
                {fmtMMSS(timeLeft)}
              </span>
            </div>
            <div className="text-sm text-coal-600">
              <span className="text-coal-900">{answeredCount}</span> / {questions.length} answered
            </div>
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="press text-sm bg-accent text-coal px-4 py-1.5 font-medium hover:opacity-90 tx-color"
            >
              Submit
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr,260px] gap-6">
          {/* Question card */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs uppercase tracking-widest text-accent">{q.subject}</span>
                <h2 className="text-xl text-coal-900">Q{qIndex + 1}</h2>
              </div>
              <button
                onClick={toggleFlag}
                className={`press inline-flex items-center gap-1.5 border px-3 py-1.5 text-sm tx-color ${
                  flagged[qIndex] ? 'border-accent text-accent' : 'border-coal-rule hover:border-coal-300'
                }`}
              >
                <Flag className="h-3.5 w-3.5" /> {flagged[qIndex] ? 'Flagged' : 'Flag for review'}
              </button>
            </div>

            <div className="border border-coal-rule bg-coal-50 p-6 mb-4">
              <p className="text-coal-900 leading-relaxed mb-5">{q.question.text}</p>
              <div className="space-y-2">
                {q.question.options.map((opt, i) => {
                  const isPicked = selected === i;
                  return (
                    <button
                      key={i}
                      onClick={() => pickAnswer(i)}
                      className={`press w-full text-left border px-4 py-3 flex items-start gap-3 tx-color ${
                        isPicked
                          ? 'border-accent bg-coal-50'
                          : 'border-coal-rule hover:border-coal-300'
                      }`}
                    >
                      <span className="font-mono text-sm text-coal-500 shrink-0">{LETTERS[i]}</span>
                      <span className="flex-1 text-coal-800">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setQIndex(Math.max(0, qIndex - 1))}
                disabled={qIndex === 0}
                className="press inline-flex items-center gap-1.5 border border-coal-300 px-3 py-2 text-sm hover:border-coal-400 disabled:opacity-40 disabled:cursor-not-allowed tx-color"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <button
                onClick={() => setQIndex(Math.min(questions.length - 1, qIndex + 1))}
                disabled={qIndex === questions.length - 1}
                className="press inline-flex items-center gap-1.5 bg-accent text-coal px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed tx-color"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Question grid */}
          <aside className="hidden lg:block">
            <div className="sticky top-32 border border-coal-rule bg-coal-50 p-3">
              <div className="text-xs uppercase tracking-wider text-coal-500 mb-2 px-1">Questions</div>
              <div className="grid grid-cols-6 gap-1">
                {questions.map((_, i) => {
                  const isCurr = i === qIndex;
                  const isAns = answers[i] !== null;
                  const isFlag = flagged[i];
                  return (
                    <button
                      key={i}
                      onClick={() => setQIndex(i)}
                      className={`press text-xs rounded h-7 w-full font-mono tx-color ${
                        isCurr
                          ? 'bg-accent text-coal'
                          : isAns
                          ? 'bg-coal-100 text-accent border border-coal-rule'
                          : 'border border-coal-rule text-coal-600 hover:border-coal-400'
                      } ${isFlag ? 'ring-1 ring-accent' : ''}`}
                      title={`Q${i + 1}${isFlag ? ' (flagged)' : ''}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-coal-rule space-y-1 text-xs text-coal-600">
                <Legend color="bg-accent" label="Current" />
                <Legend color="bg-coal-100 border border-coal-rule" label="Answered" />
                <Legend color="ring-1 ring-accent" label="Flagged" />
              </div>
            </div>
          </aside>
        </div>

        {/* Submit confirm */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-coal/80 backdrop-blur-sm p-5">
            <div className="w-full max-w-md border border-coal-rule bg-coal-100 p-6">
              <h3 className="text-xl text-coal-900 mb-2">Submit your exam?</h3>
              <p className="text-sm text-coal-700 mb-5">
                You've answered <strong className="text-coal-900">{answeredCount}</strong> of {questions.length} questions.
                {questions.length - answeredCount > 0 && (
                  <> {questions.length - answeredCount} will be marked as skipped.</>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="press flex-1 border border-coal-300 px-4 py-2.5 hover:border-coal-400 tx-color"
                >
                  Keep going
                </button>
                <button
                  onClick={() => { setShowSubmitConfirm(false); finish(); }}
                  className="press flex-1 bg-accent text-coal px-4 py-2.5 font-medium hover:opacity-90 tx-color"
                >
                  Yes, submit
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-3 w-3 rounded ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function fmtMMSS(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
