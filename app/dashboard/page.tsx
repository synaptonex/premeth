'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { INDEXES } from '@/lib/data/indexes';
import { getCategory } from '@/lib/categories';
import { useEnidPlus } from '@/lib/enid-plus.client';
import { computeStreak } from '@/lib/streaks';
import type { Attempt } from '@/lib/types';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const root = useRef<HTMLDivElement>(null);
  const { isPlus } = useEnidPlus();

  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [vaultCounts, setVaultCounts] = useState({ due: 0, total: 0 });
  const [streak, setStreak] = useState({ current: 0, longest: 0, target: 20, activeToday: false });
  const [mockCount, setMockCount] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?next=/dashboard');
        return;
      }

      const [
        { data: attemptRows },
        { data: prof },
      ] = await Promise.all([
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

      // Streaks are free, retention belongs to everyone. Compute for all
      // logged-in users.
      const streakRes = await computeStreak(supabase, user.id);
      setStreak({
        current: streakRes.current_streak,
        longest: streakRes.longest_streak,
        target: streakRes.target,
        activeToday: streakRes.active_today,
      });

      if (isPlus) {
        const now = new Date().toISOString();
        const [
          { count: dueCount },
          { count: vaultTotal },
          { count: mocks },
        ] = await Promise.all([
          supabase
            .from('mistake_vault')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .lte('due_at', now)
            .lt('stage', 6),
          supabase
            .from('mistake_vault')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('mock_exam_attempts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('exam_type', 'mdcat_simulation'),
        ]);

        setVaultCounts({ due: dueCount ?? 0, total: vaultTotal ?? 0 });
        setMockCount(mocks ?? 0);
      }

      setLoading(false);
    })();
  }, [router, supabase, isPlus]);

  const topicStats = useMemo(() => {
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
      gsap.from('.dash-anim', {
        y: 8, autoAlpha: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out',
      });
    },
    { scope: root, dependencies: [loading] }
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-6xl px-6 md:px-10 py-24 text-coal-500">
          Loading…
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main ref={root} className="mx-auto max-w-6xl px-6 md:px-10 py-16 md:py-24">
        {/* Header */}
        <div className="grid grid-cols-12 gap-6 mb-20">
          <div className="hidden md:block col-span-1 marginalia pt-1">
            01 / You
          </div>
          <div className="col-span-12 md:col-span-11">
            <p className="dash-anim marginalia mb-4">
              {isPlus ? (
                <>Enid<span className="text-accent">+</span> subscriber</>
              ) : (
                'Dashboard'
              )}
            </p>
            <h1 className="dash-anim text-5xl md:text-6xl font-light tracking-tighter text-coal-900">
              {username ? `Welcome back, ${username}.` : 'Welcome back.'}
            </h1>
            {attempts.length > 0 && (
              <p className="dash-anim mt-6 text-coal-600 text-lg">
                {stats.totalAttempts} papers attempted ·{' '}
                {stats.totalQuestions.toLocaleString()} questions answered ·{' '}
                {stats.accuracy.toFixed(0)}% accuracy
              </p>
            )}
          </div>
        </div>

        {/* Empty state */}
        {attempts.length === 0 && (
          <div className="grid grid-cols-12 gap-6">
            <div className="hidden md:block col-span-1" />
            <div className="col-span-12 md:col-span-11">
              <p className="text-coal-600 text-lg max-w-xl mb-8">
                You have not attempted any papers yet. Once you complete one,
                this dashboard fills in with stats, weak topics, and revision
                suggestions.
              </p>
              <Link
                href="/exams"
                className="press inline-flex items-center gap-2 text-base font-medium text-coal-900 border-b border-coal-900 pb-1"
              >
                Pick a paper
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        )}

        {attempts.length > 0 && (
          <>
            {/* Enid+ row */}
            {isPlus && (
              <div className="grid grid-cols-12 gap-6 mb-20">
                <div className="hidden md:block col-span-1 marginalia pt-1">
                  02 / Plus
                </div>
                <div className="col-span-12 md:col-span-11">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-coal-rule border border-coal-rule">
                    <DashStat
                      href="/drill"
                      label="Daily Drill"
                      value="30"
                      sub="MCQs ready"
                    />
                    <DashStat
                      href="/vault"
                      label="Mistake Vault"
                      value={vaultCounts.due.toString()}
                      sub={`${vaultCounts.total} total`}
                    />
                    <DashStat
                      href="/mock"
                      label="Mock exams"
                      value={mockCount.toString()}
                      sub="taken"
                    />
                    <DashStat
                      href="/goal"
                      label={streak.activeToday ? 'Streak active' : 'Streak'}
                      value={`${streak.current}d`}
                      sub={`best ${streak.longest}d`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Streak, free for everyone, retention belongs to all users */}
            {!isPlus && (
              <div className="grid grid-cols-12 gap-6 mb-20">
                <div className="hidden md:block col-span-1 marginalia pt-1">
                  02 / Streak
                </div>
                <div className="col-span-12 md:col-span-11">
                  <div className="border-t border-coal-rule pt-6 flex items-baseline gap-8 flex-wrap">
                    <div>
                      <div className="text-4xl font-light tracking-tighter text-coal-900 tabular-nums">
                        {streak.current}
                        <span className="text-lg text-coal-500"> day{streak.current === 1 ? '' : 's'}</span>
                      </div>
                      <p className="marginalia mt-1">
                        {streak.activeToday
                          ? 'Active today. Keep it going.'
                          : 'Practice today to keep your streak.'}
                      </p>
                    </div>
                    <div>
                      <div className="text-4xl font-light tracking-tighter text-coal-500 tabular-nums">
                        {streak.longest}
                      </div>
                      <p className="marginalia mt-1">Longest streak</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upsell for free users with traction */}
            {!isPlus && attempts.length >= 3 && (
              <div className="grid grid-cols-12 gap-6 mb-20">
                <div className="hidden md:block col-span-1 marginalia pt-1">
                  03 / Plus
                </div>
                <div className="col-span-12 md:col-span-11">
                  <div className="border-t border-coal-rule pt-6">
                    <p className="marginalia mb-3">
                      Upgrade · Enid<span className="text-accent">+</span>
                    </p>
                    <h2 className="text-2xl md:text-3xl font-light tracking-tight text-coal-900 max-w-2xl">
                      You have answered {stats.totalQuestions.toLocaleString()} questions. Now make every wrong answer earn its keep.
                    </h2>
                    <p className="mt-4 text-coal-600 max-w-xl">
                      Adaptive Daily Drill, Mistake Vault, full mock exams.
                      Rs 999 for 6 months while founders pricing lasts.
                    </p>
                    <Link
                      href="/pricing"
                      className="press mt-6 inline-flex items-center gap-2 text-base font-medium text-coal-900 border-b border-coal-900 pb-1"
                    >
                      See pricing
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-12 gap-6 mb-20">
              <div className="hidden md:block col-span-1 marginalia pt-1">
                {isPlus ? '03' : '04'} / Numbers
              </div>
              <div className="col-span-12 md:col-span-11">
                <div className="grid grid-cols-2 md:grid-cols-4 border-t border-coal-rule">
                  <StatBox label="Papers" value={stats.totalAttempts.toLocaleString()} />
                  <StatBox label="Accuracy" value={`${stats.accuracy.toFixed(0)}%`} />
                  <StatBox label="Questions" value={stats.totalQuestions.toLocaleString()} />
                  <StatBox label="Time" value={fmtDuration(stats.totalSeconds)} />
                </div>
              </div>
            </div>

            {/* Weak topics */}
            {topicStats.length > 0 && (
              <div className="grid grid-cols-12 gap-6 mb-20">
                <div className="hidden md:block col-span-1 marginalia pt-1">
                  {isPlus ? '04' : '05'} / Weak
                </div>
                <div className="col-span-12 md:col-span-11">
                  <div className="flex items-baseline justify-between mb-6">
                    <h2 className="text-3xl font-light tracking-tight text-coal-900">
                      Topics to revise.
                    </h2>
                    {isPlus && (
                      <Link
                        href="/dashboard/export"
                        className="link-draw text-sm text-coal-600 hover:text-coal-900 tx-color"
                      >
                        Export PDF
                      </Link>
                    )}
                  </div>
                  <ul className="border-t border-coal-rule">
                    {topicStats.slice(0, 6).map((t) => (
                      <li
                        key={t.topic}
                        className="grid grid-cols-12 gap-4 py-5 border-b border-coal-rule items-center"
                      >
                        <div className="col-span-12 md:col-span-5">
                          <div className="text-coal-900 font-medium">{t.topic}</div>
                          <div className="marginalia mt-1">{t.subject}</div>
                        </div>
                        <div className="col-span-8 md:col-span-5">
                          <div className="h-1 bg-coal-200 overflow-hidden">
                            <div
                              className={
                                t.accuracy < 50
                                  ? 'h-full bg-accent'
                                  : t.accuracy < 75
                                  ? 'h-full bg-coal-700'
                                  : 'h-full bg-coal-900'
                              }
                              style={{
                                width: `${Math.max(t.accuracy, 4)}%`,
                                transition: 'width 600ms var(--ease-out)',
                              }}
                            />
                          </div>
                        </div>
                        <div className="col-span-4 md:col-span-2 text-right">
                          <div className="text-coal-900 font-medium tabular-nums">
                            {t.accuracy.toFixed(0)}%
                          </div>
                          <div className="marginalia mt-1">~{t.total} Qs</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Recent attempts */}
            <div className="grid grid-cols-12 gap-6">
              <div className="hidden md:block col-span-1 marginalia pt-1">
                {isPlus ? '05' : '06'} / Recent
              </div>
              <div className="col-span-12 md:col-span-11">
                <div className="flex items-baseline justify-between mb-6">
                  <h2 className="text-3xl font-light tracking-tight text-coal-900">
                    Recent attempts.
                  </h2>
                  <Link
                    href="/exams"
                    className="link-draw text-sm text-coal-600 hover:text-coal-900 tx-color"
                  >
                    Practice more
                  </Link>
                </div>
                <ul className="border-t border-coal-rule">
                  {attempts.slice(0, 20).map((a) => {
                    const info = getCategory(a.category);
                    const paperMeta = INDEXES[a.category]?.papers.find((p) => p.id === a.paper_id);
                    const pct = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
                    return (
                      <li
                        key={a.id}
                        className="grid grid-cols-12 gap-4 py-5 border-b border-coal-rule items-center"
                      >
                        <div className="col-span-12 md:col-span-7 min-w-0">
                          <Link
                            href={`/practice/${a.category}/${a.paper_id}`}
                            className="text-coal-900 font-medium hover:text-accent tx-color truncate block"
                          >
                            {paperMeta?.name ?? a.paper_id}
                          </Link>
                          <div className="marginalia mt-1">
                            {info?.name} · {new Date(a.completed_at).toLocaleDateString('en-GB')}
                          </div>
                        </div>
                        <div className="col-span-6 md:col-span-3">
                          <div className="h-1 bg-coal-200 overflow-hidden">
                            <div
                              className={
                                pct >= 75
                                  ? 'h-full bg-coal-900'
                                  : pct >= 50
                                  ? 'h-full bg-coal-700'
                                  : 'h-full bg-accent'
                              }
                              style={{ width: `${Math.max(pct, 4)}%` }}
                            />
                          </div>
                        </div>
                        <div className="col-span-6 md:col-span-2 text-right">
                          <div className="text-coal-900 font-medium tabular-nums">
                            {a.score}
                            <span className="text-coal-600"> / {a.total}</span>
                          </div>
                          <div className="marginalia mt-1">{pct}%</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

function DashStat({
  href, label, value, sub,
}: { href: string; label: string; value: string; sub: string }) {
  return (
    <Link
      href={href}
      className="press bg-coal p-6 hover:bg-coal-50 tx-color block"
    >
      <p className="marginalia mb-3">{label}</p>
      <div className="text-3xl font-light tracking-tighter text-coal-900 tabular-nums">
        {value}
      </div>
      <p className="text-xs text-coal-500 mt-1">{sub}</p>
    </Link>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-6 px-4 border-b border-coal-rule md:border-b-0 md:border-r last:border-r-0 border-coal-rule">
      <p className="marginalia mb-2">{label}</p>
      <div className="text-3xl font-light tracking-tighter text-coal-900 tabular-nums">
        {value}
      </div>
    </div>
  );
}

function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
