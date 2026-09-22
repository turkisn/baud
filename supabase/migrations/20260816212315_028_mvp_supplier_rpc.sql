create or replace function public.search_mvp_supplier_windows(
  p_query text default null,
  p_limit integer default 24,
  p_offset integer default 0
)
returns setof public.mvp_public_supplier_windows
language sql
stable
set search_path = public
as $$
  select s.*
  from public.mvp_public_supplier_windows s
  where (
    nullif(trim(p_query), '') is null
    or coalesce(s.company_name_ar, '') ilike '%' || trim(p_query) || '%'
    or coalesce(s.company_name_en, '') ilike '%' || trim(p_query) || '%'
    or coalesce(s.city, '') ilike '%' || trim(p_query) || '%'
    or coalesce(s.country, '') ilike '%' || trim(p_query) || '%'
  )
  order by s.sort_order asc, s.company_name_en asc nulls last, s.company_name_ar asc nulls last
  limit greatest(1, least(coalesce(p_limit, 24), 100))
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.get_mvp_supplier_window(p_slug text)
returns setof public.mvp_public_supplier_windows
language sql
stable
set search_path = public
as $$
  select s.*
  from public.mvp_public_supplier_windows s
  where s.slug = p_slug
  limit 1;
$$;

revoke all on function public.search_mvp_supplier_windows(text, integer, integer) from public;
revoke all on function public.get_mvp_supplier_window(text) from public;
grant execute on function public.search_mvp_supplier_windows(text, integer, integer) to anon, authenticated;
grant execute on function public.get_mvp_supplier_window(text) to anon, authenticated;
