-- Run AFTER 004-production.sql and Edge deployment. Owner creates Vault secret first.
-- The same random secret must be in Edge SB_PAY_RECONCILE_SECRET and Vault soulbeast_pay_reconcile.
create extension if not exists pg_cron;
create extension if not exists pg_net;
do $$begin
 if not exists(select 1 from vault.decrypted_secrets where name='soulbeast_pay_reconcile') then raise exception 'Create Vault secret soulbeast_pay_reconcile first';end if;
 if not exists(select 1 from cron.job where jobname='soulbeast-payments-reconcile') then
  perform cron.schedule('soulbeast-payments-reconcile','*/5 * * * *',$job$
   select net.http_post(
    url:='https://zycmmtvubzyxduxqpuzl.supabase.co/functions/v1/soulbeast-payments/reconcile',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='soulbeast_pay_reconcile')),
    body:='{}'::jsonb,timeout_milliseconds:=120000
   );
  $job$);
 end if;
end $$;
