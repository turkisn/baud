-- BUOD MVP: tighten public asset access and formalize the public catalog contract.

update storage.buckets
set public = false
where id = 'product-images';

drop policy if exists images_public_view on storage.objects;
drop policy if exists mvp_product_images_public_read on storage.objects;
drop policy if exists mvp_product_images_admin_read on storage.objects;

create policy mvp_product_images_public_read
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1
    from public.product_images pi
    join public.products p on p.id = pi.product_id
    where pi.image_path = storage.objects.name
      and p.status = 'approved'
      and p.visibility = 'public'
  )
);

create policy mvp_product_images_admin_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'product-images'
  and public.get_my_role() in ('admin','super_admin')
);

alter table public.products
  drop constraint if exists products_price_nonnegative,
  add constraint products_price_nonnegative check (price is null or price >= 0) not valid;
alter table public.products validate constraint products_price_nonnegative;

alter table public.products
  drop constraint if exists public_product_requires_slug,
  add constraint public_product_requires_slug
  check (not (status = 'approved' and visibility = 'public') or nullif(trim(slug), '') is not null) not valid;
alter table public.products validate constraint public_product_requires_slug;

alter table public.suppliers
  drop constraint if exists published_supplier_requires_slug,
  add constraint published_supplier_requires_slug
  check (not is_published or nullif(trim(slug), '') is not null) not valid;
alter table public.suppliers validate constraint published_supplier_requires_slug;

create unique index if not exists products_slug_uq
  on public.products (lower(slug)) where slug is not null;
create unique index if not exists suppliers_slug_uq
  on public.suppliers (lower(slug)) where slug is not null;

create or replace function public.set_product_price_timestamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.price is not null and new.price_updated_at is null then
      new.price_updated_at := now();
    end if;
  elsif new.price is distinct from old.price then
    new.price_updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_products_price_timestamp on public.products;
create trigger trg_products_price_timestamp
before insert or update of price on public.products
for each row execute function public.set_product_price_timestamp();

drop policy if exists usage_events_insert_own on public.usage_events;
revoke insert, update, delete on public.usage_events from anon, authenticated;

create or replace function public.record_usage_event(
  p_event_name text,
  p_product_id uuid default null,
  p_supplier_id uuid default null,
  p_session_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_user_type text;
  v_event_id uuid;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if p_event_name not in (
    'page_view','product_view','supplier_view','search','filter',
    'block_download','datasheet_download','sign_in','sign_up','profile_update'
  ) then
    raise exception 'Unsupported event';
  end if;

  if octet_length(coalesce(p_metadata, '{}'::jsonb)::text) > 8192 then
    raise exception 'Metadata too large';
  end if;

  select user_type into v_user_type
  from public.profiles
  where id = v_uid;

  if v_user_type is null then
    raise exception 'Profile not found';
  end if;

  insert into public.usage_events(user_id, user_type, event_name, product_id, supplier_id, session_id, metadata)
  values (v_uid, v_user_type, p_event_name, p_product_id, p_supplier_id, p_session_id, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_event_id;

  return v_event_id;
end;
$$;

revoke all on function public.record_usage_event(text,uuid,uuid,uuid,jsonb) from public, anon;
grant execute on function public.record_usage_event(text,uuid,uuid,uuid,jsonb) to authenticated;

drop view if exists public.mvp_public_products;
create view public.mvp_public_products
with (security_invoker = true)
as
select
  p.id,
  p.slug,
  p.buod_reference,
  p.product_name_ar,
  p.product_name_en,
  p.short_description_ar,
  p.short_description_en,
  p.full_description_ar,
  p.full_description_en,
  p.category_id,
  c.name_ar as category_name_ar,
  c.name_en as category_name_en,
  p.subcategory_id,
  sc.name_ar as subcategory_name_ar,
  sc.name_en as subcategory_name_en,
  p.supplier_id,
  s.slug as supplier_slug,
  s.company_name_ar as supplier_name_ar,
  s.company_name_en as supplier_name_en,
  s.logo_path as supplier_logo_path,
  p.brand_name,
  p.model_number,
  p.manufacturer_product_code,
  p.country_of_origin,
  p.unit,
  p.price,
  p.currency,
  p.price_updated_at,
  p.supplier_product_url,
  p.featured_image_path,
  p.is_featured,
  p.sort_order,
  p.view_count,
  p.download_count,
  p.created_at,
  p.updated_at
from public.products p
left join public.categories c on c.id = p.category_id
left join public.subcategories sc on sc.id = p.subcategory_id
left join public.suppliers s on s.id = p.supplier_id and s.is_published = true
where p.status = 'approved' and p.visibility = 'public';

grant select on public.mvp_public_products to anon, authenticated;

drop view if exists public.mvp_public_supplier_windows;
create view public.mvp_public_supplier_windows
with (security_invoker = true)
as
select
  s.id,
  s.slug,
  s.company_name_ar,
  s.company_name_en,
  s.description_ar,
  s.description_en,
  s.website,
  s.logo_path,
  s.cover_image_path,
  s.country,
  s.city,
  s.sort_order,
  count(p.id)::integer as product_count
from public.suppliers s
left join public.products p
  on p.supplier_id = s.id
 and p.status = 'approved'
 and p.visibility = 'public'
where s.is_published = true
group by s.id;

grant select on public.mvp_public_supplier_windows to anon, authenticated;
