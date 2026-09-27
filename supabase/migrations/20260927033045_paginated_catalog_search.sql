-- Public, bounded catalog reads. RLS stays in force through SECURITY INVOKER.
create or replace function public.get_mvp_catalog_page(
  p_query text default null,
  p_category_id uuid default null,
  p_supplier_id uuid default null,
  p_facets jsonb default '{}'::jsonb,
  p_limit integer default 24,
  p_offset integer default 0,
  p_exclude_slugs text[] default '{}'::text[]
)
returns jsonb
language sql stable security invoker
set search_path = ''
set statement_timeout = '8s'
as $function$
with tokens as (
  select word from unnest(regexp_split_to_array(
    trim(translate(lower(left(coalesce(p_query,''),200)), 'أإآةى', 'اااهي')), '\s+')) word
  where word <> ''
), base as materialized (
  select p.*,
    s.city,
    coalesce(spec.items, '[]'::jsonb) as specifications,
    coalesce(mat.items, '[]'::jsonb) as materials,
    translate(lower(concat_ws(' ', p.product_name_ar, p.product_name_en, p.buod_reference,
      p.brand_name, p.model_number)), 'أإآةى', 'اااهي') as primary_text,
    translate(lower(concat_ws(' ', p.short_description_ar, p.short_description_en,
      p.full_description_ar, p.full_description_en, p.category_name_ar, p.category_name_en,
      p.supplier_name_ar, p.supplier_name_en, spec.search_text, mat.search_text)), 'أإآةى', 'اااهي') as secondary_text
  from public.mvp_public_products p
  left join public.mvp_public_supplier_windows s on s.id = p.supplier_id
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'specification_name_ar', x.specification_name_ar, 'specification_name_en', x.specification_name_en,
      'value', x.value, 'unit', x.unit) order by x.sort_order, x.id) as items,
      string_agg(concat_ws(' ', x.specification_name_ar, x.specification_name_en, x.value, x.unit), ' ') as search_text
    from public.product_specifications x where x.product_id = p.id
  ) spec on true
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'material_name_ar', x.material_name_ar, 'material_name_en', x.material_name_en,
      'color', x.color, 'finish', x.finish) order by x.id) as items,
      string_agg(concat_ws(' ', x.material_name_ar, x.material_name_en, x.color, x.finish), ' ') as search_text
    from public.product_materials x where x.product_id = p.id
  ) mat on true
  where (p_category_id is null or p.category_id = p_category_id)
    and (p_supplier_id is null or p.supplier_id = p_supplier_id)
    and not (coalesce(p.slug, '') = any(coalesce(p_exclude_slugs[1:200], '{}'::text[])))
), searchable as materialized (
  select b.*,
    coalesce((select sum(case when strpos(b.primary_text, word)>0 then 3 else 1 end)
      from tokens where strpos(b.primary_text, word)>0 or strpos(b.secondary_text, word)>0),0) as relevance
  from base b
  where not exists(select 1 from tokens)
    or exists(select 1 from tokens where strpos(b.primary_text, word)>0 or strpos(b.secondary_text, word)>0)
), facet_values as materialized (
  select b.id, 'material' as kind, v.value
  from searchable b cross join lateral (
    select v.value from jsonb_array_elements(b.materials) x
      cross join lateral (values (x->>'material_name_ar'),(x->>'material_name_en')) v(value)
    union all
    select x->>'value' from jsonb_array_elements(b.specifications) x
      where concat_ws(' ', x->>'specification_name_en', x->>'specification_name_ar') ~* 'material|ماد'
  ) v
  union all
  select b.id, 'color', v.value
  from searchable b cross join lateral (
    select x->>'color' as value from jsonb_array_elements(b.materials) x
    union all
    select x->>'value' from jsonb_array_elements(b.specifications) x
      where concat_ws(' ', x->>'specification_name_en', x->>'specification_name_ar') ~* 'color|colour|finish|لون|تشطيب'
  ) v
  union all
  select b.id, 'dimension', concat_ws(' ', nullif(x->>'value',''), nullif(x->>'unit',''))
  from searchable b cross join lateral jsonb_array_elements(b.specifications) x
  where concat_ws(' ', x->>'specification_name_en', x->>'specification_name_ar') ~* 'dimension|width|height|depth|length|diameter|الأبعاد|الارتفاع|الطول|العرض'
), filtered as materialized (
  select b.* from searchable b
  where (coalesce(p_facets->>'city','') = '' or b.city = p_facets->>'city')
    and not exists (
      select 1 from (values ('material'),('color'),('dimension')) f(kind)
      where coalesce(p_facets->>f.kind,'') <> ''
      and not exists(select 1 from facet_values v where v.id=b.id and v.kind=f.kind and v.value=p_facets->>f.kind)
    )
), page as (
  select * from filtered
  order by relevance desc, is_featured desc, sort_order asc, created_at desc, id asc
  limit greatest(0,least(coalesce(p_limit,24),100))
  offset greatest(0,coalesce(p_offset,0))
), cards as (
  select (to_jsonb(p) - array['primary_text','secondary_text','relevance','specifications','materials',
    'full_description_ar','full_description_en','supplier_logo_path'])
    || jsonb_build_object(
      'product_specifications', p.specifications, 'product_materials', p.materials,
      'available_formats', coalesce(f.formats,'[]'::jsonb),
      'available_software', coalesce(f.software,'[]'::jsonb),
      'available_file_count', coalesce(f.count,0)) as item,
    p.relevance,p.is_featured,p.sort_order,p.created_at,p.id
  from page p left join lateral (
    select jsonb_agg(distinct f.file_format) filter(where f.file_format is not null) as formats,
      jsonb_agg(distinct f.software_name) filter(where f.software_name is not null) as software, count(*) as count
    from public.product_files f where f.product_id=p.id and f.is_available=true
  ) f on true
)
select jsonb_build_object(
  'products', coalesce((select jsonb_agg(item order by relevance desc,is_featured desc,sort_order asc,created_at desc,id asc) from cards),'[]'::jsonb),
  'total', (select count(*) from filtered),
  'facets', jsonb_build_object(
    'material', coalesce((select jsonb_agg(value order by value) from (select distinct value from facet_values where kind='material' and nullif(value,'') is not null) v),'[]'::jsonb),
    'color', coalesce((select jsonb_agg(value order by value) from (select distinct value from facet_values where kind='color' and nullif(value,'') is not null) v),'[]'::jsonb),
    'dimension', coalesce((select jsonb_agg(value order by value) from (select distinct value from facet_values where kind='dimension' and nullif(value,'') is not null) v),'[]'::jsonb)
  )
);
$function$;

revoke all on function public.get_mvp_catalog_page(text,uuid,uuid,jsonb,integer,integer,text[]) from public;
grant execute on function public.get_mvp_catalog_page(text,uuid,uuid,jsonb,integer,integer,text[]) to anon,authenticated;
