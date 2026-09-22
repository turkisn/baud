-- Harden analytics ingestion without exposing a SECURITY DEFINER RPC.

create or replace function public.set_usage_event_user_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if new.event_name not in (
    'page_view','product_view','supplier_view','search','filter',
    'block_download','datasheet_download','sign_in','sign_up','profile_update'
  ) then
    raise exception 'Unsupported event';
  end if;

  if octet_length(coalesce(new.metadata, '{}'::jsonb)::text) > 8192 then
    raise exception 'Metadata too large';
  end if;

  new.user_id := v_uid;
  select p.user_type into new.user_type
  from public.profiles p
  where p.id = v_uid;

  if new.user_type is null then
    raise exception 'Profile not found';
  end if;

  return new;
end;
$$;

revoke all on function public.set_usage_event_user_snapshot() from public, anon, authenticated;

grant insert on public.usage_events to authenticated;
drop policy if exists usage_events_insert_own on public.usage_events;
create policy usage_events_insert_own
on public.usage_events for insert
to authenticated
with check (user_id = auth.uid());

create or replace function public.record_usage_event(
  p_event_name text,
  p_product_id uuid default null,
  p_supplier_id uuid default null,
  p_session_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  insert into public.usage_events(event_name, product_id, supplier_id, session_id, metadata)
  values (p_event_name, p_product_id, p_supplier_id, p_session_id, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_event_id;
  return v_event_id;
end;
$$;

revoke all on function public.record_usage_event(text,uuid,uuid,uuid,jsonb) from public, anon;
grant execute on function public.record_usage_event(text,uuid,uuid,uuid,jsonb) to authenticated;
