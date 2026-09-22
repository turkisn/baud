-- MVP downloads require authentication; supplier window assets are public only for published suppliers.

drop policy if exists files_public_free_read on storage.objects;
drop policy if exists mvp_product_files_authenticated_read on storage.objects;
drop policy if exists mvp_product_files_admin_read on storage.objects;

create policy mvp_product_files_authenticated_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'product-files'
  and exists (
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
);

create policy mvp_product_files_admin_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'product-files'
  and public.get_my_role() in ('admin','super_admin')
);

update storage.buckets
set public = false
where id = 'supplier-assets';

drop policy if exists mvp_supplier_assets_public_read on storage.objects;
drop policy if exists mvp_supplier_assets_admin_read on storage.objects;

create policy mvp_supplier_assets_public_read
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'supplier-assets'
  and exists (
    select 1
    from public.suppliers s
    where s.is_published = true
      and (s.logo_path = storage.objects.name or s.cover_image_path = storage.objects.name)
  )
);

create policy mvp_supplier_assets_admin_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'supplier-assets'
  and public.get_my_role() in ('admin','super_admin')
);

-- Product file metadata is never readable anonymously; signed-in users only see available files on public products.
drop policy if exists product_files_authenticated_read on public.product_files;
create policy product_files_authenticated_read
on public.product_files for select
to authenticated
using (
  is_available = true
  and exists (
    select 1 from public.products p
    where p.id = product_files.product_id
      and p.status = 'approved'
      and p.visibility = 'public'
  )
);

-- Keep the counter callable only after authentication.
revoke execute on function public.increment_download_count(uuid) from public, anon;
grant execute on function public.increment_download_count(uuid) to authenticated;
