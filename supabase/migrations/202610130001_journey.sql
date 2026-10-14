-- My Qur’an Journey: additive tables only. Existing profiles are unchanged.
begin;
create or replace function public.journey_valid_verse(value text) returns boolean
language plpgsql immutable set search_path = '' as $$
declare s integer; a integer; counts integer[] := ARRAY[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
begin
  if value is null or value !~ '^[1-9][0-9]{0,2}:[1-9][0-9]{0,2}$' then return false; end if;
  s := split_part(value, ':', 1)::integer; a := split_part(value, ':', 2)::integer;
  return s between 1 and 114 and a between 1 and counts[s];
end; $$;
create table if not exists public.journey_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  verse_key text not null check(public.journey_valid_verse(verse_key)),
  updated_at timestamptz not null default now()
);
create table if not exists public.journey_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  verse_key text not null check(public.journey_valid_verse(verse_key)),
  created_at timestamptz not null default now(), primary key(user_id,verse_key)
);
create table if not exists public.journey_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  next_due timestamptz not null,
  repeat_hours integer not null default 0 check(repeat_hours in(0,24,168)),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists journey_reminders_due on public.journey_reminders(user_id,next_due) where enabled;
alter table public.journey_progress enable row level security;
revoke all on public.journey_progress from anon;
grant select, insert, update, delete on public.journey_progress to authenticated;
drop policy if exists owner_access on public.journey_progress;
create policy owner_access on public.journey_progress for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter table public.journey_bookmarks enable row level security;
revoke all on public.journey_bookmarks from anon;
grant select, insert, update, delete on public.journey_bookmarks to authenticated;
drop policy if exists owner_access on public.journey_bookmarks;
create policy owner_access on public.journey_bookmarks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter table public.journey_reminders enable row level security;
revoke all on public.journey_reminders from anon;
grant select, insert, update, delete on public.journey_reminders to authenticated;
drop policy if exists owner_access on public.journey_reminders;
create policy owner_access on public.journey_reminders for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
commit;
