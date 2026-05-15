// lib/premeth-plus.server.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server-side Premeth+ subscription check. Import this in:
//   • API routes (app/api/.../route.ts)
//   • Server Components (any page.tsx without "use client")
//   • Server Actions
//
// DO NOT import this from client components — it has no React dependencies,
// but keeping the split clean prevents accidental coupling.
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js';
import { INACTIVE, type PremethPlusStatus } from './premeth-plus';

export async function getPremethPlus(
  supabase: SupabaseClient,
  userId: string
): Promise<PremethPlusStatus> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, current_period_end, flagged_for_review')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return INACTIVE;

  const end = new Date(data.current_period_end);
  const now = new Date();
  const isActive = data.status === 'active' && end > now;
  const ms = end.getTime() - now.getTime();
  const days = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));

  return {
    isActive,
    expiresAt: end,
    daysRemaining: isActive ? days : null,
    flaggedForReview: !!data.flagged_for_review,
    loading: false,
  };
}
