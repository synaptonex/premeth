-- ─────────────────────────────────────────────────────────────────────────────
-- 0006_referrals.sql
--
-- Ambassador / referral tracking for the soft launch.
--
-- Each ambassador gets a unique tag. They share a link like
--   https://enid.app/signup?ref=their_tag
-- When someone signs up through that link, the tag is carried in the auth
-- signup metadata and recorded on their profile here, as referred_by.
--
-- Payouts are per paid Enid+ purchase and are run manually: query for paid
-- payment_requests joined to profiles where referred_by is set, tally per
-- tag, and pay out. No dashboard, no automatic payout in this phase.
--
-- Run in Supabase Studio after 0005_free_drill.sql.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists referred_by text;

comment on column public.profiles.referred_by is
  'Ambassador tag from the ?ref= signup link, if any. Used for manual payout tallies.';

create index if not exists idx_profiles_referred_by
  on public.profiles(referred_by)
  where referred_by is not null;

-- Update the new-user trigger so it also stores the referral tag. The tag is
-- read from the same signup metadata the username comes from. It is lightly
-- sanitised: trimmed, lower-cased, and capped, and anything with unexpected
-- characters is dropped rather than stored.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_ref text;
  clean_ref text;
begin
  raw_ref := new.raw_user_meta_data->>'ref';

  if raw_ref is not null then
    clean_ref := lower(trim(raw_ref));
    -- Only keep plain tags: letters, numbers, underscore, hyphen, up to 40.
    if clean_ref !~ '^[a-z0-9_-]{1,40}$' then
      clean_ref := null;
    end if;
  end if;

  insert into public.profiles (id, username, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    clean_ref
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
