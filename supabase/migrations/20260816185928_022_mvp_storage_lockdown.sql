begin;

-- Product block files: authenticated downloads only, admin-only mutation.
drop policy if exists files_owner_upload on storage.objects;
drop policy if exists files_owner_read on storage.objects;
drop policy if exists files_owner_delete on storage.objects;
drop policy if exists files_public_free_read on storage.objects;

drop policy if exists mvp_product_files_admin_insert on storage.objects;
create policy mvp_product_files_admin_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-files'
  and public.get_my_role() = any(array['admin','super_admin']::text[])
);

drop policy if exists mvp_product_files_admin_update on storage.objects;
create policy mvp_product_files_admin_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-files'
  and public.get_my_role() = any(array['admin','super_admin']::text[])
)
with check (
  bucket_id = 'product-files'
  and public.get_my_role() = any(array['admin','super_admin']::text[])
);

drop policy if exists mvp_product_files_admin_delete on storage.objects;
create policy mvp_product_files_admin_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-files'
  and public.get_my_role() = any(array['admin','super_admin']::text[])
);

drop policy if exists mvp_product_files_authenticated_read on storage.objects;
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
      and pf.file_type = 'block'
      and p.status = 'approved'
      and p.visibility = 'public'
  )
);

-- Product images are intentionally public assets, but only admins can mutate them.
drop policy if exists images_owner_upload on storage.objects;
drop policy if exists images_owner_delete on storage.objects;

drop policy if exists mvp_product_images_admin_insert on storage.objects;
create policy mvp_product_images_admin_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and public.get_my_role() = any(array['admin','super_admin']::text[])
);

drop policy if exists mvp_product_images_admin_update on storage.objects;
create policy mvp_product_images_admin_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and public.get_my_role() = any(array['admin','super_admin']::text[])
)
with check (
  bucket_id = 'product-images'
  and public.get_my_role() = any(array['admin','super_admin']::text[])
);

drop policy if exists mvp_product_images_admin_delete on storage.objects;
create policy mvp_product_images_admin_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and public.get_my_role() = any(array['admin','super_admin']::text[])
);

commit;
