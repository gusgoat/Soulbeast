-- Fixtures exist only inside this transaction. ROLLBACK leaves no account/order/credit behind.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('77777777-0000-4000-8000-000000000001','shop-qa-1@example.invalid',now()),
 ('77777777-0000-4000-8000-000000000002','shop-qa-2@example.invalid',now());
do $$
declare a uuid:='77777777-0000-4000-8000-000000000001'; b uuid:='77777777-0000-4000-8000-000000000002'; o jsonb; r jsonb; n jsonb; credit jsonb;
begin
 if has_function_privilege('anon','public.sb_shop_test_command(text,uuid,jsonb)','execute') or has_function_privilege('authenticated','public.sb_shop_test_command(text,uuid,jsonb)','execute') then raise exception 'public_rpc_access'; end if;
 if exists(select 1 from pg_tables where schemaname='public' and tablename in ('sb_shop_characters','sb_shop_test_packs','sb_shop_test_orders','sb_shop_test_credits') and not rowsecurity) then raise exception 'rls_disabled'; end if;
 perform public.sb_shop_test_command('link',a,'{"game_env":"test","code":"SHOPQATEST001","name":"QA one"}');
 perform public.sb_shop_test_command('link',a,'{"game_env":"test","code":"SHOPQATEST002","name":"QA two"}');
 begin perform public.sb_shop_test_command('link',b,'{"game_env":"test","code":"SHOPQATEST001","name":"steal"}');raise exception 'assert_link_stolen';exception when others then if sqlerrm<>'character_already_linked' then raise; end if;end;
 o:=public.sb_shop_test_command('reserve',a,jsonb_build_object('request_id',gen_random_uuid(),'pack_id','first-10','game_env','test','code','SHOPQATEST001'));
 r:=public.sb_shop_test_command('reserve',a,jsonb_build_object('request_id',gen_random_uuid(),'pack_id','first-10','game_env','test','code','SHOPQATEST002'));
 if o->>'id'<>r->>'id' then raise exception 'assert_shared_account_promo'; end if;
 begin perform public.sb_shop_test_command('reserve',a,jsonb_build_object('request_id',o->>'request_id','pack_id','normal-5','game_env','test','code','SHOPQATEST001'));raise exception 'assert_changed_request';exception when others then if sqlerrm<>'request_changed' then raise;end if;end;
 o:=public.sb_shop_test_command('bind',a,jsonb_build_object('order_id',o->>'id','session_id','cs_test_qa1','checkout_url','https://checkout.stripe.com/c/pay/cs_test_qa1'));
 credit:=jsonb_build_object('order_id',o->>'id','session_id','cs_test_qa1','payment_intent','pi_qa1','amount_satang',3500,'price_id',o->>'price_id');
 begin perform public.sb_shop_test_command('credit',a,credit||'{"amount_satang":3501}'::jsonb);raise exception 'assert_wrong_amount';exception when others then if sqlerrm<>'payment_mismatch' then raise;end if;end;
 perform public.sb_shop_test_command('credit',a,credit);perform public.sb_shop_test_command('credit',a,credit);
 if (select sum(coupons) from public.sb_shop_test_credits where account_id=a)<>10 then raise exception 'assert_duplicate_credit'; end if;
 perform public.sb_shop_test_command('expire',a,jsonb_build_object('order_id',o->>'id','session_id','cs_test_qa1'));
 r:=public.sb_shop_test_command('reserve',a,jsonb_build_object('request_id',gen_random_uuid(),'pack_id','first-10','game_env','test','code','SHOPQATEST002'));
 if r->>'status'<>'credited' or r->>'id'<>o->>'id' then raise exception 'assert_spent_promo_reopened'; end if;
 begin perform public.sb_shop_test_command('get',b,jsonb_build_object('order_id',o->>'id'));raise exception 'assert_other_account_order';exception when others then if sqlerrm<>'order_not_found' then raise;end if;end;
 n:=public.sb_shop_test_command('reserve',a,jsonb_build_object('request_id',gen_random_uuid(),'pack_id','first-50','game_env','test','code','SHOPQATEST001'));
 perform public.sb_shop_test_command('bind',a,jsonb_build_object('order_id',n->>'id','session_id','cs_test_qa2','checkout_url','https://checkout.stripe.com/c/pay/cs_test_qa2'));
 perform public.sb_shop_test_command('expire',a,jsonb_build_object('order_id',n->>'id','session_id','cs_test_qa2'));
 r:=public.sb_shop_test_command('reserve',a,jsonb_build_object('request_id',gen_random_uuid(),'pack_id','first-50','game_env','test','code','SHOPQATEST002'));
 if r->>'id'=n->>'id' then raise exception 'assert_cancelled_promo_lost'; end if;
 n:=public.sb_shop_test_command('reserve',a,jsonb_build_object('request_id',gen_random_uuid(),'pack_id','normal-5','game_env','test','code','SHOPQATEST001'));
 r:=public.sb_shop_test_command('reserve',a,jsonb_build_object('request_id',gen_random_uuid(),'pack_id','normal-5','game_env','test','code','SHOPQATEST001'));
 if r->>'id'=n->>'id' then raise exception 'assert_normal_cannot_repeat'; end if;
end $$;
select 'PASS: ownership, account-wide promotion, idempotent credit, cancellation, normal repeat and RLS. All fixtures rolled back.' as result;
rollback;
