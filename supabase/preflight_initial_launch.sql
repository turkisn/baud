-- READ ONLY. Owner-reviewed staging preflight; not executed against live services.
-- Confirm project uhcvfwajowdszxteanlx in the dashboard/connection before running.
-- Do not run the disposable test fixtures against staging.
begin read only;
set local statement_timeout = '15s';

select current_database() as database_name, current_setting('server_version') as postgres_version;
select version, name from supabase_migrations.schema_migrations order by version;
select to_regprocedure('public.admin_save_mvp_product_bundle(uuid,jsonb,jsonb)') as bundle_rpc;
select count(*) filter (where role = 'super_admin') as super_admin_count,
       count(*) filter (where role not in ('user','reviewer','admin','super_admin') or role is null) as invalid_authorization_roles
from public.profiles;

select count(*) as published_products,
       count(*) filter (where p.rights_confirmed is not true) as rights_unconfirmed,
       count(*) filter (where p.slug is null or btrim(p.slug) = '') as missing_slug,
       count(*) filter (where p.license_download is not true) as downloads_disabled,
       count(*) filter (where c.id is null or c.is_active is not true) as invalid_category,
       count(*) filter (where p.subcategory_id is not null and
         (sc.id is null or sc.category_id is distinct from p.category_id or sc.is_active is not true)) as invalid_subcategory,
       count(*) filter (where s.id is null or s.is_published is not true or s.slug is null or btrim(s.slug) = '') as invalid_supplier,
       count(*) filter (where not exists (select 1 from public.product_files f where f.product_id=p.id and f.is_available)) as no_available_file_records,
       count(*) filter (where not exists (select 1 from public.product_images i where i.product_id=p.id)) as no_image_records
from public.products p
left join public.categories c on c.id=p.category_id
left join public.subcategories sc on sc.id=p.subcategory_id
left join public.suppliers s on s.id=p.supplier_id
where p.status='approved' and p.visibility='public';
-- Record availability is not proof that an object exists or that rights are valid.
select count(*) as legacy_invalid_specification_types from public.product_specifications
where data_type not in ('text','number','boolean','date','url');

select bucket_id, count(*) as object_count from storage.objects
where bucket_id in ('supplier-documents','ownership-proofs','product-files','product-datasheets')
group by bucket_id order by bucket_id;
select id, public, file_size_limit, allowed_mime_types from storage.buckets
where id in ('supplier-documents','ownership-proofs','product-files','product-datasheets');
select tablename, policyname, permissive, roles, cmd from pg_policies
where (schemaname='public' and tablename in ('profiles','usage_events','project_product_instances'))
   or (schemaname='storage' and tablename='objects')
order by schemaname,tablename,policyname;
commit;
