/**
 * Streaks — Enid+ feature.
 *
 * A "streak day" is a day where the user answered at least
 * `daily_question_target` MCQs (or 20 if no goal is set).
 *
 * We compute the current streak on the fly from the attempts table rather
 * than running a cron job. It's O(attempts in last 60 days) which is cheap.
 *
 * The `streaks` table is cached so we don't recompute on every page load,
 * but the source of truth is always the attempts table.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type StreakResult = {
  current_streak: number;
  longest_streak: number;
  active_today: boolean;
  target: number;
};

export async function computeStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<StreakResult> {
  // Pull attempts from the last 60 days. 60 is enough to cover anyone's
  // current streak; if you're on a 60+ day streak you're a legend and we'll
  // happily under-count by a couple days.
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: attempts }, { data: goal }] = await Promise.all([
    supabase
      .from('attempts')
      .select('completed_at, total')
      .eq('user_id', userId)
      .gte('completed_at', sixtyDaysAgo)
      .order('completed_at', { ascending: false }),
    supabase
      .from('study_goals')
      .select('daily_question_target')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const target = goal?.daily_question_target ?? 20;

  // Group MCQ counts by local date (YYYY-MM-DD)
  const dayTotals = new Map<string, number>();
  for (const a of attempts ?? []) {
    const day = new Date(a.completed_at).toISOString().split('T')[0];
    dayTotals.set(day, (dayTotals.get(day) ?? 0) + (a.total ?? 0));
  }

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Current streak: walk back from today (or yesterday if today not yet active)
  // until a day misses the target.
  let current = 0;
  let cursor = new Date();
  const todayActive = (dayTotals.get(today) ?? 0) >= target;

  // If today isn't active yet, don't break the streak — start counting from yesterday.
  if (!todayActive) {
    cursor = new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  while (true) {
    const day = cursor.toISOString().split('T')[0];
    if ((dayTotals.get(day) ?? 0) >= target) {
      current += 1;
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  // Longest streak: find max consecutive run in the 60-day window
  const allDays = Array.from(dayTotals.keys()).sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const day of allDays) {
    const date = new Date(day);
    if (prev && date.getTime() - prev.getTime() === 24 * 60 * 60 * 1000) {
      run += 1;
    } else {
      run = 1;
    }
    if ((dayTotals.get(day) ?? 0) >= target) {
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
    prev = date;
  }

  longest = Math.max(longest, current);

  // Cache the result (best effort — don't block on it)
  void supabase
    .from('streaks')
    .upsert(
      {
        user_id: userId,
        current_streak: current,
        longest_streak: longest,
        last_active_date: todayActive ? today : (current > 0 ? yesterday : null),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  return {
    current_streak: current,
    longest_streak: longest,
    active_today: todayActive,
    target,
  };
}
