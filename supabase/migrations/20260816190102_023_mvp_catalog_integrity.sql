begin;

-- Availability flags prevent stale database metadata from producing broken UI/download links.
alter table public.product_files add column if not exists is_available boolean not null default false;
alter table public.product_images add column if not exists is_available boolean not null default false;

update public.product_files pf
set is_available = exists (
  select 1 from storage.objects o
  where o.bucket_id = pf.storage_bucket and o.name = pf.file_path
);

update public.product_images pi
set is_available = exists (
  select 1 from storage.objects o
  where o.bucket_id = 'product-images' and o.name = pi.image_path
);

-- Public/consumer reads only expose records that can actually resolve to stored assets.
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

drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read
on public.product_images for select
to anon, authenticated
using (
  is_available = true
  and exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and p.status = 'approved'
      and p.visibility = 'public'
  )
);

-- Legacy authoring surfaces are locked to administrators for the MVP.
drop policy if exists mfr_owner_write on public.manufacturers;

drop policy if exists product_materials_owner_all on public.product_materials;
drop policy if exists product_materials_admin_all on public.product_materials;
create policy product_materials_admin_all
on public.product_materials for all
to authenticated
using (public.get_my_role() = any(array['admin','super_admin']::text[]))
with check (public.get_my_role() = any(array['admin','super_admin']::text[]));

drop policy if exists product_components_owner_all on public.product_components;
drop policy if exists product_components_admin_all on public.product_components;
create policy product_components_admin_all
on public.product_components for all
to authenticated
using (public.get_my_role() = any(array['admin','super_admin']::text[]))
with check (public.get_my_role() = any(array['admin','super_admin']::text[]));

drop policy if exists product_review_actions_owner_read on public.product_review_actions;
drop policy if exists product_review_actions_admin_all on public.product_review_actions;
create policy product_review_actions_admin_all
on public.product_review_actions for all
to authenticated
using (public.get_my_role() = any(array['admin','super_admin']::text[]))
with check (public.get_my_role() = any(array['admin','super_admin']::text[]));

drop policy if exists product_revisions_owner_read on public.product_revisions;
drop policy if exists product_revisions_admin_all on public.product_revisions;
create policy product_revisions_admin_all
on public.product_revisions for all
to authenticated
using (public.get_my_role() = any(array['admin','super_admin']::text[]))
with check (public.get_my_role() = any(array['admin','super_admin']::text[]));

-- Supplier submission/review workflow is not part of MVP.
revoke execute on function public.submit_product_for_review(uuid) from anon, authenticated;

-- Catalog integrity constraints.
alter table public.products drop constraint if exists products_price_nonnegative_check;
alter table public.products add constraint products_price_nonnegative_check check (price is null or price >= 0);
alter table public.products drop constraint if exists products_slug_format_check;
alter table public.products add constraint products_slug_format_check check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

alter table public.suppliers drop constraint if exists suppliers_slug_format_check;
alter table public.suppliers add constraint suppliers_slug_format_check check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

-- Price freshness is maintained by the database, not trusted to the UI.
create or replace function public.set_product_price_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.price is not null and new.price_updated_at is null then
      new.price_updated_at := now();
    end if;
  elsif new.price is distinct from old.price or new.currency is distinct from old.currency then
    new.price_updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_price_updated_at on public.products;
create trigger trg_products_price_updated_at
before insert or update of price, currency on public.products
for each row execute function public.set_product_price_updated_at();

-- Stronger analytics shape and cleaner client API.
alter table public.usage_events alter column user_id set default auth.uid();
alter table public.usage_events drop constraint if exists usage_events_event_name_check;
alter table public.usage_events add constraint usage_events_event_name_check check (
  event_name = any(array[
    'session_start','catalog_view','product_view','supplier_view','search','filter',
    'block_download','datasheet_download','signup_complete','login'
  ]::text[])
);
alter table public.usage_events drop constraint if exists usage_events_metadata_size_check;
alter table public.usage_events add constraint usage_events_metadata_size_check check (pg_column_size(metadata) <= 8192);

drop policy if exists usage_events_insert_own on public.usage_events;
create policy usage_events_insert_own
on public.usage_events for insert
to authenticated
with check (
  user_id = auth.uid()
  and (product_id is null or exists (
    select 1 from public.products p
    where p.id = usage_events.product_id and p.status='approved' and p.visibility='public'
  ))
  and (supplier_id is null or exists (
    select 1 from public.suppliers s
    where s.id = usage_events.supplier_id and s.is_published=true
  ))
);

-- Search indexes for bilingual product/supplier lookup.
create extension if not exists pg_trgm with schema extensions;
create index if not exists products_name_ar_trgm_idx on public.products using gin (lower(product_name_ar) extensions.gin_trgm_ops);
create index if not exists products_name_en_trgm_idx on public.products using gin (lower(product_name_en) extensions.gin_trgm_ops);
create index if not exists products_brand_trgm_idx on public.products using gin (lower(coalesce(brand_name,'')) extensions.gin_trgm_ops);
create index if not exists products_model_trgm_idx on public.products using gin (lower(coalesce(model_number,'')) extensions.gin_trgm_ops);
create index if not exists suppliers_name_ar_trgm_idx on public.suppliers using gin (lower(company_name_ar) extensions.gin_trgm_ops);
create index if not exists suppliers_name_en_trgm_idx on public.suppliers using gin (lower(company_name_en) extensions.gin_trgm_ops);

-- Storage reads follow the availability bit maintained after successful upload.
drop policy if exists mvp_product_files_authenticated_read on storage.objects;
create policy mvp_product_files_authenticated_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'product-files'
  and exists (
    select 1 from public.product_files pf
    join public.products p on p.id = pf.product_id
    where pf.storage_bucket = 'product-files'
      and pf.file_path = storage.objects.name
      and pf.file_type = 'block'
      and pf.is_available = true
      and p.status = 'approved'
      and p.visibility = 'public'
  )
);

drop policy if exists mvp_datasheets_authenticated_read on storage.objects;
create policy mvp_datasheets_authenticated_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'product-datasheets'
  and exists (
    select 1 from public.product_files pf
    join public.products p on p.id = pf.product_id
    where pf.storage_bucket = 'product-datasheets'
      and pf.file_path = storage.objects.name
      and pf.file_type = 'datasheet'
      and pf.is_available = true
      and p.status = 'approved'
      and p.visibility = 'public'
  )
);

commit;
