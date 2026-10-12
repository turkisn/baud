-- LOCAL DISPOSABLE DATABASE ONLY. Run after all migrations, as postgres.
-- Never execute against staging/production: fixtures disable a profile trigger within rollback.
\set ON_ERROR_STOP on
begin;
set local statement_timeout = '15s';
insert into auth.users(id,email,raw_user_meta_data) values
 ('b0000000-0000-4000-8000-000000000001','launch-user@example.invalid','{"role":"super_admin","user_type":"interior_designer"}'),
 ('b0000000-0000-4000-8000-000000000002','launch-admin@example.invalid','{}'),
 ('b0000000-0000-4000-8000-000000000003','launch-reviewer@example.invalid','{}'),
 ('b0000000-0000-4000-8000-000000000004','launch-super@example.invalid','{}');
alter table public.profiles disable trigger enforce_profile_role_acl;
update public.profiles set role=case right(id::text,1) when '2' then 'admin' when '3' then 'reviewer' when '4' then 'super_admin' else 'user' end
where id::text like 'b0000000-%';
alter table public.profiles enable trigger enforce_profile_role_acl;
create function pg_temp.denied(sql text) returns void language plpgsql as $$
begin
  begin execute sql;
  exception when insufficient_privilege then return;
  end;
  raise exception 'Expected privilege denial: %',sql;
end $$;
grant execute on function pg_temp.denied(text) to authenticated,anon;
select set_config('request.jwt.claims','{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 assert public.get_my_role()='user','Signup classification must never elevate role';
 perform pg_temp.denied($q$update public.profiles set role='admin' where id=auth.uid()$q$);
 perform pg_temp.denied($q$insert into public.profiles(id,role) values(gen_random_uuid(),'super_admin')$q$);
 perform pg_temp.denied($q$delete from public.profiles where id=auth.uid()$q$);
 update public.profiles set full_name='Allowed self edit' where id=auth.uid();
 assert (select full_name='Allowed self edit' from public.profiles where id=auth.uid());
 perform public.record_usage_event('catalog_view');
 assert (select count(*) from public.usage_events)=0,'Events must remain private';
end $$;
-- Direct backdated inserts are stamped by the server and count against the same limit.
insert into public.usage_events(event_name,created_at) values('catalog_view','2000-01-01');
reset role;
do $$ begin
 assert (select min(created_at)>now()-interval '1 minute' from public.usage_events where user_id='b0000000-0000-4000-8000-000000000001');
end $$;
select set_config('request.jwt.claims','{"sub":"b0000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
set local role authenticated;
do $$ declare command text; rejected boolean; begin
 assert (select count(*) from public.profiles)=1,'Reviewer may only read own profile';
 perform pg_temp.denied($q$select public.admin_log_action('forged',null,null,'{}')$q$);
 foreach command in array array[
  'select public.admin_save_mvp_product_bundle(null,''{}'',''[]'')',
  'select public.admin_save_mvp_supplier(null,''{}'')',
  'select public.admin_set_user_role(gen_random_uuid(),''user'')',
  'select public.admin_verify_entity(''supplier'',gen_random_uuid(),''verified'',null)'
 ] loop
  rejected:=false;
  begin execute command;
  exception when insufficient_privilege then rejected:=true;
  when raise_exception then
   if sqlerrm ~ '^(Admin access required|Permission denied)' then rejected:=true; else raise; end if;
  end;
  assert rejected,'Reviewer administrative RPC was accepted';
 end loop;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"b0000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
do $$ declare p public.products; rejected boolean:=false; before_audit bigint;
begin
 perform pg_temp.denied($q$select public.admin_log_action('forged',null,null,'{}')$q$);
 perform pg_temp.denied($q$delete from public.profiles where role='super_admin'$q$);
 perform pg_temp.denied($q$insert into public.profiles(id,role) values(gen_random_uuid(),'super_admin')$q$);
 p:=public.admin_save_mvp_product_bundle(null,'{"product_name_en":"Launch SQL draft","product_name_ar":"اختبار"}','[]');
 assert p.license_download is false,'New products require explicit download permission';
 select count(*) into before_audit from public.admin_audit_log;
 begin
  perform public.admin_save_mvp_product_bundle(p.id,'{"product_name_en":"Should roll back"}',
    '[{"specification_name_en":"Name","value":"x","data_type":"invalid"}]');
 exception when raise_exception then rejected:=true; end;
 assert rejected,'Invalid specification must reject entire save';
 assert (select product_name_en='Launch SQL draft' from public.products where id=p.id),'Product changed after failure';
 assert (select count(*)=before_audit from public.admin_audit_log),'Audit should roll back with operation';
 perform public.admin_save_mvp_product_bundle(p.id,'{"product_name_en":"Updated"}',
   '[{"specification_name_en":"Width","value":"12","data_type":"number"}]');
 assert (select count(*)=1 from public.product_specifications where product_id=p.id);
 assert (select count(*)>before_audit from public.admin_audit_log),'Trusted mutation must append audit';
 -- Fail AFTER the product UPDATE and specification DELETE, proving rollback
 -- across the complete transaction rather than only preflight validation.
 select count(*) into before_audit from public.admin_audit_log;
 rejected:=false;
 begin
  perform public.admin_save_mvp_product_bundle(p.id,'{"product_name_en":"Must not persist"}',
    jsonb_build_array(jsonb_build_object('specification_name_en',repeat('x',201),'value','12','data_type','text')));
 exception when string_data_right_truncation then rejected:=true; end;
 assert rejected,'Oversize specification must fail after product mutation';
 assert (select product_name_en='Updated' from public.products where id=p.id),'Late failure changed product';
 assert (select count(*)=1 and min(value)='12' from public.product_specifications where product_id=p.id),'Late failure deleted specifications';
 assert (select count(*)=before_audit from public.admin_audit_log),'Late failure retained audit claims';
end $$;
reset role;
-- Super-admin paths remain guarded; successful changes have trusted audit.
select set_config('request.jwt.claims','{"sub":"b0000000-0000-4000-8000-000000000004","role":"authenticated"}',true);
set local role authenticated;
do $$ declare rejected boolean:=false;
begin
 perform pg_temp.denied($q$update public.profiles set role='user' where id=auth.uid()$q$);
 begin perform public.admin_set_user_role(auth.uid(),'user');
 exception when raise_exception then rejected:=sqlerrm='Cannot change own role'; end;
 assert rejected,'Self demotion must be denied';
 rejected:=false;
 begin perform public.admin_set_user_role('b0000000-0000-4000-8000-000000000002',null);
 exception when raise_exception then rejected:=sqlerrm='Invalid authorization role'; end;
 assert rejected,'Null role must be denied';
 perform public.admin_set_user_role('b0000000-0000-4000-8000-000000000003','admin');
 assert (select role='admin' from public.profiles where id='b0000000-0000-4000-8000-000000000003');
 perform public.admin_set_user_role('b0000000-0000-4000-8000-000000000003','reviewer');
 assert (select count(*)=1 from public.profiles where role='super_admin'),'Last super-admin retained';
 assert exists(select from public.admin_audit_log where action='user.role_change' and actor_user_id=auth.uid());
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
do $$ declare rejected boolean:=false; i int;
begin
 for i in 1..118 loop perform public.record_usage_event('catalog_view'); end loop;
 begin
  insert into public.usage_events(event_name,created_at) values('catalog_view','2000-01-01');
 exception when raise_exception then
  if sqlerrm='Event rate limit exceeded' then rejected:=true; else raise; end if;
 end;
 assert rejected,'Backdating must not bypass the 120/minute limit';
 perform pg_temp.denied($q$insert into storage.objects(bucket_id,name) values('supplier-documents',auth.uid()::text||'/document.pdf')$q$);
 perform pg_temp.denied($q$insert into storage.objects(bucket_id,name) values('ownership-proofs',auth.uid()::text||'/proof.pdf')$q$);
end $$;
reset role;
-- Verify actual storage visibility with a synthetic published licensed/unlicensed file.
-- Publication trigger also runs for postgres, so provision with the synthetic
-- admin identity instead of accidentally creating a draft with empty claims.
select set_config('request.jwt.claims','{"sub":"b0000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
insert into public.categories(id,code,name_ar,name_en) values
 ('b1000000-0000-4000-8000-000000000001','QALCH','اختبار','Launch test');
insert into public.suppliers(id,company_name_ar,company_name_en,slug,is_published) values
 ('b1000000-0000-4000-8000-000000000002','اختبار','Launch supplier','launch-sql-supplier',true);
insert into public.products(id,product_name_ar,product_name_en,category_id,supplier_id,slug,status,visibility,rights_confirmed,license_download) values
 ('b1000000-0000-4000-8000-000000000003','اختبار','Launch product','b1000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000002','launch-sql-product','approved','public',true,false);
insert into storage.objects(bucket_id,name) values('product-files','b1000000-0000-4000-8000-000000000003/test.ifc');
insert into public.product_files(product_id,file_type,file_format,storage_bucket,file_path,is_available) values
 ('b1000000-0000-4000-8000-000000000003','block','IFC','product-files','b1000000-0000-4000-8000-000000000003/test.ifc',true);
select set_config('request.jwt.claims','{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
 assert not exists(select from storage.objects where name='b1000000-0000-4000-8000-000000000003/test.ifc'), 'Unlicensed storage download exposed';
end $$;
reset role;
update public.products set license_download=true where id='b1000000-0000-4000-8000-000000000003';
set local role authenticated;
do $$ begin
 assert exists(select from storage.objects where name='b1000000-0000-4000-8000-000000000003/test.ifc'), 'Licensed published storage object unavailable';
end $$;
reset role;
update public.categories set is_active=false where id='b1000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claims','{"sub":"b0000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select public.admin_save_mvp_product_bundle('b1000000-0000-4000-8000-000000000003','{"publication_state":"archived"}','[]');
reset role;
select 'PASS: launch security assertions' as result;
rollback;
