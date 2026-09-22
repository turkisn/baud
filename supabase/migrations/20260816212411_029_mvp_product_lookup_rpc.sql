create or replace function public.get_mvp_product(p_lookup text)
returns setof public.mvp_public_products
language sql
stable
set search_path = public
as $$
  select p.*
  from public.mvp_public_products p
  where p.slug = p_lookup
     or p.buod_reference = p_lookup
     or p.id::text = p_lookup
  order by case when p.slug = p_lookup then 0 when p.buod_reference = p_lookup then 1 else 2 end
  limit 1;
$$;

revoke all on function public.get_mvp_product(text) from public;
grant execute on function public.get_mvp_product(text) to anon, authenticated;
