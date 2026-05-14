'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { INDEXES } from '@/lib/data/indexes';
import { getCategory, SUBJECT_COLORS } from '@/lib/categories';
import type { Attempt } from '@/lib/types';
import {
  Target, Clock, TrendingUp, BookOpen, Calendar, ArrowRight, Sparkles,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const root = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?next=/dashboard');
        return;
      }

      const [{ data: attemptRows }, { data: prof }] = await Promise.all([
        supabase
          .from('attempts')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(100),
        supabase.from('profiles').select('username').eq('id', user.id).single(),
      ]);

      setAttempts(attemptRows ?? []);
      setUsername(prof?.username ?? null);
      setLoading(false);
    })();
  }, [router, supabase]);

  // Roll up topic-level accuracy across all attempts
  const topicStats = useMemo(() => {
    // Build a map of paperId -> meta for quick lookup
    const paperMeta = new Map<string, { subject: string; topics: string[] }>();
    for (const idx of Object.values(INDEXES)) {
      for (const p of idx.papers ?? []) {
        paperMeta.set(p.id, { subject: p.subject ?? 'Other', topics: p.topics ?? [] });
      }
    }

    type Bucket = { correct: number; total: number; subject: string };
    const buckets = new Map<string, Bucket>();

    for (const a of attempts) {
      const meta = paperMeta.get(a.paper_id);
      if (!meta) continue;
      // We don't have per-question topic data on the client, so we attribute
      // the whole attempt's score evenly to all topics listed on the paper.
      // It's a rough heuristic but good enough for "what should I revise."
      const perTopicTotal = a.total / Math.max(meta.topics.length, 1);
      const perTopicCorrect = a.score / Math.max(meta.topics.length, 1);
      for (const t of meta.topics) {
        const b = buckets.get(t) ?? { correct: 0, total: 0, subject: meta.subject };
        b.correct += perTopicCorrect;
        b.total += perTopicTotal;
        buckets.set(t, b);
      }
    }

    return Array.from(buckets.entries())
      .map(([topic, b]) => ({
        topic,
        subject: b.subject,
        accuracy: b.total > 0 ? (b.correct / b.total) * 100 : 0,
        total: Math.round(b.total),
      }))
      .filter((t) => t.total >= 5)
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [attempts]);

  const stats = useMemo(() => {
    const totalAttempts = attempts.length;
    const totalQuestions = attempts.reduce((s, a) => s + a.total, 0);
    const totalCorrect = attempts.reduce((s, a) => s + a.score, 0);
    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const totalSeconds = attempts.reduce((s, a) => s + (a.duration_seconds || 0), 0);
    return { totalAttempts, totalQuestions, totalCorrect, accuracy, totalSeconds };
  }, [attempts]);

  useGSAP(
    () => {
      if (loading) return;
      gsap.from('.dash-stat', { y: 14, autoAlpha: 0, duration: 0.4, stagger: 0.06, ease: 'power3.out' });
      gsap.from('.dash-section', {
        y: 18, autoAlpha: 0, duration: 0.45, stagger: 0.08, ease: 'power3.out', delay: 0.15,
      });
    },
    { scope: root, dependencies: [loading] }
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-5xl px-5 py-20 text-center text-ink-400">
          Loading your dashboard…
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main ref={root} className="mx-auto max-w-5xl px-5 py-12">
        <div className="mb-10">
          <span className="text-xs uppercase tracking-widest text-meth">Dashboard</span>
          <h1 className="font-display text-4xl md:text-5xl text-paper tracking-tight mt-2">
            {username ? `Welcome back, ${username}.` : 'Welcome back.'}
          </h1>
          {attempts.length === 0 ? (
            <p className="text-ink-400 mt-2">
              No attempts yet. Practice your first paper to start building stats.
            </p>
          ) : (
            <p className="text-ink-400 mt-2">
              {stats.totalAttempts} papers attempted · {stats.totalQuestions.toLocaleString()} questions answered.
            </p>
          )}
        </div>

        {attempts.length === 0 ? (
          <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-10 text-center">
            <Sparkles className="h-8 w-8 text-meth mx-auto mb-3" />
            <p className="text-ink-300 max-w-md mx-auto mb-5">
              Once you complete a paper, you'll see your score history, weak topics,
              and revision suggestions here.
            </p>
            <Link
              href="/exams"
              className="press inline-flex items-center gap-2 rounded-md bg-meth text-ink-950 px-5 py-2.5 font-medium hover:bg-meth-300 tx-color"
            >
              Pick a paper <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
              <StatCard
                icon={<BookOpen className="h-4 w-4" />}
                label="Papers attempted"
                value={stats.totalAttempts.toString()}
              />
              <StatCard
                icon={<Target className="h-4 w-4" />}
                label="Overall accuracy"
                value={`${stats.accuracy.toFixed(0)}%`}
              />
              <StatCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Questions answered"
                value={stats.totalQuestions.toLocaleString()}
              />
              <StatCard
                icon={<Clock className="h-4 w-4" />}
                label="Time on practice"
                value={fmtDuration(stats.totalSeconds)}
              />
            </div>

            {/* Weak topics */}
            {topicStats.length > 0 && (
              <section className="dash-section mb-10">
                <h2 className="font-display text-2xl text-paper tracking-tight mb-1">
                  Topics to revise.
                </h2>
                <p className="text-sm text-ink-400 mb-5">
                  Sorted by accuracy — your lowest first. Numbers are rough estimates
                  based on whole-paper scores.
                </p>
                <div className="space-y-2">
                  {topicStats.slice(0, 6).map((t) => (
                    <div
                      key={t.topic}
                      className="flex items-center gap-4 rounded-lg border border-ink-800 bg-ink-900/40 p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-medium text-paper truncate">{t.topic}</span>
                          <span
                            className={`shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                              SUBJECT_COLORS[t.subject] ??
                              'bg-ink-800 text-ink-300 border-ink-700'
                            }`}
                          >
                            {t.subject}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-ink-900 overflow-hidden">
                          <div
                            className={`h-full ${
                              t.accuracy < 50
                                ? 'bg-crimson'
                                : t.accuracy < 75
                                ? 'bg-amber-400'
                                : 'bg-meth'
                            }`}
                            style={{
                              width: `${Math.max(t.accuracy, 4)}%`,
                              transition: 'width 600ms var(--ease-out)',
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display text-lg text-paper">
                          {t.accuracy.toFixed(0)}%
                        </div>
                        <div className="text-xs text-ink-500">
                          ~{t.total} Qs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent attempts */}
            <section className="dash-section">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-2xl text-paper tracking-tight">
                  Recent attempts.
                </h2>
                <Link
                  href="/exams"
                  className="text-sm text-meth hover:underline inline-flex items-center gap-1"
                >
                  Practice more <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <ul className="divide-y divide-ink-800 border-t border-b border-ink-800">
                {attempts.slice(0, 20).map((a) => {
                  const info = getCategory(a.category);
                  const paperMeta = INDEXES[a.category]?.papers.find((p) => p.id === a.paper_id);
                  const pct = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
                  return (
                    <li key={a.id} className="py-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/practice/${a.category}/${a.paper_id}`}
                            className="font-medium text-paper hover:text-meth tx-color truncate"
                          >
                            {paperMeta?.name ?? a.paper_id}
                          </Link>
                          {paperMeta?.subject && (
                            <span
                              className={`shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                SUBJECT_COLORS[paperMeta.subject] ??
                                'bg-ink-800 text-ink-300 border-ink-700'
                              }`}
                            >
                              {paperMeta.subject}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-ink-500 mt-1 flex items-center gap-2">
                          {info && <span>{info.name}</span>}
                          <span className="text-ink-700">·</span>
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(a.completed_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display text-lg">
                          <span
                            className={
                              pct >= 75 ? 'text-meth' : pct >= 50 ? 'text-amber-400' : 'text-crimson'
                            }
                          >
                            {a.score}
                          </span>
                          <span className="text-ink-500"> / {a.total}</span>
                        </div>
                        <div className="text-xs text-ink-500">{pct}%</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

function StatCard({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="dash-stat rounded-xl border border-ink-800 bg-ink-900/40 p-4">
      <div className="text-ink-400 inline-flex items-center gap-1.5 text-xs uppercase tracking-wider">
        {icon} {label}
      </div>
      <div className="font-display text-2xl text-paper mt-1.5">{value}</div>
    </div>
  );
}

function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
