-- Apply to the current day/time reminder schema. Do not convert legacy schedules silently.
begin;
do $$ begin
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='journey_reminders' and column_name='reminder_time') then
    raise exception 'Expected the current reminder_time/days_of_week/timezone schema. Stop and migrate the legacy reminder schema first.';
  end if;
end $$;

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  updated_at timestamptz not null default now()
);
create unique index if not exists push_subscriptions_endpoint_unique on public.push_subscriptions(endpoint);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
drop policy if exists push_device_owner on public.push_subscriptions;
create policy push_device_owner on public.push_subscriptions for all to authenticated
using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

create table if not exists public.reminder_deliveries (
  reminder_id text not null,
  occurrence text not null,
  endpoint text not null references public.push_subscriptions(endpoint) on delete cascade,
  status text not null check(status in ('sending','sent','failed','expired')),
  claimed_at timestamptz not null default now(),
  primary key(reminder_id,occurrence,endpoint)
);
alter table public.reminder_deliveries enable row level security;
revoke all on public.reminder_deliveries from anon, authenticated;
grant all on public.reminder_deliveries to service_role;
grant all on public.push_subscriptions to service_role;
grant select on public.journey_reminders to service_role;

create or replace function public.claim_reminder_delivery(reminder_key text, occurrence_key text, device_endpoint text)
returns boolean language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
  insert into public.reminder_deliveries(reminder_id,occurrence,endpoint,status)
  values(reminder_key,occurrence_key,device_endpoint,'sending')
  on conflict(reminder_id,occurrence,endpoint) do update
  set status='sending', claimed_at=now()
  where public.reminder_deliveries.status='failed'
     or (public.reminder_deliveries.status='sending' and public.reminder_deliveries.claimed_at < now()-interval '2 minutes');
  get diagnostics affected = row_count;
  return affected=1;
end $$;
revoke all on function public.claim_reminder_delivery(text,text,text) from public, anon, authenticated;
grant execute on function public.claim_reminder_delivery(text,text,text) to service_role;
commit;
