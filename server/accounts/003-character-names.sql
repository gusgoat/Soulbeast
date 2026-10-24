-- Keep account selection and payment recipients aligned with authoritative renames.
begin;
alter table public.sb_player_characters add column if not exists name_changed_at bigint not null default 0;
create or replace function public.sb_player_sync_name(p_account uuid,p_env text,p_code text,p_name text,p_renamed_at bigint)
returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.sb_player_characters%rowtype;
begin
 if p_env not in ('test','live') or p_name is null or length(btrim(p_name)) not between 1 and 20 or p_renamed_at is null or p_renamed_at<0
 then raise exception 'bad_character_name';end if;
 if not exists(select 1 from auth.users where id=p_account and deleted_at is null and email_confirmed_at is not null)
 then raise exception 'verified_account_required';end if;
 select * into c from public.sb_player_characters where account_id=p_account and game_env=p_env and code=p_code and status='active' for update;
 if not found then raise exception 'character_not_owned';end if;
 -- A delayed load from before a rename must not restore the old name.
 if p_renamed_at<c.name_changed_at then return;end if;
 update public.sb_player_characters set name=btrim(p_name),name_changed_at=p_renamed_at
 where account_id=p_account and game_env=p_env and code=p_code;
 update public.sb_shop_characters set name=btrim(p_name)
 where account_id=p_account and game_env=p_env and code=p_code;
end $$;
revoke all on function public.sb_player_sync_name(uuid,text,text,text,bigint) from public,anon,authenticated;
grant execute on function public.sb_player_sync_name(uuid,text,text,text,bigint) to service_role;
commit;
