begin;

-- Dismissing a letter never removes the source reward or ranked event.
create table if not exists public.sb_walk_mail_dismissals (
  account_id uuid not null references auth.users(id) on delete cascade,
  game_env text not null,
  scope text not null,
  mail_id text not null,
  primary key (account_id, game_env, scope, mail_id)
);
alter table public.sb_walk_mail_dismissals enable row level security;
revoke all on public.sb_walk_mail_dismissals from public, anon, authenticated;

create or replace function public.sb_walk_mail_dismiss(
  p_env text, p_code text, p_ids text[] default '{}'
) returns text[]
language plpgsql security definer set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  hidden text[];
begin
  if caller is null or p_env not in ('live','test') or not exists (
    select 1 from public.sb_player_characters c
    where c.account_id=caller and c.game_env=p_env and c.code=p_code and c.status='active'
  ) then
    raise exception 'character_not_owned';
  end if;
  if cardinality(p_ids)>300 then
    raise exception 'too_many_letters';
  end if;

  if coalesce(cardinality(p_ids),0)>0 then
    insert into public.sb_walk_mail_dismissals (account_id,game_env,scope,mail_id)
    select caller,p_env,p_code,entry.value->>0
    from public.sb_engine_tables t
    cross join lateral jsonb_array_elements(t.rows) as entry(value)
    where t.environment=p_env and t.name='GuildState'
      and entry.value->>0 = any(p_ids)
      and starts_with(entry.value->>0,'cw:mail:'||p_code||':')
      and (entry.value->>1)::jsonb->>'read'='true'
    on conflict do nothing;

    if p_env='live' then
      insert into public.sb_walk_mail_dismissals (account_id,game_env,scope,mail_id)
      select caller,p_env,'ranked','colosseum:'||e.match_id
      from public.sb_colosseum_rank_events e
      where e.account_id=caller and e.violation is not null and e.read_at is not null
        and ('colosseum:'||e.match_id) = any(p_ids)
      on conflict do nothing;
    end if;
  end if;

  select array_agg(d.mail_id) into hidden
  from public.sb_walk_mail_dismissals d
  where d.account_id=caller and d.game_env=p_env and d.scope in (p_code,'ranked');
  return coalesce(hidden,'{}');
end
$$;
revoke all on function public.sb_walk_mail_dismiss(text,text,text[]) from public, anon, authenticated;
grant execute on function public.sb_walk_mail_dismiss(text,text,text[]) to authenticated;

commit;
