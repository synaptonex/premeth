-- ──────────────────────────────────────────────────────────────────────────────
-- Premeth+ — Founders' pricing counter
-- ──────────────────────────────────────────────────────────────────────────────
-- Run this in Supabase Studio → SQL Editor after 0002_premeth_plus.sql.
-- Idempotent (safe to re-run).
--
-- Adds a SECURITY DEFINER function so the public /pricing page can read
-- "how many Rs 999 founders' slots have been claimed?" without exposing
-- the underlying payment_requests rows (which are gated by RLS to each
-- user's own rows).
--
-- A slot is considered "claimed" only when admin has APPROVED a Rs 999
-- payment_request — pending requests do NOT count. This means fraud or
-- abandoned submissions can't burn through the 100-slot limit.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.founders_claimed_count()
returns int
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int
  from public.payment_requests
  where status = 'approved'
    and amount_pkr = 999;
$$;

-- Anyone signed in (or signed out) can call this — it only returns an int,
-- never any row data. Safe to expose.
grant execute on function public.founders_claimed_count() to anon, authenticated;

-- Convenience: also expose the current price the pricing page should show.
-- If founders < 100 → 999, else → 1499. Server-side source of truth.
create or replace function public.premeth_plus_current_price()
returns int
language sql
security definer
set search_path = public
stable
as $$
  select case
    when public.founders_claimed_count() < 100 then 999
    else 1499
  end;
$$;

grant execute on function public.premeth_plus_current_price() to anon, authenticated;
