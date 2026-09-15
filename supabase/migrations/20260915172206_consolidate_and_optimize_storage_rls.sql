-- Remove overlapping storage reads and evaluate authorization helpers once per query.
-- Public assets remain readable only when they are attached to published records;
-- authenticated downloads remain limited to registered, available product files.

begin;

drop policy if exists "mvp_product_images_public_read" on storage.objects;
drop policy if exists "mvp_product_images_admin_read" on storage.objects;

create policy "mvp_product_images_anon_read"
on storage.objects
for select
to anon
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.product_images pi
    join public.products p on p.id = pi.product_id
    where pi.image_path = storage.objects.name
      and pi.is_available = true
      and p.status = 'approved'
      and p.visibility = 'public'
  )
);

create policy "mvp_product_images_authenticated_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'product-images'
  and (
    (select public.get_my_role()) = any (array['admin', 'super_admin'])
    or exists (
      select 1
      from public.product_images pi
      join public.products p on p.id = pi.product_id
      where pi.image_path = storage.objects.name
        and pi.is_available = true
        and p.status = 'approved'
        and p.visibility = 'public'
    )
  )
);

drop policy if exists "mvp_supplier_assets_public_read" on storage.objects;
drop policy if exists "mvp_supplier_assets_admin_read" on storage.objects;

create policy "mvp_supplier_assets_anon_read"
on storage.objects
for select
to anon
using (
  bucket_id = 'supplier-assets'
  and exists (
    select 1
    from public.suppliers s
    where s.is_published = true
      and (s.logo_path = storage.objects.name or s.cover_image_path = storage.objects.name)
  )
);

create policy "mvp_supplier_assets_authenticated_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'supplier-assets'
  and (
    (select public.get_my_role()) = any (array['admin', 'super_admin'])
    or exists (
      select 1
      from public.suppliers s
      where s.is_published = true
        and (s.logo_path = storage.objects.name or s.cover_image_path = storage.objects.name)
    )
  )
);

drop policy if exists "mvp_product_files_admin_read" on storage.objects;
drop policy if exists "mvp_product_files_authenticated_read" on storage.objects;

create policy "mvp_product_files_authenticated_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'product-files'
  and (
    (select public.get_my_role()) = any (array['admin', 'super_admin'])
    or exists (
      select 1
      from public.product_files pf
      join public.products p on p.id = pf.product_id
      where pf.storage_bucket = 'product-files'
        and pf.file_path = storage.objects.name
        and coalesce(pf.file_type, 'block') = 'block'
        and pf.is_available = true
        and p.status = 'approved'
        and p.visibility = 'public'
    )
  )
);

drop policy if exists "mvp_datasheets_authenticated_read" on storage.objects;

create policy "mvp_datasheets_authenticated_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'product-datasheets'
  and (
    (select public.get_my_role()) = any (array['admin', 'super_admin'])
    or exists (
      select 1
      from public.product_files pf
      join public.products p on p.id = pf.product_id
      where pf.storage_bucket = 'product-datasheets'
        and pf.file_path = storage.objects.name
        and pf.file_type = 'datasheet'
        and pf.is_available = true
        and p.status = 'approved'
        and p.visibility = 'public'
    )
  )
);

drop policy if exists "docs_owner_read" on storage.objects;
create policy "docs_owner_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = any (array['supplier-documents', 'ownership-proofs'])
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select public.get_my_role()) = any (array['admin', 'super_admin'])
  )
);

drop policy if exists "mvp_product_images_admin_insert" on storage.objects;
create policy "mvp_product_images_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
);

drop policy if exists "mvp_product_images_admin_update" on storage.objects;
create policy "mvp_product_images_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
)
with check (
  bucket_id = 'product-images'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
);

drop policy if exists "mvp_product_images_admin_delete" on storage.objects;
create policy "mvp_product_images_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
);

drop policy if exists "mvp_supplier_assets_admin_insert" on storage.objects;
create policy "mvp_supplier_assets_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'supplier-assets'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
);

drop policy if exists "mvp_supplier_assets_admin_update" on storage.objects;
create policy "mvp_supplier_assets_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'supplier-assets'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
)
with check (
  bucket_id = 'supplier-assets'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
);

drop policy if exists "mvp_supplier_assets_admin_delete" on storage.objects;
create policy "mvp_supplier_assets_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'supplier-assets'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
);

drop policy if exists "mvp_product_files_admin_insert" on storage.objects;
create policy "mvp_product_files_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-files'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
);

drop policy if exists "mvp_product_files_admin_update" on storage.objects;
create policy "mvp_product_files_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-files'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
)
with check (
  bucket_id = 'product-files'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
);

drop policy if exists "mvp_product_files_admin_delete" on storage.objects;
create policy "mvp_product_files_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-files'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
);

drop policy if exists "mvp_datasheets_admin_write" on storage.objects;
create policy "mvp_datasheets_admin_write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-datasheets'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
);

drop policy if exists "mvp_datasheets_admin_update" on storage.objects;
create policy "mvp_datasheets_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-datasheets'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
)
with check (
  bucket_id = 'product-datasheets'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
);

drop policy if exists "mvp_datasheets_admin_delete" on storage.objects;
create policy "mvp_datasheets_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-datasheets'
  and (select public.get_my_role()) = any (array['admin', 'super_admin'])
);

commit;
