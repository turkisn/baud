revoke all on table public.admin_audit_log from anon;
revoke all on table public.admin_audit_log from authenticated;
grant select on table public.admin_audit_log to authenticated;

create or replace function public.admin_log_action(
  p_action text,
  p_target_type text default null::text,
  p_target_id uuid default null::uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_caller_role text;
  v_new_id uuid;
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  v_caller_role := public.get_my_role();
  if v_caller_role not in ('admin','super_admin','reviewer') then
    raise exception 'Permission denied: only admin, super_admin, or reviewer may write audit logs.';
  end if;

  if p_action is null or p_action !~ '^[a-z0-9_.-]{1,100}$' then
    raise exception 'Invalid audit action';
  end if;

  if p_target_type is not null and (length(p_target_type) < 1 or length(p_target_type) > 100) then
    raise exception 'Invalid target type';
  end if;

  if octet_length(v_metadata::text) > 8192 then
    raise exception 'Audit metadata too large';
  end if;

  insert into public.admin_audit_log(actor_user_id, action, target_type, target_id, metadata)
  values(auth.uid(), p_action, p_target_type, p_target_id, v_metadata)
  returning id into v_new_id;

  return v_new_id;
end;
$function$;

revoke all on function public.admin_log_action(text,text,uuid,jsonb) from public, anon;
grant execute on function public.admin_log_action(text,text,uuid,jsonb) to authenticated;
