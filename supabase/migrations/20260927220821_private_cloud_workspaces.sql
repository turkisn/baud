-- Personal workspaces only. Team sharing requires a separate membership model.
create function private.valid_workspace_projects(items jsonb)
returns boolean language plpgsql immutable security invoker set search_path = ''
as $$
declare item jsonb; product jsonb;
begin
  if items is null or jsonb_typeof(items) <> 'array' then return false; end if;
  if jsonb_array_length(items) > 50 or octet_length(items::text) > 2097152 then return false; end if;
  if (select count(distinct x->>'id') from jsonb_array_elements(items) x) <> jsonb_array_length(items) then return false; end if;
  for item in select value from jsonb_array_elements(items) loop
    if jsonb_typeof(item) <> 'object'
      or jsonb_typeof(item->'id') is distinct from 'string'
      or length(item->>'id') not between 1 and 128
      or jsonb_typeof(item->'name') is distinct from 'string'
      or length(trim(item->>'name')) not between 1 and 100
      or jsonb_typeof(item->'products') is distinct from 'array' then return false; end if;
    if jsonb_array_length(item->'products') > 250 then return false; end if;
    if (select count(distinct x->>'id') from jsonb_array_elements(item->'products') x) <> jsonb_array_length(item->'products') then return false; end if;
    for product in select value from jsonb_array_elements(item->'products') loop
      if jsonb_typeof(product) <> 'object' or jsonb_typeof(product->'id') is distinct from 'string'
        or length(product->>'id') not between 1 and 128 then return false; end if;
    end loop;
  end loop;
  return true;
end;
$$;
revoke all on function private.valid_workspace_projects(jsonb) from public, anon;
grant execute on function private.valid_workspace_projects(jsonb) to authenticated;

create table public.user_workspaces (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  projects jsonb not null default '[]'::jsonb check (private.valid_workspace_projects(projects)),
  revision integer not null default 1 check (revision > 0),
  last_mutation_id uuid not null,
  updated_at timestamptz not null default now()
);
alter table public.user_workspaces enable row level security;
create policy workspace_owner_read on public.user_workspaces for select to authenticated
  using (owner_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'false') <> 'true');
create policy workspace_owner_insert on public.user_workspaces for insert to authenticated
  with check (owner_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'false') <> 'true');
create policy workspace_owner_update on public.user_workspaces for update to authenticated
  using (owner_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'false') <> 'true')
  with check (owner_id = (select auth.uid()) and coalesce((select auth.jwt()->>'is_anonymous'),'false') <> 'true');
revoke all on public.user_workspaces from public, anon, authenticated;
grant select on public.user_workspaces to authenticated;
grant insert (owner_id,projects,revision,last_mutation_id) on public.user_workspaces to authenticated;
grant update (projects,revision,last_mutation_id) on public.user_workspaces to authenticated;

create function private.guard_workspace_revision()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if (tg_op = 'INSERT' and new.revision <> 1)
    or (tg_op = 'UPDATE' and (new.owner_id <> old.owner_id or new.revision <> old.revision + 1)) then
    raise exception 'Invalid workspace revision' using errcode = '23514';
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function private.guard_workspace_revision() from public, anon, authenticated;
create trigger workspace_revision_guard before insert or update on public.user_workspaces
  for each row execute function private.guard_workspace_revision();

create function public.save_my_workspace(p_projects jsonb, p_expected_revision integer, p_mutation_id uuid)
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
  if not found then raise exception 'Workspace changed on another device' using errcode = '40001'; end if;
  return result;
end;
$$;
revoke all on function public.save_my_workspace(jsonb,integer,uuid) from public, anon;
grant execute on function public.save_my_workspace(jsonb,integer,uuid) to authenticated;
