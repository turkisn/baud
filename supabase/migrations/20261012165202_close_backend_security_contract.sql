begin;

-- BUOD backend security boundary.
--
-- Elevated implementation functions live in a schema that is not exposed by
-- PostgREST.  The public schema contains only SECURITY INVOKER façades with
-- stable signatures for existing clients.  This removes privileged code from
-- the public API surface while keeping authorization and validation inside the
-- audited implementations.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

alter function public.admin_log_action(text, text, uuid, jsonb)
  set schema private;
alter function public.admin_register_mvp_product_file(uuid, jsonb)
  set schema private;
alter function public.admin_save_mvp_product(uuid, jsonb)
  set schema private;
alter function public.admin_save_mvp_supplier(uuid, jsonb)
  set schema private;
alter function public.admin_set_user_role(uuid, text)
  set schema private;
alter function public.admin_verify_entity(text, uuid, text, text)
  set schema private;

revoke all on all functions in schema private from public, anon;
grant execute on function private.admin_log_action(text, text, uuid, jsonb) to authenticated;
grant execute on function private.admin_register_mvp_product_file(uuid, jsonb) to authenticated;
grant execute on function private.admin_save_mvp_product(uuid, jsonb) to authenticated;
grant execute on function private.admin_save_mvp_supplier(uuid, jsonb) to authenticated;
grant execute on function private.admin_set_user_role(uuid, text) to authenticated;
grant execute on function private.admin_verify_entity(text, uuid, text, text) to authenticated;

create function public.admin_log_action(
  p_action text,
  p_target_type text default null,
  p_target_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language sql
security invoker
set search_path = pg_catalog, public, private
as $function$
  select private.admin_log_action(p_action, p_target_type, p_target_id, p_metadata)
$function$;

create function public.admin_register_mvp_product_file(
  p_product_id uuid,
  p_payload jsonb
)
returns public.product_files
language sql
security invoker
set search_path = pg_catalog, public, private
as $function$
  select private.admin_register_mvp_product_file(p_product_id, p_payload)
$function$;

create function public.admin_save_mvp_product(
  p_product_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns public.products
language sql
security invoker
set search_path = pg_catalog, public, private
as $function$
  select private.admin_save_mvp_product(p_product_id, p_payload)
$function$;

create function public.admin_save_mvp_supplier(
  p_supplier_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns public.suppliers
language sql
security invoker
set search_path = pg_catalog, public, private
as $function$
  select private.admin_save_mvp_supplier(p_supplier_id, p_payload)
$function$;

create function public.admin_set_user_role(
  target_user_id uuid,
  new_role text
)
returns void
language sql
security invoker
set search_path = pg_catalog, public, private
as $function$
  select private.admin_set_user_role(target_user_id, new_role)
$function$;

create function public.admin_verify_entity(
  p_entity_type text,
  p_entity_id uuid,
  p_new_status text,
  p_notes text default null
)
returns void
language sql
security invoker
set search_path = pg_catalog, public, private
as $function$
  select private.admin_verify_entity(p_entity_type, p_entity_id, p_new_status, p_notes)
$function$;

revoke all on function public.admin_log_action(text, text, uuid, jsonb) from public, anon;
revoke all on function public.admin_register_mvp_product_file(uuid, jsonb) from public, anon;
revoke all on function public.admin_save_mvp_product(uuid, jsonb) from public, anon;
revoke all on function public.admin_save_mvp_supplier(uuid, jsonb) from public, anon;
revoke all on function public.admin_set_user_role(uuid, text) from public, anon;
revoke all on function public.admin_verify_entity(text, uuid, text, text) from public, anon;

grant execute on function public.admin_log_action(text, text, uuid, jsonb) to authenticated;
grant execute on function public.admin_register_mvp_product_file(uuid, jsonb) to authenticated;
grant execute on function public.admin_save_mvp_product(uuid, jsonb) to authenticated;
grant execute on function public.admin_save_mvp_supplier(uuid, jsonb) to authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;
grant execute on function public.admin_verify_entity(text, uuid, text, text) to authenticated;

comment on function public.admin_log_action(text, text, uuid, jsonb) is
  'Unprivileged API façade. Elevated implementation is isolated in private schema.';
comment on function public.admin_register_mvp_product_file(uuid, jsonb) is
  'Unprivileged API façade. Elevated implementation is isolated in private schema.';
comment on function public.admin_save_mvp_product(uuid, jsonb) is
  'Unprivileged API façade. Elevated implementation is isolated in private schema.';
comment on function public.admin_save_mvp_supplier(uuid, jsonb) is
  'Unprivileged API façade. Elevated implementation is isolated in private schema.';
comment on function public.admin_set_user_role(uuid, text) is
  'Unprivileged API façade. Elevated implementation is isolated in private schema.';
comment on function public.admin_verify_entity(text, uuid, text, text) is
  'Unprivileged API façade. Elevated implementation is isolated in private schema.';

-- Opt in to the new Supabase deny-by-default posture for future objects.  Every
-- new API object must ship with explicit grants and RLS in the same migration.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete, truncate, references, trigger, maintain
  on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select, update on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;

alter default privileges for role postgres in schema private
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema private
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated, service_role;

commit;
