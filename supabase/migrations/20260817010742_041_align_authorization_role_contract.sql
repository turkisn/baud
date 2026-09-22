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

  -- Authorization roles are intentionally separate from user_type segmentation.
  -- Designers, offices, contractors, suppliers, etc. remain role=user and are
  -- classified through profiles.user_type.
  if new_role not in ('user','reviewer','admin','super_admin') then
    raise exception 'Invalid authorization role';
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

revoke all on function public.admin_set_user_role(uuid,text) from public, anon;
grant execute on function public.admin_set_user_role(uuid,text) to authenticated;
