-- 0007_forum_leaderboard.sql
-- Community forum (threads + replies) and a read-only motivational leaderboard.
-- Run this in the Supabase SQL editor (or via the CLI) once.

-- =========================================================================
-- FORUM
-- =========================================================================

create table if not exists public.forum_threads (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null check (char_length(title) between 3 and 160),
  body             text not null check (char_length(body) between 1 and 8000),
  created_at       timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  reply_count      integer not null default 0
);

create index if not exists forum_threads_activity_idx
  on public.forum_threads (last_activity_at desc);

create table if not exists public.forum_replies (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.forum_threads(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 8000),
  created_at timestamptz not null default now()
);

create index if not exists forum_replies_thread_idx
  on public.forum_replies (thread_id, created_at);

-- Keep reply_count and last_activity_at current as replies come and go.
create or replace function public.forum_touch_thread()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.forum_threads
       set reply_count = reply_count + 1,
           last_activity_at = now()
     where id = new.thread_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.forum_threads
       set reply_count = greatest(reply_count - 1, 0)
     where id = old.thread_id;
    return old;
  end if;
  return null;
end; $$;

drop trigger if exists forum_replies_touch on public.forum_replies;
create trigger forum_replies_touch
  after insert or delete on public.forum_replies
  for each row execute function public.forum_touch_thread();

-- Row-level security: reading is open so visitors can browse; writing is
-- restricted to the row's author.
alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;

drop policy if exists "threads readable by everyone" on public.forum_threads;
drop policy if exists "users insert own threads"     on public.forum_threads;
drop policy if exists "users update own threads"     on public.forum_threads;
drop policy if exists "users delete own threads"     on public.forum_threads;
create policy "threads readable by everyone" on public.forum_threads for select using (true);
create policy "users insert own threads"     on public.forum_threads for insert with check (auth.uid() = user_id);
create policy "users update own threads"      on public.forum_threads for update using (auth.uid() = user_id);
create policy "users delete own threads"      on public.forum_threads for delete using (auth.uid() = user_id);

drop policy if exists "replies readable by everyone" on public.forum_replies;
drop policy if exists "users insert own replies"     on public.forum_replies;
drop policy if exists "users update own replies"     on public.forum_replies;
drop policy if exists "users delete own replies"     on public.forum_replies;
create policy "replies readable by everyone" on public.forum_replies for select using (true);
create policy "users insert own replies"     on public.forum_replies for insert with check (auth.uid() = user_id);
create policy "users update own replies"      on public.forum_replies for update using (auth.uid() = user_id);
create policy "users delete own replies"      on public.forum_replies for delete using (auth.uid() = user_id);

-- Author-joined views: expose username + avatar only (never emails). Owned by
-- the migration role, so they read across users without leaking the profiles
-- table's row policies.
create or replace view public.forum_threads_with_author as
  select t.id, t.user_id, t.title, t.body, t.created_at, t.last_activity_at,
         t.reply_count, p.username as author_username, p.avatar_url as author_avatar
    from public.forum_threads t
    left join public.profiles p on p.id = t.user_id;

create or replace view public.forum_replies_with_author as
  select r.id, r.thread_id, r.user_id, r.body, r.created_at,
         p.username as author_username, p.avatar_url as author_avatar
    from public.forum_replies r
    left join public.profiles p on p.id = r.user_id;

grant select, insert, update, delete on public.forum_threads to authenticated;
grant select, insert, update, delete on public.forum_replies to authenticated;
grant select on public.forum_threads to anon;
grant select on public.forum_replies to anon;
grant select on public.forum_threads_with_author to anon, authenticated;
grant select on public.forum_replies_with_author to anon, authenticated;

-- =========================================================================
-- LEADERBOARD
-- =========================================================================
-- A security-definer function that aggregates the attempts table into a
-- ranked list. It returns ONLY aggregates plus the public username/avatar a
-- student chose to set, never raw attempt rows or emails. Students with no
-- username do not appear, so the board is effectively opt-in.

create or replace function public.get_leaderboard(limit_n integer default 100)
returns table (
  user_id             uuid,
  username            text,
  avatar_url          text,
  questions_practiced bigint,
  correct_answers     bigint,
  accuracy            numeric,
  attempts_count      bigint
) language sql security definer set search_path = public as $$
  select
    a.user_id,
    p.username,
    p.avatar_url,
    sum(a.total)::bigint as questions_practiced,
    sum(a.score)::bigint as correct_answers,
    case when sum(a.total) > 0
         then round((sum(a.score)::numeric / sum(a.total)) * 100, 1)
         else 0 end       as accuracy,
    count(*)::bigint      as attempts_count
  from public.attempts a
  join public.profiles p on p.id = a.user_id
  where p.username is not null
  group by a.user_id, p.username, p.avatar_url
  having sum(a.total) > 0
  order by correct_answers desc, accuracy desc, questions_practiced desc
  limit greatest(1, least(limit_n, 200));
$$;

grant execute on function public.get_leaderboard(integer) to anon, authenticated;
