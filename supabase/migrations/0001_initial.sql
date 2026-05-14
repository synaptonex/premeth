-- ──────────────────────────────────────────────────────────────────────────────
-- Premeth 2.0 — Database schema
-- ──────────────────────────────────────────────────────────────────────────────
-- Run this in Supabase Studio → SQL Editor → New Query. Paste, hit Run.
-- It is idempotent (safe to re-run) for the most part.
-- ──────────────────────────────────────────────────────────────────────────────

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
-- One row per user, joined to auth.users by id. Username is optional, avatar_url
-- points at Supabase Storage.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_username on public.profiles(username);

alter table public.profiles enable row level security;

-- Anyone can read profile basics (so we can show usernames in leaderboards etc.)
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all"
  on public.profiles for select
  using (true);

-- Only the user can update their own row.
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id);

-- New users are inserted by the trigger below, not directly.
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── ATTEMPTS ─────────────────────────────────────────────────────────────────
-- One row per completed practice session.

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  paper_id text not null,
  score int not null,
  total int not null,
  correct_answers int[] not null,
  user_answers int[] not null,
  duration_seconds int not null default 0,
  completed_at timestamptz not null default now()
);

create index if not exists idx_attempts_user on public.attempts(user_id, completed_at desc);
create index if not exists idx_attempts_paper on public.attempts(category, paper_id);

alter table public.attempts enable row level security;

drop policy if exists "attempts_read_self" on public.attempts;
create policy "attempts_read_self"
  on public.attempts for select
  using (auth.uid() = user_id);

drop policy if exists "attempts_insert_self" on public.attempts;
create policy "attempts_insert_self"
  on public.attempts for insert
  with check (auth.uid() = user_id);

drop policy if exists "attempts_delete_self" on public.attempts;
create policy "attempts_delete_self"
  on public.attempts for delete
  using (auth.uid() = user_id);


-- ─── QUESTION REPORTS ─────────────────────────────────────────────────────────
-- Students flag MCQs that look wrong. Admins read these in the dashboard.

create table if not exists public.question_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null,
  paper_id text not null,
  question_index int not null,
  reason text not null check (reason in (
    'wrong_answer','wrong_explanation','typo','image_missing','duplicate','other'
  )),
  details text,
  status text not null default 'open' check (status in (
    'open','reviewed','fixed','dismissed'
  )),
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_paper on public.question_reports(category, paper_id, question_index);
create index if not exists idx_reports_status on public.question_reports(status, created_at desc);

alter table public.question_reports enable row level security;

-- Logged-in users can submit reports.
drop policy if exists "reports_insert_authed" on public.question_reports;
create policy "reports_insert_authed"
  on public.question_reports for insert
  with check (auth.uid() is not null and auth.uid() = user_id);

-- Users see their own reports.
drop policy if exists "reports_read_self" on public.question_reports;
create policy "reports_read_self"
  on public.question_reports for select
  using (auth.uid() = user_id);


-- ─── STORAGE: AVATARS BUCKET ──────────────────────────────────────────────────
-- The bucket itself must be created from the Storage UI (or via the dashboard
-- API). The policies below assume a public bucket named "avatars".

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_read_all" on storage.objects;
create policy "avatars_read_all"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Each user can only write to their own folder named after their UID.
drop policy if exists "avatars_upload_self" on storage.objects;
create policy "avatars_upload_self"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_self" on storage.objects;
create policy "avatars_update_self"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_delete_self" on storage.objects;
create policy "avatars_delete_self"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ─── STORAGE: premeth-data BUCKET ─────────────────────────────────────────────
-- This holds the actual question data. Public read; uploads happen via the
-- service role key from scripts/upload-data.mjs, so no insert policy is needed.

insert into storage.buckets (id, name, public)
values ('premeth-data', 'premeth-data', true)
on conflict (id) do nothing;

drop policy if exists "premeth_data_read_all" on storage.objects;
create policy "premeth_data_read_all"
  on storage.objects for select
  using (bucket_id = 'premeth-data');
