-- Run AFTER deploying /api/reminders/send and applying the delivery migration.
-- First create a Vault secret named quran_reminder_cron_secret containing the same
-- random value as CRON_SECRET in Vercel. Do not paste your service-role key here.
-- Enable pg_cron and pg_net in Supabase Integrations/Extensions first.
do $$ begin
  if not exists(select 1 from vault.decrypted_secrets where name='quran_reminder_cron_secret') then
    raise exception 'Create the quran_reminder_cron_secret Vault entry first.';
  end if;
end $$;

select cron.schedule('quran-reminder-delivery', '* * * * *', $job$
  select net.http_post(
    url := 'https://www.qurandaily.space/api/reminders/send',
    headers := jsonb_build_object('Content-Type','application/json','Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='quran_reminder_cron_secret' limit 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
$job$);

select cron.schedule('quran-reminder-log-cleanup', '15 3 * * *', $job$
  delete from public.reminder_deliveries where claimed_at < now()-interval '14 days';
$job$);
