// lib/premeth-plus.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for "is this user a Premeth+ subscriber, right now?"
//
// Every gated page calls usePremethPlus() (client) or getPremethPlus() (server).
// If they want to gate a feature, they ALSO check is_premeth_plus from the DB
// for security — client checks can lie, RLS / server checks cannot.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export interface PremethPlusStatus {
  isActive: boolean;
  expiresAt: Date | null;
  daysRemaining: number | null;
  flaggedForReview: boolean;
  // Set while the check is in progress so UI can show a skeleton.
  loading: boolean;
}

const INACTIVE: PremethPlusStatus = {
  isActive: false,
  expiresAt: null,
  daysRemaining: null,
  flaggedForReview: false,
  loading: false,
};

// ─── Server-side check ────────────────────────────────────────────────────────
// Use this in Server Components / API routes / Server Actions. Pass in a
// client built with createClient() from lib/supabase/server.ts.

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

// ─── Client-side hook ─────────────────────────────────────────────────────────
// Drop this into any client component that needs to know subscription state.

export function usePremethPlus(): PremethPlusStatus {
  const [status, setStatus] = useState<PremethPlusStatus>({
    ...INACTIVE,
    loading: true,
  });

  useEffect(() => {
    const supabase = createBrowserClient();
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setStatus({ ...INACTIVE, loading: false });
        return;
      }
      const result = await getPremethPlus(supabase, user.id);
      if (!cancelled) setStatus(result);
    })();

    return () => { cancelled = true; };
  }, []);

  return status;
}

// ─── Pricing constants ────────────────────────────────────────────────────────
// Single source of truth. Update here and the whole app reflects it.

export const PREMETH_PLUS_PRICE_PKR = 1499;
export const PREMETH_PLUS_DURATION_MONTHS = 6;
export const PREMETH_PLUS_FOUNDERS_PRICE_PKR = 999;
export const PREMETH_PLUS_FOUNDERS_LIMIT = 100;

// JazzCash / EasyPaisa account details. These show up on /pricing after
// the buyer picks a payment method, so they know where to send money.
// To change later, edit this block and redeploy.
export const PAYMENT_ACCOUNTS = {
  jazzcash: {
    accountName: 'Shahbaz Waseem Gul',
    accountNumber: '0334-5121203',
    note: 'JazzCash account — send to this number, then submit your TID below.',
  },
  easypaisa: {
    accountName: 'Shahbaz Waseem Gul',
    accountNumber: '0327-8322011',
    note: 'EasyPaisa account — send to this number, then submit your TID below.',
  },
} as const;

// ─── Redemption code generation ───────────────────────────────────────────────
// Format: PRMTH-XXXX-XXXX where each X is from the unambiguous alphabet below
// (no 0/O/I/1/L mixups when students type the code by hand).

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRedemptionCode(): string {
  const block = (len: number) => {
    let out = '';
    for (let i = 0; i < len; i++) {
      out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    return out;
  };
  return `PRMTH-${block(4)}-${block(4)}`;
}

// Normalize whatever the student types (lowercase, weird spacing, missing
// dashes) into the canonical format for DB lookup.
export function normalizeRedemptionCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Re-insert dashes: PRMTH (5) + 4 + 4 = 13 chars total.
  if (cleaned.length !== 13 || !cleaned.startsWith('PRMTH')) return cleaned;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9, 13)}`;
}
