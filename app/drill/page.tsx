'use client';

// app/drill/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Adaptive Daily Drill (Enid+).
//
// On open:
//   1. Compute the user's weakest topics from past attempts (same calc as
//      dashboard).
//   2. For each of the top 5 weakest topics, pull 6 questions from papers
//      tagged with that topic. Fetch the papers, randomly pick from the
//      matching questions. Total target: 30 MCQs.
//   3. Drop them into a practice flow exactly like the existing paper view,
//      but save the result to mock_exam_attempts (so it doesn't pollute the
//      past-paper attempts list).
//
// If the user has < 5 attempts (cold start), we fall back to "newest user,
// random sampling across all subjects" so the page works on day 1.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';
import { useEnidPlus } from '@/lib/enid-plus.client';
import { INDEXES } from '@/lib/data/indexes';
import { fetchPaper } from '@/lib/data';
import type { Question } from '@/lib/types';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, X as XIcon, Lightbulb, Sparkles, Target,
  Trophy, RotateCcw, Flag,
} from 'lucide-react';
import ReportModal from '@/components/ReportModal';

const DRILL_SIZE = 30;
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

interface DrillQuestion {
  question: Question;
  source: { category: string; paper_id: string; question_index: number };
  topic: string;
}

type Status = 'gate' | 'limit' | 'building' | 'ready' | 'finished' | 'empty';

export default function DrillPage() {
  const supabase = createClient();
  const sub = useEnidPlus();

  const [status, setStatus] = useState<Status>('gate');
  const [questions, setQuestions] = useState<DrillQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState<boolean[]>([]);
  const [startedAt] = useState(() => Date.now());
  const [showExplain, setShowExplain] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // ─── Gate ──────────────────────────────────────────────────────────────
  // Enid+ subscribers get unlimited drills. Free users get one per calendar
  // day — enough to build the habit, capped enough to leave a reason to
  // upgrade. The cap is tracked by profiles.last_free_drill.
  const [freeDrill, setFreeDrill] = useState(false);

  useEffect(() => {
    if (sub.loading) return;
    (async () => {
      if (sub.isActive) {
        setFreeDrill(false);
        setStatus('building');
        buildDrill();
        return;
      }
      // Free user — check whether they've used today's drill.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus('gate');
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_free_drill')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.last_free_drill === today) {
        setStatus('limit');
        return;
      }
      setFreeDrill(true);
      setStatus('building');
      buildDrill();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub.loading, sub.isActive]);

  async function buildDrill() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // ─── Compute weakest topics ─────────────────────────────────────────
    const { data: attempts } = await supabase
      .from('attempts')
      .select('category, paper_id, score, total')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(100);

    // Build paperId -> topics map.
    const paperTopics = new Map<string, string[]>();
    for (const idx of Object.values(INDEXES)) {
      for (const p of idx.papers ?? []) {
        paperTopics.set(p.id, p.topics ?? []);
      }
    }

    // Tally per-topic accuracy.
    const bucket = new Map<string, { correct: number; total: number }>();
    for (const a of attempts ?? []) {
      const topics = paperTopics.get(a.paper_id) ?? [];
      if (topics.length === 0) continue;
      const perCorrect = a.score / topics.length;
      const perTotal = a.total / topics.length;
      for (const t of topics) {
        const b = bucket.get(t) ?? { correct: 0, total: 0 };
        b.correct += perCorrect;
        b.total += perTotal;
        bucket.set(t, b);
      }
    }

    // Bottom topics with at least 5 questions of signal.
    const weakest = Array.from(bucket.entries())
      .map(([topic, b]) => ({
        topic,
        accuracy: b.total > 0 ? b.correct / b.total : 0,
        total: b.total,
      }))
      .filter((t) => t.total >= 5)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5)
      .map((t) => t.topic);

    // ─── Find papers tagged with those topics ────────────────────────────
    type Candidate = { category: string; paper_id: string; topics: string[] };
    const candidates: Candidate[] = [];

    if (weakest.length > 0) {
      for (const [cat, idx] of Object.entries(INDEXES)) {
        for (const p of idx.papers ?? []) {
          const overlap = (p.topics ?? []).some((t) => weakest.includes(t));
          if (overlap) {
            candidates.push({ category: cat, paper_id: p.id, topics: p.topics ?? [] });
          }
        }
      }
    } else {
      // Cold start - random subject drills.
      const subjectCats = [
        'subject_biology', 'subject_chemistry', 'subject_physics', 'subject_english',
      ];
      for (const cat of subjectCats) {
        for (const p of INDEXES[cat]?.papers ?? []) {
          candidates.push({ category: cat, paper_id: p.id, topics: p.topics ?? [] });
        }
      }
    }

    if (candidates.length === 0) {
      setStatus('empty');
      return;
    }

    // ─── Sample papers, fetch them, pick questions ───────────────────────
    // We sample ceil(30/4)+2 = ~10 papers to get enough variety.
    const sampled = shuffle(candidates).slice(0, 12);
    const drillQs: DrillQuestion[] = [];

    for (const c of sampled) {
      if (drillQs.length >= DRILL_SIZE) break;
      const paper = await fetchPaper(c.category, c.paper_id);
      if (!paper) continue;

      // Pick up to 4 random questions per paper, preferring ones whose `.topic`
      // matches one of our weak topics.
      const indexed = paper.questions.map((q, i) => ({ q, i }));
      const matching = weakest.length
        ? indexed.filter(({ q }) => weakest.includes(q.topic))
        : indexed;
      const pool = matching.length >= 4 ? matching : indexed;
      const picks = shuffle(pool).slice(0, 4);
      for (const { q, i } of picks) {
        if (drillQs.length >= DRILL_SIZE) break;
        drillQs.push({
          question: q,
          source: { category: c.category, paper_id: c.paper_id, question_index: i },
          topic: q.topic ?? 'General',
        });
      }
    }

    if (drillQs.length === 0) {
      setStatus('empty');
      return;
    }

    setQuestions(drillQs);
    setAnswers(new Array(drillQs.length).fill(null));
    setSubmitted(new Array(drillQs.length).fill(false));
    setStatus('ready');

    // Free user just spent today's drill — record the date so the gate
    // catches them tomorrow. Plus users skip this.
    if (freeDrill) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ last_free_drill: new Date().toISOString().slice(0, 10) })
          .eq('id', user.id);
      }
    }
  }

  const q = questions[qIndex];
  const correctIndex = useMemo(
    () => q?.question.options.findIndex((o) => o.isCorrect) ?? -1,
    [q]
  );
  const score = useMemo(
    () =>
      questions.reduce((s, qq, i) => {
        const a = answers[i];
        if (a === null) return s;
        return qq.question.options[a]?.isCorrect ? s + 1 : s;
      }, 0),
    [questions, answers]
  );

  const pickAnswer = useCallback((idx: number) => {
    if (submitted[qIndex]) return;
    setAnswers((prev) => { const n = [...prev]; n[qIndex] = idx; return n; });
  }, [qIndex, submitted]);

  const submitAnswer = useCallback(async () => {
    if (answers[qIndex] === null || submitted[qIndex]) return;
    setSubmitted((prev) => { const n = [...prev]; n[qIndex] = true; return n; });
    setShowExplain(true);

    // If wrong, add to mistake vault.
    const selected = answers[qIndex];
    const wasCorrect = q?.question.options[selected!]?.isCorrect;
    if (!wasCorrect && q) {
      await addToVault(q);
    }
  }, [answers, qIndex, submitted, q]);

  async function addToVault(item: DrillQuestion) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('mistake_vault').upsert(
      {
        user_id: user.id,
        category: item.source.category,
        paper_id: item.source.paper_id,
        question_index: item.source.question_index,
        question_text: item.question.text.slice(0, 500),
        subject: item.question.subject ?? null,
        topic: item.question.topic ?? null,
        stage: 1,
        due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        times_wrong: 1,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,category,paper_id,question_index' }
    );
  }

  const goNext = useCallback(() => {
    setShowExplain(false);
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      finish();
    }
  }, [qIndex, questions.length]);

  async function finish() {
    setStatus('finished');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const duration = Math.floor((Date.now() - startedAt) / 1000);

    // Build subject breakdown.
    const breakdown: Record<string, { correct: number; total: number }> = {};
    questions.forEach((qq, i) => {
      const subj = qq.question.subject ?? 'Other';
      const b = breakdown[subj] ?? { correct: 0, total: 0 };
      b.total += 1;
      if (answers[i] !== null && qq.question.options[answers[i]!]?.isCorrect) {
        b.correct += 1;
      }
      breakdown[subj] = b;
    });

    await supabase.from('mock_exam_attempts').insert({
      user_id: user.id,
      exam_type: 'daily_drill',
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
      time_limit_seconds: 0, // untimed
    });
  }

  // ─── Render ────────────────────────────────────────────────────────────
  if (sub.loading || status === 'building') {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-5 py-20 text-center text-coal-600">
          <Sparkles className="h-8 w-8 text-accent mx-auto mb-3 animate-pulse" />
          Building today's drill from your weak topics…
        </main>
      </>
    );
  }

  // Logged-out users land here. The free drill needs an account so the
  // one-per-day limit can be tracked, so this invites a sign-up.
  if (status === 'gate') {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-lg px-5 py-20 text-center">
          <Target className="h-10 w-10 text-accent mx-auto mb-3" />
          <h1 className="text-3xl font-light tracking-tighter text-coal-900 mb-2">
            One free drill a day
          </h1>
          <p className="text-coal-600 mb-6">
            The Adaptive Daily Drill picks 30 MCQs from your weakest chapters.
            Create a free account to start one. Enid+ removes the daily limit.
          </p>
          <div className="flex items-center justify-center gap-x-6 gap-y-3 flex-wrap">
            <Link
              href="/signup"
              className="press inline-flex items-center gap-2 bg-accent text-coal px-5 py-2.5 font-medium hover:opacity-90 tx-color"
            >
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="link-draw text-coal-600 hover:text-coal-900 tx-color"
            >
              See Enid+
            </Link>
          </div>
        </main>
      </>
    );
  }

  // Free user who already drilled today.
  if (status === 'limit') {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-lg px-5 py-20 text-center">
          <Check className="h-10 w-10 text-accent mx-auto mb-3" />
          <h1 className="text-3xl font-light tracking-tighter text-coal-900 mb-2">
            That is today&apos;s drill done
          </h1>
          <p className="text-coal-600 mb-6">
            Free accounts get one Adaptive Daily Drill a day. Come back
            tomorrow for a fresh set, or upgrade to Enid+ and drill as much as
            you want, whenever you want.
          </p>
          <div className="flex items-center justify-center gap-x-6 gap-y-3 flex-wrap">
            <Link
              href="/pricing"
              className="press inline-flex items-center gap-2 bg-accent text-coal px-5 py-2.5 font-medium hover:opacity-90 tx-color"
            >
              Drill without limits <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/exams"
              className="link-draw text-coal-600 hover:text-coal-900 tx-color"
            >
              Practice past papers instead
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (status === 'empty') {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-lg px-5 py-20 text-center">
          <h1 className="text-3xl font-light tracking-tighter text-coal-900 mb-2">Drill couldn't be built</h1>
          <p className="text-coal-600 mb-6">
            We couldn't find enough questions matching your weak topics. Practice
            a few more papers and try again tomorrow.
          </p>
          <Link
            href="/exams"
            className="press inline-flex items-center gap-2 bg-accent text-coal px-5 py-2.5 font-medium hover:opacity-90 tx-color"
          >
            Browse papers
          </Link>
        </main>
      </>
    );
  }

  if (status === 'finished') {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-xl px-5 py-16">
          <div className="text-center mb-8">
            <div className="inline-grid place-items-center h-16 w-16 rounded-full bg-coal-100 border border-coal-rule mb-4">
              <Trophy className="h-7 w-7 text-accent" />
            </div>
            <h1 className="text-4xl font-light tracking-tighter text-coal-900">Drill complete.</h1>
            <p className="text-coal-600 mt-2">
              {score} / {questions.length} · {pct}%
            </p>
          </div>
          <p className="text-center text-sm text-coal-600 mb-6">
            Every wrong answer was added to your Mistake Vault for spaced
            repetition. We'll re-test you on those in 1 day.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/vault"
              className="press inline-flex items-center gap-2 bg-accent text-coal px-5 py-2.5 font-medium hover:opacity-90 tx-color"
            >
              Open Mistake Vault <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="press inline-flex items-center border border-coal-300 px-5 py-2.5 hover:border-accent tx-color"
            >
              Back to dashboard
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (!q) return null;
  const isSubmitted = submitted[qIndex];
  const selected = answers[qIndex];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-xs uppercase tracking-widest text-accent">Daily Drill</span>
            <h1 className="text-2xl text-coal-900">
              Q{qIndex + 1} <span className="text-coal-500">/ {questions.length}</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-coal-500">Topic</div>
              <div className="text-sm text-coal-800 truncate max-w-[12rem]">{q.topic}</div>
            </div>
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

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-coal-100 mb-6 overflow-hidden">
          <div
            className="h-full bg-coal-900 transition-all duration-200"
            style={{ width: `${((qIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question card */}
        <div className="border border-coal-rule bg-coal-50 p-6 mb-4">
          <p className="text-coal-900 leading-relaxed mb-5">{q.question.text}</p>
          <div className="space-y-2">
            {q.question.options.map((opt, i) => {
              const isCorrect = i === correctIndex;
              const isPicked = selected === i;
              const reveal = isSubmitted;
              return (
                <button
                  key={i}
                  onClick={() => pickAnswer(i)}
                  disabled={isSubmitted}
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
                  {reveal && isCorrect && <Check className="h-4 w-4 text-accent shrink-0" />}
                  {reveal && isPicked && !isCorrect && <XIcon className="h-4 w-4 text-crimson shrink-0" />}
                </button>
              );
            })}
          </div>

          {showExplain && (q.question.explanation || q.question.options[correctIndex]?.explanation) && (
            <div className="mt-5 border border-coal-rule bg-coal/80 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent mb-2">
                <Lightbulb className="h-3.5 w-3.5" /> Explanation
              </div>
              <p className="text-sm text-coal-900 leading-relaxed">
                {q.question.explanation || q.question.options[correctIndex]?.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-coal-500">
            Score so far: <span className="text-coal-900">{score}</span> / {qIndex + 1}
          </div>
          {!isSubmitted ? (
            <button
              onClick={submitAnswer}
              disabled={selected === null}
              className="press inline-flex items-center gap-2 bg-accent text-coal px-5 py-2.5 font-medium hover:opacity-90 tx-color disabled:opacity-50"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={goNext}
              className="press inline-flex items-center gap-2 bg-accent text-coal px-5 py-2.5 font-medium hover:opacity-90 tx-color"
            >
              {qIndex < questions.length - 1 ? 'Next' : 'Finish drill'}{' '}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </main>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        category={q.source.category}
        paperId={q.source.paper_id}
        questionIndex={q.source.question_index}
        questionText={q.question.text}
      />
    </>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
