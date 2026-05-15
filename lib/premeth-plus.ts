// lib/premeth-plus.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared constants and pure helpers for Premeth+. Safe to import from both
// server and client code — contains NO React, NO Supabase client imports,
// NO server-only APIs.
//
// If you need the actual subscription state, import from:
//   • lib/premeth-plus.server.ts   (server-side check, takes a SupabaseClient)
//   • lib/premeth-plus.client.tsx  (React hook, client components only)
//
// This split is critical: mixing client/server code in one module causes
// Next.js to bundle React hooks into server routes, which breaks at runtime
// with errors like "(0 , u.qU) is not a function".
// ─────────────────────────────────────────────────────────────────────────────

export interface PremethPlusStatus {
  isActive: boolean;
  expiresAt: Date | null;
  daysRemaining: number | null;
  flaggedForReview: boolean;
  loading: boolean;
}

export const INACTIVE: PremethPlusStatus = {
  isActive: false,
  expiresAt: null,
  daysRemaining: null,
  flaggedForReview: false,
  loading: false,
};

// ─── Pricing & duration constants ─────────────────────────────────────────────
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
  const segment = (n: number) =>
    Array.from({ length: n }, () =>
      CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    ).join('');
  return `PRMTH-${segment(4)}-${segment(4)}`;
}

export function normalizeRedemptionCode(raw: string): string {
  const cleaned = raw.replace(/[\s\-_]/g, '').toUpperCase();
  if (cleaned.startsWith('PRMTH') && cleaned.length === 13) {
    return `PRMTH-${cleaned.slice(5, 9)}-${cleaned.slice(9, 13)}`;
  }
  return cleaned;
}
