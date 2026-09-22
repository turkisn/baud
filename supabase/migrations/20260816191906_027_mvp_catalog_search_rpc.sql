create or replace function public.search_mvp_products(
  p_query text default null,
  p_category_id uuid default null,
  p_supplier_id uuid default null,
  p_limit integer default 24,
  p_offset integer default 0
)
returns setof public.mvp_public_products
language sql
stable
security invoker
set search_path = public
as $$
  select p.*
  from public.mvp_public_products p
  where (p_category_id is null or p.category_id = p_category_id)
    and (p_supplier_id is null or p.supplier_id = p_supplier_id)
    and (
      nullif(trim(p_query), '') is null
      or p.product_name_ar ilike '%' || trim(p_query) || '%'
      or p.product_name_en ilike '%' || trim(p_query) || '%'
      or p.buod_reference ilike '%' || trim(p_query) || '%'
      or coalesce(p.brand_name, '') ilike '%' || trim(p_query) || '%'
      or coalesce(p.model_number, '') ilike '%' || trim(p_query) || '%'
      or coalesce(p.supplier_name_ar, '') ilike '%' || trim(p_query) || '%'
      or coalesce(p.supplier_name_en, '') ilike '%' || trim(p_query) || '%'
    )
  order by p.is_featured desc, p.sort_order asc, p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 24), 100))
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.search_mvp_products(text,uuid,uuid,integer,integer) from public;
grant execute on function public.search_mvp_products(text,uuid,uuid,integer,integer) to anon, authenticated;
