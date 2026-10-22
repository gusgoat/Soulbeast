-- Disposable account fixtures exist only inside this rolled-back transaction. No email is sent.
begin;
insert into auth.users(id,email,email_confirmed_at,aud,role) values
 ('99999999-0000-4000-8000-000000000001','account-a@example.invalid',now(),'authenticated','authenticated'),
 ('99999999-0000-4000-8000-000000000002','account-b@example.invalid',now(),'authenticated','authenticated');
do $$
declare a uuid='99999999-0000-4000-8000-000000000001'; b uuid='99999999-0000-4000-8000-000000000002'; c jsonb;
begin
 if not (select relrowsecurity from pg_class where oid='public.sb_player_characters'::regclass) then raise exception 'RLS required'; end if;
 if has_table_privilege('anon','public.sb_player_characters','select') or has_table_privilege('authenticated','public.sb_player_characters','select') then raise exception 'Direct reads must be denied'; end if;
 if has_function_privilege('anon','public.sb_player_account_command(text,uuid,text,jsonb)','execute') or has_function_privilege('authenticated','public.sb_player_account_command(text,uuid,text,jsonb)','execute') then raise exception 'Direct RPC must be denied'; end if;
 c=public.sb_player_account_command('reserve',a,'test','{"code":"AAAAAAAAAAAAAAAA","engine_pin":"serveronlyqa","request_id":"99999999-1111-4111-8111-111111111111","digest":"fixture","draft":{"P":{"name":"QA only","cls":"mage"}}}');
 if c->>'status'<>'creating' then raise exception 'Reservation failed'; end if;
 perform public.sb_player_account_command('reserve',a,'test','{"code":"BBBBBBBBBBBBBBBB","engine_pin":"ignored","request_id":"99999999-1111-4111-8111-111111111111","digest":"fixture","draft":{"P":{"name":"QA only","cls":"mage"}}}');
 if (select count(*) from public.sb_player_characters where account_id=a)<>1 then raise exception 'Duplicate reservation'; end if;
 begin
  perform public.sb_player_account_command('get',b,'test','{"code":"AAAAAAAAAAAAAAAA"}');raise exception 'Owner guard failed';
 exception when others then if sqlerrm<>'character_not_owned' then raise; end if; end;
 begin
  perform public.sb_player_account_command('get',a,'live','{"code":"AAAAAAAAAAAAAAAA"}');raise exception 'Environment guard failed';
 exception when others then if sqlerrm<>'character_not_owned' then raise; end if; end;
 begin
  perform public.sb_player_account_command('reserve',a,'test','{"request_id":"99999999-1111-4111-8111-111111111111","digest":"changed"}');raise exception 'Digest guard failed';
 exception when others then if sqlerrm<>'request_payload_changed' then raise; end if; end;
 perform public.sb_player_account_command('activate',a,'test','{"code":"AAAAAAAAAAAAAAAA"}');
 if not exists(select 1 from public.sb_shop_characters where account_id=a and game_env='test' and code='AAAAAAAAAAAAAAAA') then raise exception 'Shop owner link missing'; end if;
 if jsonb_array_length(public.sb_player_account_command('list',b,'test'))<>0 then raise exception 'Cross-account list leak'; end if;
 if (select draft is not null from public.sb_player_characters where account_id=a) then raise exception 'Draft must clear after activation'; end if;
end $$;
rollback;
