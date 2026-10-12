-- Run after every staging migration as an administrator. Read-only assertions.
-- This is a release gate, not a penetration test or a substitute for backups.
begin;
set local statement_timeout = '15s';

do $contract$
declare
  required_function text;
begin
  assert not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
      and (
        has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
        or has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
      )
  ), 'Every exposed public table must have RLS';

  assert not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
      and not coalesce(c.reloptions, '{}'::text[]) @> array['security_invoker=true']
  ), 'Every public view must use security_invoker';

  assert not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and (
        has_function_privilege('anon', p.oid, 'EXECUTE')
        or has_function_privilege('authenticated', p.oid, 'EXECUTE')
      )
  ), 'No exposed SECURITY DEFINER function may be callable by API roles';

  assert not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'v', 'm')
      and has_table_privilege('anon', c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER,REFERENCES')
  ), 'Anonymous API role must remain read-only';

  assert not has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE'),
    'Users must never update authorization roles directly';

  assert not exists (
    select 1 from storage.buckets
    where id in (
      'ownership-proofs', 'product-datasheets', 'product-files',
      'product-images', 'supplier-assets', 'supplier-documents'
    ) and public
  ), 'All BUOD storage buckets must remain private';

  foreach required_function in array array[
    'admin_log_action(text,text,uuid,jsonb)',
    'admin_register_mvp_product_file(uuid,jsonb)',
    'admin_save_mvp_product(uuid,jsonb)',
    'admin_save_mvp_supplier(uuid,jsonb)',
    'admin_set_user_role(uuid,text)',
    'admin_verify_entity(text,uuid,text,text)'
  ] loop
    assert exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.oid = ('public.' || required_function)::regprocedure
        and not p.prosecdef
    ), 'Missing SECURITY INVOKER API façade: ' || required_function;

    assert exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'private'
        and p.oid = ('private.' || required_function)::regprocedure
        and p.prosecdef
        and has_function_privilege('authenticated', p.oid, 'EXECUTE')
        and not has_function_privilege('anon', p.oid, 'EXECUTE')
    ), 'Missing isolated privileged implementation: ' || required_function;
  end loop;

  assert not exists (
    select 1
    from pg_default_acl d
    cross join lateral aclexplode(d.defaclacl) a
    join pg_roles r on r.oid = a.grantee
    where d.defaclrole = 'postgres'::regrole
      and d.defaclnamespace = 'public'::regnamespace
      and r.rolname in ('anon', 'authenticated', 'service_role')
      and (
        (d.defaclobjtype = 'r' and a.privilege_type in ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'))
        or (d.defaclobjtype = 'S' and a.privilege_type in ('USAGE','SELECT','UPDATE'))
        or (d.defaclobjtype = 'f' and a.privilege_type = 'EXECUTE')
      )
  ), 'Future public objects must be deny-by-default';
end
$contract$;

select 'PASS: BUOD backend security contract' as result;
rollback;
