-- ─────────────────────────────────────────────────────────────────────────────
-- 0005_free_drill.sql
--
-- Free-tier users get one Adaptive Daily Drill per calendar day. This column
-- records the date of their most recent free drill so the app can allow one
-- per day and prompt an upgrade for more.
--
-- Run in Supabase Studio → SQL Editor after 0004_report_corrections.sql.
-- Enid+ subscribers ignore this column entirely (unlimited drills).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists last_free_drill date;

comment on column public.profiles.last_free_drill is
  'Date of the free user''s most recent Daily Drill. One free drill per day.';
