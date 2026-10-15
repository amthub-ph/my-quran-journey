begin;
create table if not exists public.journey_surah_state (
 user_id uuid not null references auth.users(id) on delete cascade,
 surah integer not null check(surah between 1 and 114),
 completions integer not null default 0 check(completions >= 0),
 in_progress boolean not null default true,
 primary key(user_id,surah)
);
create table if not exists public.journey_surah_completions (
 user_id uuid not null references auth.users(id) on delete cascade,
 surah integer not null check(surah between 1 and 114),
 reading_number integer not null check(reading_number > 0),
 completed_at timestamptz,
 primary key(user_id,surah,reading_number)
);
alter table public.journey_surah_state enable row level security;
alter table public.journey_surah_completions enable row level security;
revoke all on public.journey_surah_state, public.journey_surah_completions from anon, authenticated;
grant select on public.journey_surah_state, public.journey_surah_completions to authenticated;
drop policy if exists own_surah_state on public.journey_surah_state;
create policy own_surah_state on public.journey_surah_state for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists own_surah_completions on public.journey_surah_completions;
create policy own_surah_completions on public.journey_surah_completions for select to authenticated using ((select auth.uid()) = user_id);
-- Preserve legacy 100% records; their actual completion time was not stored.
insert into public.journey_surah_state(user_id,surah,completions,in_progress)
select user_id,split_part(verse_key,':',1)::integer,1,false from public.journey_progress
where split_part(verse_key,':',2)::integer = (ARRAY[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6])[split_part(verse_key,':',1)::integer]
on conflict do nothing;
insert into public.journey_surah_completions(user_id,surah,reading_number,completed_at)
select user_id,surah,1,null from public.journey_surah_state where completions > 0
on conflict do nothing;
create or replace function public.journey_save_reading(p_key text, p_mode text default 'save') returns void
language plpgsql security definer set search_path = '' as $function$
declare uid uuid := auth.uid(); s integer; a integer; total integer; state public.journey_surah_state%rowtype;
 counts integer[] := ARRAY[7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
begin
 if uid is null then raise exception 'Sign in required'; end if;
 if p_key is null or p_key !~ '^[1-9][0-9]{0,2}:[1-9][0-9]{0,2}$' then raise exception 'Invalid verse'; end if;
 s := split_part(p_key,':',1)::integer; a := split_part(p_key,':',2)::integer;
 total := counts[s];
 if total is null or a > total then raise exception 'Invalid verse'; end if;
 if p_mode is null or p_mode not in ('save','complete','restart') then raise exception 'Invalid operation'; end if;
 if p_mode = 'complete' and a <> total then raise exception 'Complete at final ayah only'; end if;
 if p_mode = 'restart' and a <> 1 then raise exception 'Restart at first ayah only'; end if;
 insert into public.journey_surah_state(user_id,surah) values(uid,s) on conflict do nothing;
 select * into state from public.journey_surah_state where user_id=uid and surah=s for update;
 if p_mode = 'complete' and state.in_progress then
  insert into public.journey_surah_completions(user_id,surah,reading_number,completed_at) values(uid,s,state.completions+1,now());
  update public.journey_surah_state set completions=completions+1,in_progress=false where user_id=uid and surah=s;
 elsif p_mode = 'restart' or (p_mode = 'save' and a < total) then
  update public.journey_surah_state set in_progress=true where user_id=uid and surah=s;
 end if;
 insert into public.journey_progress(user_id,surah,ayah,verse_key,updated_at) values(uid,s,a,p_key,now())
 on conflict(user_id,surah) do update set ayah=excluded.ayah,verse_key=excluded.verse_key,updated_at=excluded.updated_at;
end;
$function$;
revoke all on function public.journey_save_reading(text,text) from public, anon;
grant execute on function public.journey_save_reading(text,text) to authenticated;
commit;
