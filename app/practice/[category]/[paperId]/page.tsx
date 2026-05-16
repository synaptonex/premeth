'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { fetchPaper } from '@/lib/data';
import { INDEXES } from '@/lib/data/indexes';
import { getCategory, SUBJECT_COLORS } from '@/lib/categories';
import type { Paper, PaperMeta } from '@/lib/types';
import QuestionImage from '@/components/QuestionImage';
import ReportModal from '@/components/ReportModal';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  ArrowLeft, ArrowRight, Check, Flag, X as XIcon, Lightbulb,
  CheckCircle2, RotateCcw, Trophy, Target, Clock,
} from 'lucide-react';

gsap.registerPlugin(useGSAP);

type Status = 'loading' | 'loaded' | 'error' | 'finished';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export default function PracticePage() {
  const params = useParams<{ category: string; paperId: string }>();
  const router = useRouter();
  const category = params?.category as string;
  const paperId = params?.paperId as string;

  const [status, setStatus] = useState<Status>('loading');
  const [paper, setPaper] = useState<Paper | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState<boolean[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [startedAt] = useState(() => Date.now());

  const meta: PaperMeta | undefined = useMemo(() => {
    return INDEXES[category]?.papers.find((p) => p.id === paperId);
  }, [category, paperId]);
  const categoryInfo = useMemo(() => getCategory(category), [category]);

  // Load the paper from Supabase Storage on mount.
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchPaper(category, paperId).then((data) => {
      if (cancelled) return;
      if (!data || !data.questions?.length) {
        setStatus('error');
        return;
      }
      setPaper(data);
      setAnswers(new Array(data.questions.length).fill(null));
      setSubmitted(new Array(data.questions.length).fill(false));
      setStatus('loaded');
    });
    return () => { cancelled = true; };
  }, [category, paperId]);

  const total = paper?.questions.length ?? 0;
  const q = paper?.questions[qIndex];
  const isSubmitted = submitted[qIndex];
  const selected = answers[qIndex];
  const correctIndex = useMemo(() => {
    if (!q) return -1;
    return q.options.findIndex((o) => o.isCorrect);
  }, [q]);
  const score = useMemo(() => {
    if (!paper) return 0;
    return paper.questions.reduce((s, qq, i) => {
      const a = answers[i];
      if (a === null) return s;
      return qq.options[a]?.isCorrect ? s + 1 : s;
    }, 0);
  }, [paper, answers]);
  const answeredCount = answers.filter((a) => a !== null).length;
  const progressPct = total > 0 ? (answeredCount / total) * 100 : 0;

  // Pick an answer (does not submit yet)
  const pickAnswer = useCallback(
    (idx: number) => {
      if (submitted[qIndex]) return;
      setAnswers((prev) => {
        const next = [...prev];
        next[qIndex] = idx;
        return next;
      });
    },
    [qIndex, submitted]
  );

  // Lock in the answer + reveal explanation
  const submitAnswer = useCallback(() => {
    if (answers[qIndex] === null || submitted[qIndex]) return;
    setSubmitted((prev) => {
      const next = [...prev];
      next[qIndex] = true;
      return next;
    });
    setShowExplain(true);
  }, [answers, qIndex, submitted]);

  const goNext = useCallback(() => {
    setShowExplain(false);
    if (qIndex < total - 1) {
      setQIndex((i) => i + 1);
    }
  }, [qIndex, total]);

  const goPrev = useCallback(() => {
    setShowExplain(false);
    if (qIndex > 0) setQIndex((i) => i - 1);
  }, [qIndex]);

  // Finish + save attempt
  const finish = useCallback(async () => {
    const duration = Math.floor((Date.now() - startedAt) / 1000);
    setStatus('finished');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !paper) return;

    const correctAnswers = paper.questions.map((qq) =>
      qq.options.findIndex((o) => o.isCorrect)
    );

    const { error } = await supabase.from('attempts').insert({
      user_id: user.id,
      category,
      paper_id: paperId,
      score,
      total,
      correct_answers: correctAnswers,
      user_answers: answers.map((a) => (a === null ? -1 : a)),
      duration_seconds: duration,
    });

    if (error) {
      toast.error('Could not save your attempt', { description: error.message });
      return;
    }

    toast.success('Attempt saved to your dashboard');

    // ─── Enid+ : auto-add wrong answers to the Mistake Vault ─────────────
    // Check if this user has an active subscription. If they do, every
    // question they got wrong gets upserted into the vault so it shows up in
    // their spaced-repetition queue. Free users skip this entirely.
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('current_period_end, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .maybeSingle();

    if (!sub) return; // free user, nothing more to do

    const vaultRows = paper.questions
      .map((qq, i) => ({ qq, i }))
      .filter(({ qq, i }) => {
        const a = answers[i];
        if (a === null) return false;
        return !qq.options[a]?.isCorrect;
      })
      .map(({ qq, i }) => ({
        user_id: user.id,
        category,
        paper_id: paperId,
        question_index: i,
        question_text: qq.text.slice(0, 500),
        subject: (qq as { subject?: string }).subject ?? null,
        topic: (qq as { topic?: string }).topic ?? null,
        stage: 1,
        due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        times_wrong: 1,
        last_seen_at: new Date().toISOString(),
      }));

    if (vaultRows.length === 0) return;

    // Upsert in chunks to stay under Supabase payload limits. On conflict,
    // ignoreDuplicates keeps the existing spaced-repetition stage intact
    // (we don't want a re-attempt to wipe out review progress).
    const CHUNK = 50;
    for (let i = 0; i < vaultRows.length; i += CHUNK) {
      await supabase.from('mistake_vault').upsert(
        vaultRows.slice(i, i + CHUNK),
        {
          onConflict: 'user_id,category,paper_id,question_index',
          ignoreDuplicates: true,
        }
      );
    }

    toast.success(
      `${vaultRows.length} mistake${vaultRows.length > 1 ? 's' : ''} added to your vault`
    );
  }, [answers, category, paper, paperId, score, startedAt, total]);

  // Keyboard shortcuts: A/B/C/D to pick, Enter to submit, ← → to navigate, R for report
  useEffect(() => {
    if (status !== 'loaded') return;
    const onKey = (e: KeyboardEvent) => {
      if (reportOpen) return;
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      const key = e.key.toUpperCase();
      const letterIdx = LETTERS.indexOf(key as typeof LETTERS[number]);
      if (letterIdx !== -1 && q && letterIdx < q.options.length) {
        e.preventDefault();
        pickAnswer(letterIdx);
        return;
      }
      if (e.key === 'Enter') { e.preventDefault(); if (!isSubmitted) submitAnswer(); else if (qIndex < total - 1) goNext(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goPrev(); }
      if (key === 'F')            { e.preventDefault(); setReportOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status, reportOpen, q, isSubmitted, pickAnswer, submitAnswer, goNext, goPrev, qIndex, total]);

  // Smooth scroll to top on question change
  const questionCardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    questionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [qIndex]);

  // GSAP: animate question card swap. Keep this restrained - Emil rule:
  // questions are seen many times per session, so the animation must be fast
  // (under 200ms) and never block input.
  useGSAP(
    () => {
      gsap.fromTo(
        '.question-card',
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.18, ease: 'power2.out' }
      );
    },
    { dependencies: [qIndex], scope: questionCardRef }
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-5 py-20 text-center">
          <div className="inline-flex items-center gap-3 text-coal-600">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span>Loading paper…</span>
          </div>
        </main>
      </>
    );
  }

  if (status === 'error') {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-5 py-20 text-center">
          <h1 className="font-display text-3xl text-coal-900 mb-3">Paper not available</h1>
          <p className="text-coal-600 mb-6">
            This paper hasn't been uploaded to storage yet, or the data is malformed.
            Try another paper or report this to the maintainers.
          </p>
          <Link
            href={`/papers/${category}`}
            className="press inline-flex items-center gap-2 rounded-md bg-accent text-coal px-5 py-2.5 font-medium hover:bg-accent/90 tx-color"
          >
            <ArrowLeft className="h-4 w-4" /> Back to papers
          </Link>
        </main>
      </>
    );
  }

  if (status === 'finished' && paper) {
    const correctCount = score;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const duration = Math.floor((Date.now() - startedAt) / 1000);
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-5 py-16">
          <div className="text-center mb-10">
            <div className="inline-grid place-items-center h-16 w-16 rounded-full bg-accent/15 border border-accent/30 mb-4">
              <Trophy className="h-7 w-7 text-accent" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-coal-900 tracking-tight">
              Paper complete.
            </h1>
            <p className="text-coal-600 mt-2">{meta?.name}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <Stat icon={<Target className="h-4 w-4" />} label="Score" value={`${correctCount} / ${total}`} />
            <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Accuracy" value={`${pct}%`} />
            <Stat icon={<Clock className="h-4 w-4" />} label="Time" value={fmt(duration)} />
          </div>

          <div className="space-y-2 max-h-96 overflow-auto rounded-md border border-coal-rule p-2 mb-8">
            {paper.questions.map((qq, i) => {
              const a = answers[i];
              const correct = a !== null && qq.options[a]?.isCorrect;
              return (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 text-sm">
                  <span className="text-coal-500 w-8">Q{i + 1}</span>
                  {a === null ? (
                    <span className="text-coal-500 text-xs">Skipped</span>
                  ) : correct ? (
                    <span className="text-accent flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Correct
                    </span>
                  ) : (
                    <span className="text-crimson flex items-center gap-1">
                      <XIcon className="h-3.5 w-3.5" /> Incorrect
                    </span>
                  )}
                  <span className="text-coal-600 truncate">{qq.text.slice(0, 80)}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => {
                setQIndex(0);
                setAnswers(new Array(total).fill(null));
                setSubmitted(new Array(total).fill(false));
                setStatus('loaded');
                setShowExplain(false);
              }}
              className="press inline-flex items-center gap-2 rounded-md border border-coal-rule px-4 py-2 text-coal-900 hover:border-accent/50 tx-color"
            >
              <RotateCcw className="h-4 w-4" /> Retry this paper
            </button>
            <Link
              href={`/papers/${category}`}
              className="press inline-flex items-center gap-2 rounded-md bg-accent text-coal px-4 py-2 font-medium hover:bg-accent/90 tx-color"
            >
              Pick another paper
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (!paper || !q) return null;

  return (
    <>
      <Navbar />

      {/* Top bar with progress + paper meta */}
      <div className="sticky top-14 z-20 border-b border-coal-rule bg-coal/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-5 py-2.5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <Link
              href={`/papers/${category}`}
              className="inline-flex items-center gap-1.5 text-xs text-coal-600 hover:text-accent tx-color"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {meta?.name ?? 'Papers'}
            </Link>
            <div className="flex items-center gap-3 text-xs text-coal-500">
              <span>
                Q <span className="text-coal-900 font-medium">{qIndex + 1}</span> / {total}
              </span>
              <span className="text-coal-400">·</span>
              <span>
                Score: <span className="text-accent font-medium">{score}</span>
              </span>
              <button
                onClick={finish}
                className="press text-xs px-2.5 py-1 rounded border border-coal-rule hover:border-crimson hover:text-crimson tx-color"
              >
                Finish
              </button>
            </div>
          </div>
          <div className="h-1 rounded-full bg-coal-50 overflow-hidden">
            <div
              className="h-full bg-accent"
              style={{
                width: `${progressPct}%`,
                transition: 'width 320ms var(--ease-out)',
              }}
            />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5 py-8 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8">
        <div ref={questionCardRef} className="min-w-0">
          <div className="question-card">
            {/* Subject + topic + report */}
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                    SUBJECT_COLORS[q.subject] ??
                    'bg-coal-200 text-coal-700 border-coal-rule'
                  }`}
                >
                  {q.subject}
                </span>
                {q.topic && (
                  <span className="text-xs text-coal-500">{q.topic}</span>
                )}
                {q.year && (
                  <span className="text-xs text-coal-500">· {q.year}</span>
                )}
              </div>
              <button
                onClick={() => setReportOpen(true)}
                className="press inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-coal-rule text-coal-600 hover:text-crimson hover:border-crimson/40 tx-color"
                title="Report this question (F)"
              >
                <Flag className="h-3.5 w-3.5" />
                Report
              </button>
            </div>

            {/* Question text */}
            <h2 className="font-display text-2xl md:text-3xl text-coal-900 leading-snug">
              {q.text}
            </h2>

            {/* Diagram */}
            {q.image && (
              <div className="mt-5">
                <QuestionImage src={q.image} alt="Question diagram" />
              </div>
            )}

            {/* Hints */}
            {q.hints?.length > 0 && (
              <details className="mt-4 group">
                <summary className="cursor-pointer text-xs text-accent inline-flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Show hint{q.hints.length > 1 ? 's' : ''}
                </summary>
                <ul className="mt-2 space-y-1 text-sm text-coal-700 pl-5 list-disc">
                  {q.hints.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </details>
            )}

            {/* Options */}
            <div className="mt-6 space-y-2">
              {q.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = opt.isCorrect;
                const showResult = isSubmitted;

                let stateCls =
                  'border-coal-rule bg-coal-50/40 hover:border-coal-rule hover:bg-coal-50/60';
                let badgeCls = 'border-coal-rule text-coal-700';
                if (showResult) {
                  if (isCorrect) {
                    stateCls = 'border-accent/40 bg-accent/10 text-coal-900';
                    badgeCls = 'border-accent/40 bg-accent/15 text-accent';
                  } else if (isSelected) {
                    stateCls = 'border-crimson/40 bg-crimson/10 text-coal-900';
                    badgeCls = 'border-crimson/40 bg-crimson/15 text-crimson';
                  }
                } else if (isSelected) {
                  stateCls = 'border-accent/40 bg-accent/5 text-coal-900';
                  badgeCls = 'border-accent/50 bg-accent/15 text-accent';
                }

                return (
                  <button
                    key={i}
                    onClick={() => pickAnswer(i)}
                    disabled={isSubmitted}
                    className={`press w-full text-left rounded-lg border p-4 tx-color flex items-start gap-3 ${stateCls} disabled:cursor-default`}
                    style={{
                      transition: 'background-color 160ms var(--ease-out), border-color 160ms var(--ease-out), transform 120ms var(--ease-out)',
                    }}
                  >
                    <span
                      className={`h-7 w-7 shrink-0 inline-grid place-items-center rounded-md border text-xs font-medium tx-color ${badgeCls}`}
                    >
                      {showResult && isCorrect ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : showResult && isSelected && !isCorrect ? (
                        <XIcon className="h-3.5 w-3.5" />
                      ) : (
                        opt.letter || LETTERS[i]
                      )}
                    </span>
                    <span className="text-base leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Submit / Next buttons */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={goPrev}
                disabled={qIndex === 0}
                className="press inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-coal-rule text-coal-700 hover:text-coal-900 hover:border-coal-rule disabled:opacity-40 disabled:cursor-not-allowed tx-color"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>

              {!isSubmitted ? (
                <button
                  onClick={submitAnswer}
                  disabled={selected === null}
                  className="press inline-flex items-center gap-2 text-sm px-5 py-2 rounded-md bg-accent text-coal font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 tx-color"
                >
                  Check answer
                  <span className="text-[10px] px-1 py-0.5 rounded bg-coal/30 hidden sm:inline">↵</span>
                </button>
              ) : qIndex < total - 1 ? (
                <button
                  onClick={goNext}
                  className="press inline-flex items-center gap-1.5 text-sm px-5 py-2 rounded-md bg-accent text-coal font-medium hover:bg-accent/90 tx-color"
                >
                  Next question
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={finish}
                  className="press inline-flex items-center gap-2 text-sm px-5 py-2 rounded-md bg-accent text-coal font-medium hover:bg-accent/90 tx-color"
                >
                  <Trophy className="h-4 w-4" />
                  Finish paper
                </button>
              )}
            </div>

            {/* Explanation card */}
            {isSubmitted && showExplain && (
              <div
                className="mt-6 bg-paper rounded-xl p-6 animate-fade-up"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs uppercase tracking-widest text-coal-500">
                    Explanation
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {selected !== null && q.options[selected]?.isCorrect ? (
                      <span className="text-accent inline-flex items-center gap-1">
                        <Check className="h-4 w-4" /> Correct
                      </span>
                    ) : (
                      <span className="text-crimson inline-flex items-center gap-1">
                        <XIcon className="h-4 w-4" />
                        Incorrect. The correct answer was{' '}
                        {q.options[correctIndex]?.letter ?? LETTERS[correctIndex]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="font-display text-coal-900 text-lg leading-relaxed">
                  {q.explanation || 'No explanation provided for this question.'}
                </div>
                {q.explanationImage && (
                  <div className="mt-4">
                    <QuestionImage
                      src={q.explanationImage}
                      alt="Explanation diagram"
                      className="border-coal-rule"
                    />
                  </div>
                )}
                {/* Per-option breakdown if any options have explanations */}
                {q.options.some((o) => o.explanation) && (
                  <div className="mt-5 pt-5 border-t border-coal-rule">
                    <div className="text-xs uppercase tracking-widest text-coal-500 mb-3">
                      Why each option
                    </div>
                    <div className="space-y-2">
                      {q.options.map((o, i) =>
                        o.explanation ? (
                          <div key={i} className="text-sm text-coal-300 flex gap-3">
                            <span
                              className={`shrink-0 inline-grid place-items-center h-5 w-5 rounded text-[11px] font-medium ${
                                o.isCorrect
                                  ? 'bg-accent text-coal-900'
                                  : 'bg-coal-800 text-coal-400'
                              }`}
                            >
                              {o.letter || LETTERS[i]}
                            </span>
                            <span>{o.explanation}</span>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar question grid */}
        <aside className="lg:sticky lg:top-32 lg:self-start space-y-3">
          <div className="text-xs uppercase tracking-widest text-coal-500">
            Questions
          </div>
          <div className="grid grid-cols-8 lg:grid-cols-5 gap-1.5">
            {paper.questions.map((_, i) => {
              const a = answers[i];
              const sub = submitted[i];
              const correct = a !== null && paper.questions[i].options[a]?.isCorrect;
              const cls = sub
                ? correct
                  ? 'bg-accent/15 text-accent border-accent/40'
                  : 'bg-crimson/15 text-crimson border-crimson/40'
                : a !== null
                ? 'bg-accent/5 text-coal-900 border-accent/30'
                : 'bg-coal-50/40 text-coal-600 border-coal-rule hover:border-coal-rule';
              return (
                <button
                  key={i}
                  onClick={() => {
                    setShowExplain(submitted[i]);
                    setQIndex(i);
                  }}
                  className={`press text-[11px] font-medium h-8 rounded border tx-color ${
                    i === qIndex ? 'ring-1 ring-accent ring-offset-1 ring-offset-coal' : ''
                  } ${cls}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:block mt-5 text-xs text-coal-500 space-y-1.5 leading-relaxed">
            <div className="text-coal-600 font-medium mb-2">Keyboard</div>
            <div><kbd className="kbd">A</kbd>–<kbd className="kbd">D</kbd> pick answer</div>
            <div><kbd className="kbd">↵</kbd> submit / next</div>
            <div><kbd className="kbd">→</kbd> <kbd className="kbd">←</kbd> nav</div>
            <div><kbd className="kbd">F</kbd> flag question</div>
          </div>
        </aside>
      </main>

      {q && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          category={category}
          paperId={paperId}
          questionIndex={qIndex}
          questionText={q.text}
        />
      )}
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-coal-rule bg-coal-50/40 p-4">
      <div className="text-coal-600 inline-flex items-center gap-1.5 text-xs uppercase tracking-wider">
        {icon} {label}
      </div>
      <div className="font-display text-2xl text-coal-900 mt-1">{value}</div>
    </div>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}
