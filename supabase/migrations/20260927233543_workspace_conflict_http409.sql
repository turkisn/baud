-- Business conflicts must not use 40001: PostgREST may retry it indefinitely.
-- PT409 returns HTTP 409 without retrying or changing the saved workspace.
create or replace function public.save_my_workspace(p_projects jsonb, p_expected_revision integer, p_mutation_id uuid)
returns public.user_workspaces language plpgsql security invoker set search_path = ''
set statement_timeout = '5s' as $$
declare result public.user_workspaces; actor uuid := auth.uid();
begin
  if actor is null or coalesce(auth.jwt()->>'is_anonymous','false') = 'true' then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 or p_mutation_id is null then
    raise exception 'Invalid workspace request' using errcode = '22023';
  end if;
  if p_expected_revision = 0 then
    insert into public.user_workspaces(owner_id,projects,revision,last_mutation_id)
      values (actor,p_projects,1,p_mutation_id) on conflict (owner_id) do nothing returning * into result;
    if found then return result; end if;
  end if;
  -- A lost response can be retried without applying the same write twice.
  select * into result from public.user_workspaces where owner_id=actor and last_mutation_id=p_mutation_id;
  if found then return result; end if;
  update public.user_workspaces set projects=p_projects,revision=revision+1,last_mutation_id=p_mutation_id
    where owner_id=actor and revision=p_expected_revision returning * into result;
  if not found then raise exception 'Workspace changed on another device' using errcode = 'PT409'; end if;
  return result;
end;
$$;
revoke all on function public.save_my_workspace(jsonb,integer,uuid) from public, anon;
grant execute on function public.save_my_workspace(jsonb,integer,uuid) to authenticated;
