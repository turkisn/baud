create or replace function public.admin_set_user_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  caller_role text;
  target_role text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if new_role not in ('user','designer','supplier','manufacturer','reviewer','admin','super_admin') then
    raise exception 'Invalid role';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Cannot change own role';
  end if;

  caller_role := public.get_my_role();
  if caller_role not in ('admin','super_admin') then
    raise exception 'Permission denied';
  end if;

  select role into target_role
  from public.profiles
  where id = target_user_id;

  if target_role is null then
    raise exception 'Target user not found';
  end if;

  if caller_role = 'admin'
     and (new_role in ('admin','super_admin') or target_role in ('admin','super_admin')) then
    raise exception 'Only super_admin may manage admin roles';
  end if;

  update public.profiles
  set role = new_role
  where id = target_user_id;

  perform public.admin_log_action(
    'user.role_change',
    'user',
    target_user_id,
    jsonb_build_object('old_role', target_role, 'new_role', new_role)
  );
end;
$function$;

create or replace function public.admin_verify_entity(
  p_entity_type text,
  p_entity_id uuid,
  p_new_status text,
  p_notes text default null::text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_caller_role text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_entity_type not in ('supplier','manufacturer') then
    raise exception 'Invalid entity_type "%". Must be supplier or manufacturer.', p_entity_type;
  end if;

  if p_new_status not in ('unverified','pending','verified') then
    raise exception 'Invalid status "%". Must be unverified, pending, or verified.', p_new_status;
  end if;

  v_caller_role := public.get_my_role();
  if v_caller_role not in ('admin','super_admin') then
    raise exception 'Permission denied: only admin or super_admin may verify entities.';
  end if;

  if p_entity_type = 'supplier' then
    update public.suppliers
    set verification_status = p_new_status, updated_at = now()
    where id = p_entity_id;
    if not found then raise exception 'Supplier % not found.', p_entity_id; end if;
  else
    update public.manufacturers
    set verification_status = p_new_status, updated_at = now()
    where id = p_entity_id;
    if not found then raise exception 'Manufacturer % not found.', p_entity_id; end if;
  end if;

  perform public.admin_log_action(
    p_entity_type || '.verification_change',
    p_entity_type,
    p_entity_id,
    jsonb_build_object('new_status', p_new_status, 'notes', p_notes)
  );
end;
$function$;

revoke all on function public.admin_set_user_role(uuid,text) from public, anon;
revoke all on function public.admin_verify_entity(text,uuid,text,text) from public, anon;
grant execute on function public.admin_set_user_role(uuid,text) to authenticated;
grant execute on function public.admin_verify_entity(text,uuid,text,text) to authenticated;
