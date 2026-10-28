-- Install only after deploying the new account Edge function.
-- Store the same random secret in Edge SB_COUNTRY_WAR_JOB_SECRET and Vault soulbeast_country_war_job.
-- No credentials belong in browser files, Git, or cron SQL literals.
create extension if not exists pg_cron;
create extension if not exists pg_net;
do $$begin
 if not exists(select 1 from vault.decrypted_secrets where name='soulbeast_country_war_job') then
  raise exception 'Create Vault secret soulbeast_country_war_job and matching Edge secret first';
 end if;
 if not exists(select 1 from cron.job where jobname='soulbeast-country-war-weekly') then
  -- Sunday 16:59 UTC = Sunday 23:59 Asia/Bangkok. Receipts make repeated jobs safe.
  perform cron.schedule('soulbeast-country-war-weekly','59 16 * * 0',$job$
   select net.http_post(
    url:='https://zycmmtvubzyxduxqpuzl.supabase.co/functions/v1/soulbeast-accounts',
    headers:=jsonb_build_object('Content-Type','application/json','x-country-war-job',(select decrypted_secret from vault.decrypted_secrets where name='soulbeast_country_war_job')),
    body:=jsonb_build_object('environment',environment),timeout_milliseconds:=120000
   ) from unnest(array['test','live']) as envs(environment);
  $job$);
 end if;
 -- 15:00 UTC = 22:00 Bangkok. Running again is safe through the same CAS ledger.
 -- Also wake at midnight Bangkok (17:00 UTC); the engine resets only on the first of a month.
 perform cron.schedule('soulbeast-country-war-daily','0 15,17 * * *',$job$
  select net.http_post(
   url:='https://zycmmtvubzyxduxqpuzl.supabase.co/functions/v1/soulbeast-accounts',
   headers:=jsonb_build_object('Content-Type','application/json','x-country-war-job',(select decrypted_secret from vault.decrypted_secrets where name='soulbeast_country_war_job')),
   body:=jsonb_build_object('environment',environment),timeout_milliseconds:=120000
  ) from unnest(array['test','live']) as envs(environment);
 $job$);
end $$;
