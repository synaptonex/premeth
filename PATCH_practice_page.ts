/**
 * PATCH FOR: app/practice/[category]/[paperId]/page.tsx
 *
 * Purpose: when a paid user finishes a paper, their wrong answers should
 * automatically populate the mistake_vault for spaced-repetition review.
 *
 * This is a *small* change to the existing `finish` callback. Find the
 * block starting at line ~122 that begins with `const finish = useCallback`
 * and replace it with the version below.
 *
 * The change is additive — the existing attempts insert is preserved.
 * We just add a step after it that checks subscription status and upserts
 * wrong answers into the vault.
 */

// REPLACE the entire `finish` useCallback in app/practice/[category]/[paperId]/page.tsx
// with this version. Everything else in the file stays the same.

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

  // ----- Premeth+ : auto-add wrong answers to mistake vault -----
  // Check subscription status. If active, find every question where
  // the user picked the wrong answer and upsert it into the vault.
  // We use upsert so re-attempting the same paper doesn't duplicate rows
  // (the unique constraint on user_id,category,paper_id,q_index handles it).
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('current_period_end, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('current_period_end', new Date().toISOString())
    .maybeSingle();

  if (!sub) return; // free user, nothing more to do

  const wrongRows = paper.questions
    .map((qq, i) => {
      const userAnswer = answers[i];
      if (userAnswer === null) return null;
      const correctIdx = qq.options.findIndex((o) => o.isCorrect);
      if (userAnswer === correctIdx) return null;
      return {
        user_id: user.id,
        category,
        paper_id: paperId,
        q_index: i,
        user_answer_index: userAnswer,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (wrongRows.length === 0) return;

  // Upsert: on conflict (the unique constraint), do nothing — the existing
  // row's SR stage is preserved. This prevents a fresh wrong-answer review
  // from blowing away the user's spaced-repetition progress on the same Q.
  const { error: vaultErr } = await supabase
    .from('mistake_vault')
    .upsert(wrongRows, {
      onConflict: 'user_id,category,paper_id,q_index',
      ignoreDuplicates: true,
    });

  if (!vaultErr) {
    toast.success(`${wrongRows.length} mistake${wrongRows.length > 1 ? 's' : ''} added to your vault`);
  }
}, [answers, category, paper, paperId, score, startedAt, total]);
