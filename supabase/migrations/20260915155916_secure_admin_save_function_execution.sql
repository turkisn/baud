-- Keep the admin save flows working after public catalogue SELECT privileges
-- were narrowed to safe columns. These functions return complete composite
-- rows, so SECURITY INVOKER would require every caller to have SELECT access
-- to internal columns such as admin notes and supplier contact details.
--
-- Both functions enforce admin/super_admin authorization before touching data.
-- SECURITY DEFINER lets that guarded code return the saved row without
-- re-opening those internal columns to every authenticated account.

alter function public.admin_save_mvp_product(uuid, jsonb)
  security definer;
alter function public.admin_save_mvp_product(uuid, jsonb)
  set search_path = public;

alter function public.admin_save_mvp_supplier(uuid, jsonb)
  security definer;
alter function public.admin_save_mvp_supplier(uuid, jsonb)
  set search_path = public, storage;

revoke all on function public.admin_save_mvp_product(uuid, jsonb) from public, anon;
revoke all on function public.admin_save_mvp_supplier(uuid, jsonb) from public, anon;
grant execute on function public.admin_save_mvp_product(uuid, jsonb) to authenticated;
grant execute on function public.admin_save_mvp_supplier(uuid, jsonb) to authenticated;

comment on function public.admin_save_mvp_product(uuid, jsonb) is
  'Admin-only product upsert. SECURITY DEFINER permits returning the complete row after column-level public grants are restricted; authorization fails closed through get_my_role().';
comment on function public.admin_save_mvp_supplier(uuid, jsonb) is
  'Admin-only supplier upsert. SECURITY DEFINER permits returning the complete row after column-level public grants are restricted; authorization fails closed through get_my_role().';
