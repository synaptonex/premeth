-- ─────────────────────────────────────────────────────────────────────────────
-- 0004_report_corrections.sql
--
-- Adds structured correction fields to question_reports so a student flagging
-- a wrong question can say what the answer should be, why, and cite a source.
--
-- Run in Supabase Studio → SQL Editor after 0003_founders_counter.sql.
-- All three columns are nullable, so existing rows and the older report flow
-- keep working untouched.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.question_reports
  add column if not exists corrected_answer  text,
  add column if not exists correction_reason text,
  add column if not exists proof_source      text;

comment on column public.question_reports.corrected_answer  is
  'What the reporter believes the correct answer is (free text, e.g. "B" or the option text).';
comment on column public.question_reports.correction_reason is
  'Why the reporter believes the marked answer is wrong.';
comment on column public.question_reports.proof_source is
  'A citation or link backing the correction — textbook, board key, etc.';
