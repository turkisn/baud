-- Staging only, run as test administrator. No fixtures or writes survive rollback.
-- These SQL claims test DB authorization, not Auth token issuance.
begin;
set local statement_timeout = '10s';
select set_config('test.admin_user', gen_random_uuid()::text, true);
insert into auth.users(id, email, raw_user_meta_data) values
  (current_setting('test.admin_user')::uuid,
   current_setting('test.admin_user') || '@admin-security.invalid',
   '{"role":"super_admin"}');

create function pg_temp.assert_admin_denied() returns void language plpgsql as $$
declare command text; denied boolean;
begin
  foreach command in array array[
    'select public.admin_log_action(''qa.security'',null,null,''{}'')',
    'select public.admin_register_mvp_product_file(gen_random_uuid(),''{}'')',
    'select public.admin_save_mvp_product(null,''{}'')',
    'select public.admin_save_mvp_supplier(null,''{}'')',
    'select public.admin_set_user_role(gen_random_uuid(),''super_admin'')',
    'select public.admin_verify_entity(''supplier'',gen_random_uuid(),''verified'',null)'
  ] loop
    denied := false;
    begin
      execute command;
    exception
      when insufficient_privilege then denied := true;
      when raise_exception then
        if sqlerrm ~ '^(Authentication required|Admin access required|Permission denied)' then
          denied := true;
        else raise; end if;
    end;
    assert denied, 'Administrative call was not denied: ' || command;
  end loop;
end $$;
grant execute on function pg_temp.assert_admin_denied() to authenticated, anon;

select set_config('request.jwt.claims', jsonb_build_object(
  'sub',current_setting('test.admin_user'),'role','authenticated',
  'user_metadata',jsonb_build_object('role','super_admin'))::text,true);
set local role authenticated;
do $$ begin
  assert public.get_my_role() = 'user', 'User-editable role claims must be ignored';
  perform pg_temp.assert_admin_denied();
end $$;
reset role;

-- A valid-looking identity with no profile must fail closed, not produce NULL guards.
select set_config('request.jwt.claims', jsonb_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
  assert public.get_my_role() = 'user', 'Missing profile must default to unprivileged role';
  perform pg_temp.assert_admin_denied();
end $$;
reset role;

select set_config('request.jwt.claims','{}',true);
set local role anon;
select pg_temp.assert_admin_denied();
reset role;

do $$ begin
  assert not exists (
    select from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' and not c.relrowsecurity
      and (has_table_privilege('anon',c.oid,'SELECT') or has_table_privilege('authenticated',c.oid,'SELECT'))
  ), 'An exposed readable public table is missing RLS';
  assert not exists (
    select from storage.buckets where id in ('product-files','product-datasheets','product-images','supplier-assets') and public
  ), 'Product storage buckets must remain private';
end $$;
select 'PASS: 18 admin-denial cases, forged role, missing profile, RLS and private buckets' as result;
rollback;
