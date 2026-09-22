begin;

-- 1) Separate access control from business/user segmentation.
alter table public.profiles add column if not exists user_type text not null default 'general_user';
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;

update public.profiles
set user_type = case role
  when 'designer' then 'interior_designer'
  when 'supplier' then 'supplier_representative'
  when 'manufacturer' then 'manufacturer_representative'
  else coalesce(nullif(user_type, ''), 'general_user')
end;

update public.profiles
set role = 'user'
where role in ('designer','supplier','manufacturer');

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role = any (array['user','reviewer','admin','super_admin']::text[]));

alter table public.profiles drop constraint if exists profiles_user_type_check;
alter table public.profiles
  add constraint profiles_user_type_check
  check (user_type = any (array[
    'general_user','interior_designer','architect','engineer','design_office',
    'engineering_office','contractor','developer','student',
    'supplier_representative','manufacturer_representative','other'
  ]::text[]));

-- New signups never receive elevated access from client metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_user_type text;
  safe_company_name text;
begin
  safe_user_type := case
    when new.raw_user_meta_data->>'user_type' in (
      'general_user','interior_designer','architect','engineer','design_office',
      'engineering_office','contractor','developer','student',
      'supplier_representative','manufacturer_representative','other'
    ) then new.raw_user_meta_data->>'user_type'
    else 'general_user'
  end;

  safe_company_name := nullif(trim(coalesce(new.raw_user_meta_data->>'company_name','')), '');

  insert into public.profiles (id, full_name, email, role, user_type, company_name, onboarding_completed)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), new.email),
    new.email,
    'user',
    safe_user_type,
    safe_company_name,
    true
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = coalesce(excluded.email, public.profiles.email),
    user_type = excluded.user_type,
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    onboarding_completed = true;

  return new;
end;
$$;

-- 2) Supplier pages become catalog windows, not supplier accounts.
alter table public.suppliers add column if not exists slug text;
alter table public.suppliers add column if not exists description_ar text;
alter table public.suppliers add column if not exists description_en text;
alter table public.suppliers add column if not exists cover_image_path text;
alter table public.suppliers add column if not exists is_published boolean not null default false;
alter table public.suppliers add column if not exists sort_order integer not null default 0;

create unique index if not exists suppliers_slug_unique_idx
  on public.suppliers (lower(slug)) where slug is not null;
create index if not exists suppliers_published_sort_idx
  on public.suppliers (is_published, sort_order, company_name_en);

-- 3) MVP product fields: clean URL, supplier catalog link, price freshness, featured ordering.
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists supplier_product_url text;
alter table public.products add column if not exists price_updated_at timestamptz;
alter table public.products add column if not exists is_featured boolean not null default false;
alter table public.products add column if not exists sort_order integer not null default 0;

create unique index if not exists products_slug_unique_idx
  on public.products (lower(slug)) where slug is not null;
create index if not exists products_mvp_catalog_idx
  on public.products (status, visibility, category_id, subcategory_id, supplier_id);
create index if not exists products_featured_sort_idx
  on public.products (is_featured, sort_order) where status='approved' and visibility='public';

-- Keep source_url data useful for current rows while moving to explicit naming.
update public.products
set supplier_product_url = source_url
where supplier_product_url is null and source_url is not null;

-- 4) Explicit storage location for every downloadable record.
alter table public.product_files add column if not exists storage_bucket text not null default 'product-files';
alter table public.product_files drop constraint if exists product_files_file_type_check;
alter table public.product_files
  add constraint product_files_file_type_check
  check (file_type is null or file_type in ('block','datasheet','document'));
alter table public.product_files drop constraint if exists product_files_storage_bucket_check;
alter table public.product_files
  add constraint product_files_storage_bucket_check
  check (storage_bucket in ('product-files','product-datasheets'));

create index if not exists product_files_product_type_idx
  on public.product_files (product_id, file_type, is_primary);

-- Dedicated private datasheet bucket (PDF only).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-datasheets', 'product-datasheets', false, 20971520, array['application/pdf']::text[])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public supplier brand assets contain only intentionally public marketing imagery.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('supplier-assets', 'supplier-assets', true, 10485760, array['image/jpeg','image/png','image/webp','image/svg+xml']::text[])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 5) First-party usage analytics tied to authenticated users.
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  product_id uuid references public.products(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  session_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint usage_events_event_name_check check (char_length(event_name) between 2 and 64),
  constraint usage_events_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

create index if not exists usage_events_user_created_idx on public.usage_events (user_id, created_at desc);
create index if not exists usage_events_event_created_idx on public.usage_events (event_name, created_at desc);
create index if not exists usage_events_product_created_idx on public.usage_events (product_id, created_at desc) where product_id is not null;
create index if not exists usage_events_supplier_created_idx on public.usage_events (supplier_id, created_at desc) where supplier_id is not null;

alter table public.usage_events enable row level security;

-- 6) MVP authorization: public catalog read, admin-only catalog writes.
drop policy if exists products_owner_insert on public.products;
drop policy if exists products_owner_read on public.products;
drop policy if exists products_owner_update on public.products;
drop policy if exists products_reviewer_read on public.products;

-- Admin policy already exists and is intentionally retained.

drop policy if exists suppliers_owner_write on public.suppliers;
drop policy if exists suppliers_public_read on public.suppliers;
create policy suppliers_public_read
on public.suppliers for select
to anon, authenticated
using (is_published = true);

-- Child records: remove uploader/owner mutation paths; admin only writes.
drop policy if exists product_images_owner_all on public.product_images;
drop policy if exists product_files_owner_all on public.product_files;
drop policy if exists product_specifications_owner_all on public.product_specifications;

-- Reviewer is read-only legacy; never grant catalog writes in MVP.
drop policy if exists product_images_admin_all on public.product_images;
create policy product_images_admin_all
on public.product_images for all
to authenticated
using (public.get_my_role() = any(array['admin','super_admin']::text[]))
with check (public.get_my_role() = any(array['admin','super_admin']::text[]));

drop policy if exists product_files_admin_all on public.product_files;
create policy product_files_admin_all
on public.product_files for all
to authenticated
using (public.get_my_role() = any(array['admin','super_admin']::text[]))
with check (public.get_my_role() = any(array['admin','super_admin']::text[]));

drop policy if exists product_specifications_admin_all on public.product_specifications;
create policy product_specifications_admin_all
on public.product_specifications for all
to authenticated
using (public.get_my_role() = any(array['admin','super_admin']::text[]))
with check (public.get_my_role() = any(array['admin','super_admin']::text[]));

-- Download metadata is visible only after sign-in; product pages can still be browsed publicly.
drop policy if exists product_files_public_read on public.product_files;
create policy product_files_authenticated_read
on public.product_files for select
to authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_files.product_id
      and p.status = 'approved'
      and p.visibility = 'public'
  )
);

-- Users may write analytics only as themselves; admins can read all events.
drop policy if exists usage_events_insert_own on public.usage_events;
create policy usage_events_insert_own
on public.usage_events for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists usage_events_admin_read on public.usage_events;
create policy usage_events_admin_read
on public.usage_events for select
to authenticated
using (public.get_my_role() = any(array['admin','super_admin']::text[]));

revoke all on public.usage_events from anon;
grant insert on public.usage_events to authenticated;
grant select on public.usage_events to authenticated;

-- 7) Storage upload/read boundaries.
drop policy if exists mvp_datasheets_admin_write on storage.objects;
create policy mvp_datasheets_admin_write
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-datasheets'
  and public.get_my_role() = any(array['admin','super_admin']::text[])
);

drop policy if exists mvp_datasheets_admin_update on storage.objects;
create policy mvp_datasheets_admin_update
on storage.objects for update
to authenticated
using (bucket_id = 'product-datasheets' and public.get_my_role() = any(array['admin','super_admin']::text[]))
with check (bucket_id = 'product-datasheets' and public.get_my_role() = any(array['admin','super_admin']::text[]));

drop policy if exists mvp_datasheets_admin_delete on storage.objects;
create policy mvp_datasheets_admin_delete
on storage.objects for delete
to authenticated
using (bucket_id = 'product-datasheets' and public.get_my_role() = any(array['admin','super_admin']::text[]));

drop policy if exists mvp_datasheets_authenticated_read on storage.objects;
create policy mvp_datasheets_authenticated_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'product-datasheets'
  and exists (
    select 1
    from public.product_files pf
    join public.products p on p.id = pf.product_id
    where pf.storage_bucket = 'product-datasheets'
      and pf.file_path = storage.objects.name
      and pf.file_type = 'datasheet'
      and p.status = 'approved'
      and p.visibility = 'public'
  )
);

drop policy if exists mvp_supplier_assets_admin_insert on storage.objects;
create policy mvp_supplier_assets_admin_insert
on storage.objects for insert
to authenticated
with check (bucket_id = 'supplier-assets' and public.get_my_role() = any(array['admin','super_admin']::text[]));

drop policy if exists mvp_supplier_assets_admin_update on storage.objects;
create policy mvp_supplier_assets_admin_update
on storage.objects for update
to authenticated
using (bucket_id = 'supplier-assets' and public.get_my_role() = any(array['admin','super_admin']::text[]))
with check (bucket_id = 'supplier-assets' and public.get_my_role() = any(array['admin','super_admin']::text[]));

drop policy if exists mvp_supplier_assets_admin_delete on storage.objects;
create policy mvp_supplier_assets_admin_delete
on storage.objects for delete
to authenticated
using (bucket_id = 'supplier-assets' and public.get_my_role() = any(array['admin','super_admin']::text[]));

-- Download counter is a signed-in action in MVP.
revoke execute on function public.increment_download_count(uuid) from anon;
grant execute on function public.increment_download_count(uuid) to authenticated;

commit;
