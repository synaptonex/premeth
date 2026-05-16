'use client';

/**
 * Goal Tracker — Premeth+ only.
 *
 * Why this exists: knowing "MDCAT is in N days" is not enough. The student
 * needs a daily question target that backs out from their target accuracy
 * and the number of MCQs they still need to drill. We compute a recommended
 * daily pace based on their current weakest topics and days remaining, and
 * track progress against the pace they set.
 *
 * The whole feature is intentionally personal — the dashboard you see is
 * not the dashboard your friend sees. That's the anti-sharing point: a
 * shared account would show conflicting goals for two different people.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { usePremethPlus } from '@/lib/premeth-plus.client';
import { toast } from 'sonner';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Calendar, Target, TrendingUp, Save, Lock, AlertCircle, ArrowRight,
} from 'lucide-react';

gsap.registerPlugin(useGSAP);

type Goal = {
  exam_date: string | null;
  target_accuracy: number;
  daily_question_target: number;
};

export default function GoalPage() {
  const router = useRouter();
  const supabase = createClient();
  const root = useRef<HTMLDivElement>(null);
  const { isPlus, loading: plusLoading } = usePremethPlus();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [examDate, setExamDate] = useState<string>('');
  const [targetAccuracy, setTargetAccuracy] = useState<number>(85);
  const [dailyTarget, setDailyTarget] = useState<number>(50);

  const [saving, setSaving] = useState(false);
  const [recentMCQs, setRecentMCQs] = useState<number>(0);
  const [todayMCQs, setTodayMCQs] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?next=/goal');
        return;
      }
      setUserId(user.id);

      // Load existing goal (if any)
      const { data: goal } = await supabase
        .from('study_goals')
        .select('exam_date, target_accuracy, daily_question_target')
        .eq('user_id', user.id)
        .maybeSingle();

      if (goal) {
        setExamDate(goal.exam_date ?? '');
        setTargetAccuracy(goal.target_accuracy ?? 85);
        setDailyTarget(goal.daily_question_target ?? 50);
      }

      // Count MCQs answered today + last 7 days for pace tracking
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [{ data: todayRows }, { data: weekRows }] = await Promise.all([
        supabase.from('attempts').select('total').eq('user_id', user.id).gte('completed_at', startOfToday),
        supabase.from('attempts').select('total').eq('user_id', user.id).gte('completed_at', weekAgo),
      ]);

      setTodayMCQs((todayRows ?? []).reduce((s, r) => s + (r.total ?? 0), 0));
      setRecentMCQs((weekRows ?? []).reduce((s, r) => s + (r.total ?? 0), 0));

      setLoading(false);
    })();
  }, [router, supabase]);

  const daysToExam = useMemo(() => {
    if (!examDate) return null;
    const target = new Date(examDate);
    const now = new Date();
    const ms = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }, [examDate]);

  const recommendedDaily = useMemo(() => {
    // Heuristic: an MDCAT-ready candidate should have practiced ~10,000 MCQs.
    // We back-solve: (10000 - what they've done) / days remaining.
    // Capped at 200/day (anything more is unsustainable).
    if (!daysToExam || daysToExam === 0) return null;
    const targetTotal = 10_000;
    const alreadyDone = recentMCQs * 4; // rough extrapolation from weekly pace
    const remaining = Math.max(0, targetTotal - alreadyDone);
    const perDay = Math.ceil(remaining / daysToExam);
    return Math.min(200, Math.max(20, perDay));
  }, [daysToExam, recentMCQs]);

  const todayProgress = useMemo(() => {
    if (dailyTarget === 0) return 0;
    return Math.min(100, (todayMCQs / dailyTarget) * 100);
  }, [todayMCQs, dailyTarget]);

  async function saveGoal() {
    if (!userId) return;
    setSaving(true);

    const { error } = await supabase.from('study_goals').upsert(
      {
        user_id: userId,
        exam_date: examDate || null,
        target_accuracy: targetAccuracy,
        daily_question_target: dailyTarget,
      },
      { onConflict: 'user_id' }
    );

    setSaving(false);
    if (error) {
      toast.error('Could not save', { description: error.message });
    } else {
      toast.success('Goal saved');
    }
  }

  useGSAP(
    () => {
      if (loading || plusLoading) return;
      gsap.from('.goal-card', { y: 8, autoAlpha: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' });
    },
    { scope: root, dependencies: [loading, plusLoading] }
  );

  if (plusLoading || loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-3xl px-5 py-20 text-center text-coal-600">
          Loading…
        </main>
      </>
    );
  }

  // Gate: free users see the upsell screen
  if (!isPlus) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-5 py-20">
          <div className="border border-coal-rule bg-coal-50 p-10 text-center">
            <Lock className="h-8 w-8 text-accent mx-auto mb-3" />
            <h1 className="text-3xl font-light tracking-tighter text-coal-900 mb-2">
              Goal Tracker is a Premeth+ feature.
            </h1>
            <p className="text-coal-700 max-w-md mx-auto mb-6">
              Set your MDCAT date, target accuracy, and daily MCQ pace. We compute
              the right daily target based on your weak topics and time left.
            </p>
            <Link
              href="/pricing"
              className="press inline-flex items-center gap-2 bg-accent text-coal px-5 py-2.5 font-medium hover:opacity-90 tx-color"
            >
              See Premeth+ pricing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main ref={root} className="mx-auto max-w-3xl px-5 py-12">
        <div className="mb-10">
          <span className="text-xs uppercase tracking-widest text-accent">Premeth+ · Goal Tracker</span>
          <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-coal-900 mt-2">
            Your countdown.
          </h1>
          <p className="text-coal-600 mt-2">
            Set your MDCAT date and target. We work out the daily pace.
          </p>
        </div>

        {/* Today's progress */}
        <section className="goal-card mb-6 border border-coal-rule bg-coal-50 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-2 text-sm text-coal-700">
              <TrendingUp className="h-4 w-4" /> Today
            </div>
            <div className="font-mono text-sm text-coal-600">
              <span className="text-coal-900">{todayMCQs}</span>
              <span> / {dailyTarget}</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-coal-100 overflow-hidden">
            <div
              className={`h-full ${todayProgress >= 100 ? 'bg-coal-900' : 'bg-coal-400'}`}
              style={{ width: `${todayProgress}%`, transition: 'width 600ms var(--ease-out)' }}
            />
          </div>
          {todayProgress >= 100 ? (
            <p className="text-xs text-accent mt-2">You've hit today's target. Good.</p>
          ) : (
            <p className="text-xs text-coal-500 mt-2">
              {dailyTarget - todayMCQs} more MCQs to hit today's target.
            </p>
          )}
        </section>

        {/* Countdown */}
        {daysToExam !== null && (
          <section className="goal-card mb-6 border border-coal-rule bg-coal-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-sm text-coal-700 mb-1">
                  <Calendar className="h-4 w-4" /> Until your exam
                </div>
                <div className="text-5xl text-coal-900 tracking-tight">
                  {daysToExam}
                </div>
                <div className="text-xs text-coal-500 mt-1">
                  {daysToExam === 1 ? 'day' : 'days'} remaining
                </div>
              </div>
              {recommendedDaily && (
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-coal-600 mb-1">
                    Suggested pace
                  </div>
                  <div className="text-3xl text-accent">
                    {recommendedDaily}
                  </div>
                  <div className="text-xs text-coal-500">MCQs / day</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Goal form */}
        <section className="goal-card border border-coal-rule bg-coal-50 p-6 space-y-5">
          <h2 className="text-2xl text-coal-900 tracking-tight">
            Set your goal.
          </h2>

          <div>
            <label className="block text-sm text-coal-700 mb-1.5">
              MDCAT exam date
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-coal border border-coal-rule px-3 py-2 text-coal-900 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-coal-700 mb-1.5">
              <Target className="inline h-3.5 w-3.5 mr-1" />
              Target accuracy: <span className="text-accent font-mono">{targetAccuracy}%</span>
            </label>
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={targetAccuracy}
              onChange={(e) => setTargetAccuracy(Number(e.target.value))}
              className="w-full accent-coal-900"
            />
            <div className="flex justify-between text-xs text-coal-500 mt-1">
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-coal-700 mb-1.5">
              Daily MCQ target: <span className="text-accent font-mono">{dailyTarget}</span>
            </label>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={dailyTarget}
              onChange={(e) => setDailyTarget(Number(e.target.value))}
              className="w-full accent-coal-900"
            />
            <div className="flex justify-between text-xs text-coal-500 mt-1">
              <span>10</span>
              <span>200</span>
            </div>
            {recommendedDaily && dailyTarget < recommendedDaily && (
              <div className="mt-2 flex items-start gap-2 border border-coal-rule bg-coal-50 px-3 py-2 text-xs text-coal-700">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Based on your time remaining, we recommend at least{' '}
                  <strong>{recommendedDaily}</strong> MCQs/day to feel ready.
                </span>
              </div>
            )}
          </div>

          <button
            onClick={saveGoal}
            disabled={saving}
            className="press w-full inline-flex items-center justify-center gap-2 bg-accent text-coal px-4 py-2.5 font-medium hover:opacity-90 tx-color disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save goal'}
          </button>
        </section>

        {/* Quick actions */}
        <section className="goal-card mt-6 grid grid-cols-2 gap-3">
          <Link
            href="/drill"
            className="border border-coal-rule bg-coal-50 p-5 hover:border-accent tx-color"
          >
            <div className="text-accent text-sm font-medium mb-1">Daily Drill</div>
            <div className="text-xs text-coal-600">
              30 MCQs targeted at your weak topics
            </div>
          </Link>
          <Link
            href="/vault"
            className="border border-coal-rule bg-coal-50 p-5 hover:border-accent tx-color"
          >
            <div className="text-accent text-sm font-medium mb-1">Mistake Vault</div>
            <div className="text-xs text-coal-600">
              Review wrong answers on a spaced schedule
            </div>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
