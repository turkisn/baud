-- Keep one permissive policy per role/action and evaluate auth helpers once per query.
-- This preserves the existing public/admin contract while removing overlapping
-- authenticated SELECT policies flagged by the database advisor.

begin;

drop policy if exists "cats_admin_write" on public.categories;
create policy "cats_admin_insert" on public.categories
  for insert to authenticated
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "cats_admin_update" on public.categories
  for update to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']))
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "cats_admin_delete" on public.categories
  for delete to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']));

drop policy if exists "subcats_admin_write" on public.subcategories;
create policy "subcats_admin_insert" on public.subcategories
  for insert to authenticated
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "subcats_admin_update" on public.subcategories
  for update to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']))
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "subcats_admin_delete" on public.subcategories
  for delete to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']));

drop policy if exists "mfr_admin_all" on public.manufacturers;
drop policy if exists "mfr_public_read" on public.manufacturers;
create policy "mfr_public_read" on public.manufacturers
  for select to anon
  using (verification_status = 'verified');
create policy "mfr_authenticated_read" on public.manufacturers
  for select to authenticated
  using (
    verification_status = 'verified'
    or (select public.get_my_role()) = any (array['admin', 'super_admin'])
  );
create policy "mfr_admin_insert" on public.manufacturers
  for insert to authenticated
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "mfr_admin_update" on public.manufacturers
  for update to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']))
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "mfr_admin_delete" on public.manufacturers
  for delete to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']));

drop policy if exists "products_admin_all" on public.products;
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select to anon
  using (status = 'approved' and visibility = 'public');
create policy "products_authenticated_read" on public.products
  for select to authenticated
  using (
    (status = 'approved' and visibility = 'public')
    or (select public.get_my_role()) = any (array['admin', 'super_admin'])
  );
create policy "products_admin_insert" on public.products
  for insert to authenticated
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "products_admin_update" on public.products
  for update to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']))
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "products_admin_delete" on public.products
  for delete to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']));

drop policy if exists "suppliers_admin_all" on public.suppliers;
drop policy if exists "suppliers_public_read" on public.suppliers;
create policy "suppliers_public_read" on public.suppliers
  for select to anon
  using (is_published = true);
create policy "suppliers_authenticated_read" on public.suppliers
  for select to authenticated
  using (
    is_published = true
    or (select public.get_my_role()) = any (array['admin', 'super_admin'])
  );
create policy "suppliers_admin_insert" on public.suppliers
  for insert to authenticated
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "suppliers_admin_update" on public.suppliers
  for update to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']))
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "suppliers_admin_delete" on public.suppliers
  for delete to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']));

drop policy if exists "product_components_admin_all" on public.product_components;
drop policy if exists "product_components_public_read" on public.product_components;
create policy "product_components_public_read" on public.product_components
  for select to anon
  using (exists (
    select 1 from public.products p
    where p.id = product_components.product_id
      and p.status = 'approved'
      and p.visibility = 'public'
  ));
create policy "product_components_authenticated_read" on public.product_components
  for select to authenticated
  using (
    (select public.get_my_role()) = any (array['admin', 'super_admin'])
    or exists (
      select 1 from public.products p
      where p.id = product_components.product_id
        and p.status = 'approved'
        and p.visibility = 'public'
    )
  );
create policy "product_components_admin_insert" on public.product_components
  for insert to authenticated
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "product_components_admin_update" on public.product_components
  for update to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']))
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "product_components_admin_delete" on public.product_components
  for delete to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']));

drop policy if exists "product_materials_admin_all" on public.product_materials;
drop policy if exists "product_materials_public_read" on public.product_materials;
create policy "product_materials_public_read" on public.product_materials
  for select to anon
  using (exists (
    select 1 from public.products p
    where p.id = product_materials.product_id
      and p.status = 'approved'
      and p.visibility = 'public'
  ));
create policy "product_materials_authenticated_read" on public.product_materials
  for select to authenticated
  using (
    (select public.get_my_role()) = any (array['admin', 'super_admin'])
    or exists (
      select 1 from public.products p
      where p.id = product_materials.product_id
        and p.status = 'approved'
        and p.visibility = 'public'
    )
  );
create policy "product_materials_admin_insert" on public.product_materials
  for insert to authenticated
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "product_materials_admin_update" on public.product_materials
  for update to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']))
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "product_materials_admin_delete" on public.product_materials
  for delete to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']));

drop policy if exists "product_specifications_admin_all" on public.product_specifications;
drop policy if exists "product_specifications_public_read" on public.product_specifications;
create policy "product_specifications_public_read" on public.product_specifications
  for select to anon
  using (exists (
    select 1 from public.products p
    where p.id = product_specifications.product_id
      and p.status = 'approved'
      and p.visibility = 'public'
  ));
create policy "product_specifications_authenticated_read" on public.product_specifications
  for select to authenticated
  using (
    (select public.get_my_role()) = any (array['admin', 'super_admin'])
    or exists (
      select 1 from public.products p
      where p.id = product_specifications.product_id
        and p.status = 'approved'
        and p.visibility = 'public'
    )
  );
create policy "product_specifications_admin_insert" on public.product_specifications
  for insert to authenticated
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "product_specifications_admin_update" on public.product_specifications
  for update to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']))
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "product_specifications_admin_delete" on public.product_specifications
  for delete to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']));

drop policy if exists "product_images_admin_all" on public.product_images;
drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read" on public.product_images
  for select to anon
  using (is_available = true and exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and p.status = 'approved'
      and p.visibility = 'public'
  ));
create policy "product_images_authenticated_read" on public.product_images
  for select to authenticated
  using (
    (select public.get_my_role()) = any (array['admin', 'super_admin'])
    or (is_available = true and exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and p.status = 'approved'
        and p.visibility = 'public'
    ))
  );
create policy "product_images_admin_insert" on public.product_images
  for insert to authenticated
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "product_images_admin_update" on public.product_images
  for update to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']))
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "product_images_admin_delete" on public.product_images
  for delete to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']));

drop policy if exists "product_files_admin_all" on public.product_files;
drop policy if exists "product_files_authenticated_read" on public.product_files;
create policy "product_files_authenticated_read" on public.product_files
  for select to authenticated
  using (
    (select public.get_my_role()) = any (array['admin', 'super_admin'])
    or (is_available = true and exists (
      select 1 from public.products p
      where p.id = product_files.product_id
        and p.status = 'approved'
        and p.visibility = 'public'
    ))
  );
create policy "product_files_admin_insert" on public.product_files
  for insert to authenticated
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "product_files_admin_update" on public.product_files
  for update to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']))
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "product_files_admin_delete" on public.product_files
  for delete to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']));

drop policy if exists "profiles_admin_all" on public.profiles;
drop policy if exists "profiles_reviewer_read" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_authenticated_read" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.get_my_role()) = any (array['admin', 'super_admin', 'reviewer'])
  );
create policy "profiles_authenticated_update" on public.profiles
  for update to authenticated
  using (
    id = (select auth.uid())
    or (select public.get_my_role()) = any (array['admin', 'super_admin'])
  )
  with check (
    id = (select auth.uid())
    or (select public.get_my_role()) = any (array['admin', 'super_admin'])
  );
create policy "profiles_admin_insert" on public.profiles
  for insert to authenticated
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));
create policy "profiles_admin_delete" on public.profiles
  for delete to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']));

drop policy if exists "product_review_actions_admin_all" on public.product_review_actions;
create policy "product_review_actions_admin_all" on public.product_review_actions
  for all to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']))
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));

drop policy if exists "product_revisions_admin_all" on public.product_revisions;
create policy "product_revisions_admin_all" on public.product_revisions
  for all to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']))
  with check ((select public.get_my_role()) = any (array['admin', 'super_admin']));

drop policy if exists "audit_log_admin_read" on public.admin_audit_log;
create policy "audit_log_admin_read" on public.admin_audit_log
  for select to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']));

drop policy if exists "usage_events_admin_read" on public.usage_events;
create policy "usage_events_admin_read" on public.usage_events
  for select to authenticated
  using ((select public.get_my_role()) = any (array['admin', 'super_admin']));

commit;
