-- ──────────────────────────────────────────────────────────────────────────────
-- Premeth+ — Paid tier schema
-- ──────────────────────────────────────────────────────────────────────────────
-- Run this in Supabase Studio → SQL Editor → New Query after 0001_initial.sql.
-- Idempotent (safe to re-run).
-- ──────────────────────────────────────────────────────────────────────────────

-- ─── ADMIN FLAG ON PROFILES ───────────────────────────────────────────────────
-- Add an is_admin column so we can gate the /admin pages without a separate table.
-- To make yourself admin after this migration runs:
--   update public.profiles set is_admin = true where id = '<your-auth-uid>';

alter table public.profiles
  add column if not exists is_admin boolean not null default false;


-- ─── PAYMENT REQUESTS ─────────────────────────────────────────────────────────
-- Student submits proof of JazzCash/EasyPaisa payment here. You (admin) review,
-- then approve or reject. Approving generates a redemption_code row for them.

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  method text not null check (method in ('jazzcash', 'easypaisa')),
  -- The number the user sent the money FROM (for cross-checking).
  sender_phone text not null,
  -- The transaction ID / TID from the JazzCash/EasyPaisa SMS receipt.
  transaction_id text not null,
  amount_pkr int not null,
  -- Optional screenshot of the receipt, uploaded to the 'payment-receipts' bucket.
  receipt_url text,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- A given TID can only be claimed once across the whole system.
-- Prevents one transaction ID being submitted by multiple accounts.
create unique index if not exists uniq_payment_txid
  on public.payment_requests(method, transaction_id);

create index if not exists idx_payments_status on public.payment_requests(status, created_at desc);
create index if not exists idx_payments_user on public.payment_requests(user_id, created_at desc);

alter table public.payment_requests enable row level security;

-- Users can submit & read their own requests.
drop policy if exists "payments_insert_self" on public.payment_requests;
create policy "payments_insert_self"
  on public.payment_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "payments_read_self" on public.payment_requests;
create policy "payments_read_self"
  on public.payment_requests for select
  using (auth.uid() = user_id);

-- Admins can read & update everything.
drop policy if exists "payments_admin_all" on public.payment_requests;
create policy "payments_admin_all"
  on public.payment_requests for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));


-- ─── REDEMPTION CODES ─────────────────────────────────────────────────────────
-- A code is generated when a payment_request is approved. Codes are single-use,
-- bound permanently to the user_id of the buyer. Sharing the code does nothing
-- because redemption checks that the redeemer == issued_to.

create table if not exists public.redemption_codes (
  code text primary key,
  -- The user this code was issued to. Codes are NOT transferable.
  issued_to uuid not null references auth.users(id) on delete cascade,
  payment_request_id uuid references public.payment_requests(id) on delete set null,
  -- Months of access this code grants.
  duration_months int not null default 6,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_codes_issued_to on public.redemption_codes(issued_to);

alter table public.redemption_codes enable row level security;

-- Users see only codes issued to them.
drop policy if exists "codes_read_self" on public.redemption_codes;
create policy "codes_read_self"
  on public.redemption_codes for select
  using (auth.uid() = issued_to);

-- Admins manage all codes.
drop policy if exists "codes_admin_all" on public.redemption_codes;
create policy "codes_admin_all"
  on public.redemption_codes for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));


-- ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
-- The actual "is this user paid right now" table. One row per user, max.
-- Created on first successful code redemption. expires_at is updated on
-- subsequent redemptions (extends from the later of now() or current expiry).

create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- Computed from current_period_end > now() in queries. Stored for convenience.
  status text not null default 'inactive'
    check (status in ('inactive', 'active', 'cancelled', 'expired')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  -- The single active session token. New logins replace this, kicking the
  -- old session offline. This is the layer-2 anti-sharing defense.
  current_session_token text,
  current_session_started_at timestamptz,
  -- Counter of how many distinct (ip + user-agent fingerprint) combos we've
  -- seen this period. Cheap heuristic for the layer-3 tripwire.
  fingerprint_count int not null default 0,
  flagged_for_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subs_active on public.subscriptions(status, current_period_end);

alter table public.subscriptions enable row level security;

drop policy if exists "subs_read_self" on public.subscriptions;
create policy "subs_read_self"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "subs_admin_all" on public.subscriptions;
create policy "subs_admin_all"
  on public.subscriptions for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));


-- ─── SESSION FINGERPRINTS ─────────────────────────────────────────────────────
-- Every login records a fingerprint here. We flag accounts with >5 distinct
-- fingerprints in 7 days for manual review (layer 3).

create table if not exists public.session_fingerprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fingerprint_hash text not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_fingerprints_user on public.session_fingerprints(user_id, created_at desc);

alter table public.session_fingerprints enable row level security;

drop policy if exists "fingerprints_insert_self" on public.session_fingerprints;
create policy "fingerprints_insert_self"
  on public.session_fingerprints for insert
  with check (auth.uid() = user_id);

drop policy if exists "fingerprints_admin_read" on public.session_fingerprints;
create policy "fingerprints_admin_read"
  on public.session_fingerprints for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));


-- ─── MISTAKE VAULT (paid feature) ─────────────────────────────────────────────
-- Auto-populated when a paid user gets a question wrong. Spaced repetition
-- schedule: day 1, 3, 7, 14, 30 from first_wrong_at. due_at is recalculated
-- each time the user reviews (correct = advance stage, wrong = reset to 1).

create table if not exists public.mistake_vault (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  paper_id text not null,
  question_index int not null,
  -- Snapshot of the question text for fast list rendering (no need to re-fetch
  -- the paper just to show a vault row).
  question_text text not null,
  subject text,
  topic text,
  -- Spaced-repetition state. stage 0=new, 1=day1, 2=day3, 3=day7, 4=day14, 5=day30+
  stage int not null default 1,
  due_at timestamptz not null default now() + interval '1 day',
  times_wrong int not null default 1,
  times_correct int not null default 0,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  -- Same question can only appear once per user. New wrong answer just bumps
  -- times_wrong and resets the schedule.
  unique (user_id, category, paper_id, question_index)
);

create index if not exists idx_vault_due on public.mistake_vault(user_id, due_at);

alter table public.mistake_vault enable row level security;

drop policy if exists "vault_read_self" on public.mistake_vault;
create policy "vault_read_self"
  on public.mistake_vault for select
  using (auth.uid() = user_id);

drop policy if exists "vault_modify_self" on public.mistake_vault;
create policy "vault_modify_self"
  on public.mistake_vault for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── MOCK EXAM ATTEMPTS (paid feature) ────────────────────────────────────────
-- Separate from `attempts` because a mock is a *generated* paper assembled from
-- the question bank, not a fixed past paper. We store the assembled question
-- list so the result can be re-rendered later.

create table if not exists public.mock_exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- The pool the exam was assembled from (e.g. "MDCAT 180-question simulation",
  -- "Biology timed drill", etc.)
  exam_type text not null,
  -- Array of [{ category, paper_id, question_index, correct_index, user_answer }]
  -- stored as jsonb for replay.
  questions jsonb not null,
  score int not null,
  total int not null,
  -- Per-subject breakdown { Biology: { correct: 35, total: 60 }, ... }
  subject_breakdown jsonb,
  duration_seconds int not null,
  time_limit_seconds int not null,
  completed_at timestamptz not null default now()
);

create index if not exists idx_mocks_user on public.mock_exam_attempts(user_id, completed_at desc);

alter table public.mock_exam_attempts enable row level security;

drop policy if exists "mocks_read_self" on public.mock_exam_attempts;
create policy "mocks_read_self"
  on public.mock_exam_attempts for select
  using (auth.uid() = user_id);

drop policy if exists "mocks_insert_self" on public.mock_exam_attempts;
create policy "mocks_insert_self"
  on public.mock_exam_attempts for insert
  with check (auth.uid() = user_id);


-- ─── STUDY GOAL (paid feature) ────────────────────────────────────────────────
-- One row per user. Holds the exam date and a target accuracy. The daily plan
-- is computed in the app from this + weak-topic data; no need to store it.

create table if not exists public.study_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  exam_date date not null,
  target_accuracy int not null default 80 check (target_accuracy between 0 and 100),
  daily_question_target int not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.study_goals enable row level security;

drop policy if exists "goals_modify_self" on public.study_goals;
create policy "goals_modify_self"
  on public.study_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── STREAKS (paid feature) ───────────────────────────────────────────────────
-- A "streak day" is any day where the user answered ≥ daily_question_target
-- questions (defaulting to 20 if no goal set). We compute this lazily in app
-- code from the attempts table; the streaks table just caches the result so
-- the dashboard doesn't have to recompute every page load.

create table if not exists public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_activity_date date,
  updated_at timestamptz not null default now()
);

alter table public.streaks enable row level security;

drop policy if exists "streaks_read_self" on public.streaks;
create policy "streaks_read_self"
  on public.streaks for select
  using (auth.uid() = user_id);

drop policy if exists "streaks_modify_self" on public.streaks;
create policy "streaks_modify_self"
  on public.streaks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ─── STORAGE: payment-receipts BUCKET ─────────────────────────────────────────
-- Private bucket (admin-only read). Users upload screenshots of JazzCash /
-- EasyPaisa SMS receipts here when submitting a payment request.

insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do nothing;

-- Each user can upload to their own folder (named after their UID).
drop policy if exists "receipts_upload_self" on storage.objects;
create policy "receipts_upload_self"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- User can read their own receipts.
drop policy if exists "receipts_read_self" on storage.objects;
create policy "receipts_read_self"
  on storage.objects for select
  using (
    bucket_id = 'payment-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read all receipts (for verification).
drop policy if exists "receipts_admin_read" on storage.objects;
create policy "receipts_admin_read"
  on storage.objects for select
  using (
    bucket_id = 'payment-receipts'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );


-- ─── HELPER: is_premeth_plus(user_id) ─────────────────────────────────────────
-- A SQL helper that other policies / queries can use. Returns true iff the user
-- has an active subscription whose period hasn't expired.

create or replace function public.is_premeth_plus(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and s.status = 'active'
      and s.current_period_end > now()
  );
$$;
