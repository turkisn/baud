create or replace function public.auto_set_buod_reference()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_cat_code text;
  v_sub_code text;
begin
  if new.buod_reference is null
     and new.status in ('pending_review','approved') then
    select code into v_cat_code from public.categories where id = new.category_id;
    select code into v_sub_code from public.subcategories where id = new.subcategory_id;
    new.buod_reference := public.generate_buod_reference(coalesce(v_cat_code,'GEN'), coalesce(v_sub_code,'GEN'));
  end if;
  return new;
end;
$function$;

create or replace function public.admin_save_mvp_supplier(
  p_supplier_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns public.suppliers
language plpgsql
security invoker
set search_path to 'public'
as $function$
declare
  v_existing public.suppliers%rowtype;
  v_row public.suppliers%rowtype;
  v_name_ar text;
  v_name_en text;
  v_slug text;
  v_website text;
  v_logo text;
  v_cover text;
  v_publish boolean;
begin
  if public.get_my_role() not in ('admin','super_admin') then
    raise exception 'Admin access required';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Invalid payload';
  end if;

  if p_supplier_id is not null then
    select * into v_existing from public.suppliers where id = p_supplier_id;
    if not found then raise exception 'Supplier not found'; end if;
  end if;

  v_name_ar := case when p_payload ? 'company_name_ar' then nullif(trim(p_payload->>'company_name_ar'),'') else v_existing.company_name_ar end;
  v_name_en := case when p_payload ? 'company_name_en' then nullif(trim(p_payload->>'company_name_en'),'') else v_existing.company_name_en end;
  if v_name_ar is null or v_name_en is null then raise exception 'Arabic and English supplier names are required'; end if;
  if length(v_name_ar) > 200 or length(v_name_en) > 200 then raise exception 'Supplier name too long'; end if;

  if p_payload ? 'slug' then
    v_slug := nullif(lower(trim(p_payload->>'slug')), '');
  else
    v_slug := v_existing.slug;
    if v_slug is null then
      v_slug := nullif(trim(both '-' from lower(regexp_replace(v_name_en, '[^a-zA-Z0-9]+', '-', 'g'))), '');
    end if;
  end if;
  if v_slug is not null and (length(v_slug) > 160 or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$') then
    raise exception 'Invalid supplier slug';
  end if;
  if v_slug is not null and exists (select 1 from public.suppliers s where s.slug = v_slug and s.id is distinct from p_supplier_id) then
    raise exception 'Supplier slug already exists';
  end if;

  v_website := case when p_payload ? 'website' then nullif(trim(p_payload->>'website'),'') else v_existing.website end;
  if v_website is not null and (length(v_website) > 2048 or v_website !~* '^https?://') then raise exception 'Supplier website must use http or https'; end if;

  v_logo := case when p_payload ? 'logo_path' then nullif(trim(p_payload->>'logo_path'),'') else v_existing.logo_path end;
  v_cover := case when p_payload ? 'cover_image_path' then nullif(trim(p_payload->>'cover_image_path'),'') else v_existing.cover_image_path end;
  if v_logo is not null and not exists (select 1 from storage.objects o where o.bucket_id='supplier-assets' and o.name=v_logo) then raise exception 'Supplier logo object not found'; end if;
  if v_cover is not null and not exists (select 1 from storage.objects o where o.bucket_id='supplier-assets' and o.name=v_cover) then raise exception 'Supplier cover object not found'; end if;

  v_publish := case when p_payload ? 'is_published' then coalesce((p_payload->>'is_published')::boolean,false) else coalesce(v_existing.is_published,false) end;
  if v_publish and v_slug is null then raise exception 'Published supplier requires a slug'; end if;

  if p_supplier_id is null then
    insert into public.suppliers(
      owner_id, company_name_ar, company_name_en, commercial_name, country, city, email, phone,
      website, logo_path, verification_status, slug, description_ar, description_en,
      cover_image_path, is_published, sort_order
    ) values (
      null, v_name_ar, v_name_en, nullif(trim(p_payload->>'commercial_name'),''),
      nullif(trim(p_payload->>'country'),''), nullif(trim(p_payload->>'city'),''),
      nullif(trim(p_payload->>'email'),''), nullif(trim(p_payload->>'phone'),''),
      v_website, v_logo, coalesce(nullif(p_payload->>'verification_status',''),'unverified'),
      v_slug, nullif(trim(p_payload->>'description_ar'),''), nullif(trim(p_payload->>'description_en'),''),
      v_cover, v_publish, coalesce(nullif(p_payload->>'sort_order','')::int,0)
    ) returning * into v_row;
  else
    update public.suppliers set
      company_name_ar = v_name_ar,
      company_name_en = v_name_en,
      commercial_name = case when p_payload ? 'commercial_name' then nullif(trim(p_payload->>'commercial_name'),'') else commercial_name end,
      country = case when p_payload ? 'country' then nullif(trim(p_payload->>'country'),'') else country end,
      city = case when p_payload ? 'city' then nullif(trim(p_payload->>'city'),'') else city end,
      email = case when p_payload ? 'email' then nullif(trim(p_payload->>'email'),'') else email end,
      phone = case when p_payload ? 'phone' then nullif(trim(p_payload->>'phone'),'') else phone end,
      website = v_website,
      logo_path = v_logo,
      verification_status = case when p_payload ? 'verification_status' then coalesce(nullif(p_payload->>'verification_status',''),'unverified') else verification_status end,
      slug = v_slug,
      description_ar = case when p_payload ? 'description_ar' then nullif(trim(p_payload->>'description_ar'),'') else description_ar end,
      description_en = case when p_payload ? 'description_en' then nullif(trim(p_payload->>'description_en'),'') else description_en end,
      cover_image_path = v_cover,
      is_published = v_publish,
      sort_order = case when p_payload ? 'sort_order' then coalesce(nullif(p_payload->>'sort_order','')::int,0) else sort_order end
    where id = p_supplier_id
    returning * into v_row;
  end if;
  return v_row;
end;
$function$;

create or replace function public.admin_save_mvp_product(
  p_product_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns public.products
language plpgsql
security invoker
set search_path to 'public'
as $function$
declare
  v_existing public.products%rowtype;
  v_row public.products%rowtype;
  v_name_ar text;
  v_name_en text;
  v_slug text;
  v_category_id uuid;
  v_subcategory_id uuid;
  v_supplier_id uuid;
  v_price numeric;
  v_currency text;
  v_supplier_url text;
  v_source_url text;
  v_rights boolean;
  v_state text;
  v_status text;
  v_visibility text;
  v_approved_by uuid;
  v_approved_at timestamptz;
begin
  if public.get_my_role() not in ('admin','super_admin') then raise exception 'Admin access required'; end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then raise exception 'Invalid payload'; end if;

  if p_product_id is not null then
    select * into v_existing from public.products where id = p_product_id;
    if not found then raise exception 'Product not found'; end if;
  end if;

  v_name_ar := case when p_payload ? 'product_name_ar' then nullif(trim(p_payload->>'product_name_ar'),'') else v_existing.product_name_ar end;
  v_name_en := case when p_payload ? 'product_name_en' then nullif(trim(p_payload->>'product_name_en'),'') else v_existing.product_name_en end;
  if v_name_ar is null or v_name_en is null then raise exception 'Arabic and English product names are required'; end if;
  if length(v_name_ar)>250 or length(v_name_en)>250 then raise exception 'Product name too long'; end if;

  v_category_id := case when p_payload ? 'category_id' then nullif(p_payload->>'category_id','')::uuid else v_existing.category_id end;
  v_subcategory_id := case when p_payload ? 'subcategory_id' then nullif(p_payload->>'subcategory_id','')::uuid else v_existing.subcategory_id end;
  v_supplier_id := case when p_payload ? 'supplier_id' then nullif(p_payload->>'supplier_id','')::uuid else v_existing.supplier_id end;
  if v_category_id is not null and not exists(select 1 from public.categories c where c.id=v_category_id and c.is_active=true) then raise exception 'Invalid category'; end if;
  if v_subcategory_id is not null and not exists(select 1 from public.subcategories s where s.id=v_subcategory_id and s.category_id=v_category_id and s.is_active=true) then raise exception 'Invalid subcategory'; end if;
  if v_supplier_id is not null and not exists(select 1 from public.suppliers s where s.id=v_supplier_id) then raise exception 'Invalid supplier'; end if;

  if p_payload ? 'slug' then
    v_slug := nullif(lower(trim(p_payload->>'slug')), '');
  else
    v_slug := v_existing.slug;
    if v_slug is null then v_slug := nullif(trim(both '-' from lower(regexp_replace(v_name_en,'[^a-zA-Z0-9]+','-','g'))),''); end if;
  end if;
  if v_slug is not null and (length(v_slug)>160 or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$') then raise exception 'Invalid product slug'; end if;
  if v_slug is not null and exists(select 1 from public.products p where p.slug=v_slug and p.id is distinct from p_product_id) then raise exception 'Product slug already exists'; end if;

  v_price := case when p_payload ? 'price' then nullif(p_payload->>'price','')::numeric else v_existing.price end;
  if v_price is not null and v_price < 0 then raise exception 'Price cannot be negative'; end if;
  v_currency := upper(case when p_payload ? 'currency' then coalesce(nullif(trim(p_payload->>'currency'),''),'SAR') else coalesce(v_existing.currency,'SAR') end);
  if v_currency !~ '^[A-Z]{3}$' then raise exception 'Invalid currency'; end if;

  v_supplier_url := case when p_payload ? 'supplier_product_url' then nullif(trim(p_payload->>'supplier_product_url'),'') else v_existing.supplier_product_url end;
  v_source_url := case when p_payload ? 'source_url' then nullif(trim(p_payload->>'source_url'),'') else v_existing.source_url end;
  if v_supplier_url is not null and (length(v_supplier_url)>2048 or v_supplier_url !~* '^https?://') then raise exception 'Supplier product URL must use http or https'; end if;
  if v_source_url is not null and (length(v_source_url)>2048 or v_source_url !~* '^https?://') then raise exception 'Source URL must use http or https'; end if;

  v_rights := case when p_payload ? 'rights_confirmed' then coalesce((p_payload->>'rights_confirmed')::boolean,false) else coalesce(v_existing.rights_confirmed,false) end;
  v_state := case when p_payload ? 'publication_state' then lower(coalesce(nullif(p_payload->>'publication_state',''),'draft')) else null end;
  if v_state is null then
    if p_product_id is null then v_state := 'draft';
    elsif v_existing.status='approved' and v_existing.visibility='public' then v_state := 'published';
    elsif v_existing.status='archived' then v_state := 'archived';
    else v_state := 'draft'; end if;
  end if;
  if v_state not in ('draft','published','archived') then raise exception 'Invalid publication state'; end if;

  if v_state='published' then
    if v_category_id is null then raise exception 'Published product requires a category'; end if;
    if v_supplier_id is null then raise exception 'Published product requires a supplier'; end if;
    if not exists(select 1 from public.suppliers s where s.id=v_supplier_id and s.is_published=true) then raise exception 'Supplier window must be published first'; end if;
    if v_slug is null then raise exception 'Published product requires a slug'; end if;
    if not v_rights then raise exception 'Rights confirmation is required before publishing'; end if;
    v_status := 'approved'; v_visibility := 'public'; v_approved_by := auth.uid(); v_approved_at := now();
  elsif v_state='archived' then
    v_status := 'archived'; v_visibility := 'private'; v_approved_by := v_existing.approved_by; v_approved_at := v_existing.approved_at;
  else
    v_status := 'draft'; v_visibility := 'private'; v_approved_by := null; v_approved_at := null;
  end if;

  if p_product_id is null then
    insert into public.products(
      product_name_ar, product_name_en, short_description_ar, short_description_en,
      full_description_ar, full_description_en, category_id, subcategory_id, product_type,
      supplier_id, brand_name, model_number, country_of_origin, unit,
      status, verification_status, visibility, is_free, price, currency,
      source_url, rights_confirmed, created_by, approved_by, approved_at, slug,
      supplier_product_url, is_featured, sort_order
    ) values (
      v_name_ar, v_name_en, nullif(trim(p_payload->>'short_description_ar'),''), nullif(trim(p_payload->>'short_description_en'),''),
      nullif(trim(p_payload->>'full_description_ar'),''), nullif(trim(p_payload->>'full_description_en'),''),
      v_category_id, v_subcategory_id, nullif(trim(p_payload->>'product_type'),''), v_supplier_id,
      nullif(trim(p_payload->>'brand_name'),''), nullif(trim(p_payload->>'model_number'),''),
      nullif(trim(p_payload->>'country_of_origin'),''), nullif(trim(p_payload->>'unit'),''),
      v_status, 'unverified', v_visibility, true, v_price, v_currency,
      v_source_url, v_rights, auth.uid(), v_approved_by, v_approved_at, v_slug,
      v_supplier_url, coalesce((p_payload->>'is_featured')::boolean,false), coalesce(nullif(p_payload->>'sort_order','')::int,0)
    ) returning * into v_row;
  else
    update public.products set
      product_name_ar=v_name_ar,
      product_name_en=v_name_en,
      short_description_ar=case when p_payload ? 'short_description_ar' then nullif(trim(p_payload->>'short_description_ar'),'') else short_description_ar end,
      short_description_en=case when p_payload ? 'short_description_en' then nullif(trim(p_payload->>'short_description_en'),'') else short_description_en end,
      full_description_ar=case when p_payload ? 'full_description_ar' then nullif(trim(p_payload->>'full_description_ar'),'') else full_description_ar end,
      full_description_en=case when p_payload ? 'full_description_en' then nullif(trim(p_payload->>'full_description_en'),'') else full_description_en end,
      category_id=v_category_id,
      subcategory_id=v_subcategory_id,
      product_type=case when p_payload ? 'product_type' then nullif(trim(p_payload->>'product_type'),'') else product_type end,
      supplier_id=v_supplier_id,
      brand_name=case when p_payload ? 'brand_name' then nullif(trim(p_payload->>'brand_name'),'') else brand_name end,
      model_number=case when p_payload ? 'model_number' then nullif(trim(p_payload->>'model_number'),'') else model_number end,
      country_of_origin=case when p_payload ? 'country_of_origin' then nullif(trim(p_payload->>'country_of_origin'),'') else country_of_origin end,
      unit=case when p_payload ? 'unit' then nullif(trim(p_payload->>'unit'),'') else unit end,
      status=v_status,
      visibility=v_visibility,
      is_free=true,
      price=v_price,
      currency=v_currency,
      source_url=v_source_url,
      rights_confirmed=v_rights,
      approved_by=v_approved_by,
      approved_at=v_approved_at,
      slug=v_slug,
      supplier_product_url=v_supplier_url,
      is_featured=case when p_payload ? 'is_featured' then coalesce((p_payload->>'is_featured')::boolean,false) else is_featured end,
      sort_order=case when p_payload ? 'sort_order' then coalesce(nullif(p_payload->>'sort_order','')::int,0) else sort_order end
    where id=p_product_id returning * into v_row;
  end if;
  return v_row;
end;
$function$;

create or replace function public.admin_replace_mvp_product_specifications(
  p_product_id uuid,
  p_items jsonb
)
returns integer
language plpgsql
security invoker
set search_path to 'public'
as $function$
declare
  v_count integer := 0;
begin
  if public.get_my_role() not in ('admin','super_admin') then raise exception 'Admin access required'; end if;
  if not exists(select 1 from public.products where id=p_product_id) then raise exception 'Product not found'; end if;
  if p_items is null then p_items := '[]'::jsonb; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'Specifications must be an array'; end if;
  if jsonb_array_length(p_items) > 100 then raise exception 'Too many specifications'; end if;

  delete from public.product_specifications where product_id=p_product_id;
  insert into public.product_specifications(
    product_id, specification_name_ar, specification_name_en, specification_code,
    value, unit, data_type, sort_order
  )
  select p_product_id,
    nullif(trim(x.item->>'specification_name_ar'),''),
    nullif(trim(x.item->>'specification_name_en'),''),
    nullif(trim(x.item->>'specification_code'),''),
    nullif(trim(x.item->>'value'),''),
    nullif(trim(x.item->>'unit'),''),
    coalesce(nullif(trim(x.item->>'data_type'),''),'text'),
    (x.ord-1)::int
  from jsonb_array_elements(p_items) with ordinality as x(item,ord)
  where nullif(trim(coalesce(x.item->>'value','')),'') is not null
    and (nullif(trim(coalesce(x.item->>'specification_name_ar','')),'') is not null
      or nullif(trim(coalesce(x.item->>'specification_name_en','')),'') is not null);
  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

create or replace function public.admin_register_mvp_product_file(
  p_product_id uuid,
  p_payload jsonb
)
returns public.product_files
language plpgsql
security invoker
set search_path to 'public','storage'
as $function$
declare
  v_product public.products%rowtype;
  v_row public.product_files%rowtype;
  v_type text;
  v_bucket text;
  v_path text;
  v_format text;
  v_primary boolean;
begin
  if public.get_my_role() not in ('admin','super_admin') then raise exception 'Admin access required'; end if;
  select * into v_product from public.products where id=p_product_id;
  if not found then raise exception 'Product not found'; end if;
  if not coalesce(v_product.rights_confirmed,false) then raise exception 'Rights confirmation required before registering downloadable assets'; end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'Invalid payload'; end if;

  v_type := lower(coalesce(nullif(trim(p_payload->>'file_type'),''),'block'));
  if v_type not in ('block','datasheet') then raise exception 'Invalid file type'; end if;
  v_bucket := case when v_type='datasheet' then 'product-datasheets' else 'product-files' end;
  if p_payload ? 'storage_bucket' and p_payload->>'storage_bucket' <> v_bucket then raise exception 'Storage bucket does not match file type'; end if;
  v_path := nullif(trim(p_payload->>'file_path'),'');
  if v_path is null or v_path !~ ('^' || p_product_id::text || '/[^/].*') or v_path ~ '(^|/)\.\.(/|$)' or v_path ~ '^/' or v_path ~* '^[a-z][a-z0-9+.-]*:' or position('\\' in v_path)>0 then raise exception 'Invalid file path'; end if;
  if not exists(select 1 from storage.objects o where o.bucket_id=v_bucket and o.name=v_path) then raise exception 'Storage object not found'; end if;

  v_format := upper(coalesce(nullif(trim(p_payload->>'file_format'),''), case when v_type='datasheet' then 'PDF' else null end));
  if v_type='datasheet' and v_format<>'PDF' then raise exception 'Datasheet must be PDF'; end if;
  v_primary := coalesce((p_payload->>'is_primary')::boolean,false);
  if v_primary then update public.product_files set is_primary=false where product_id=p_product_id and file_type=v_type; end if;

  insert into public.product_files(
    product_id,file_type,software_name,software_version,file_format,original_file_name,
    stored_file_name,file_path,file_size,mime_type,is_primary,uploaded_by,storage_bucket,is_available
  ) values (
    p_product_id,v_type,nullif(trim(p_payload->>'software_name'),''),nullif(trim(p_payload->>'software_version'),''),v_format,
    nullif(trim(p_payload->>'original_file_name'),''),coalesce(nullif(trim(p_payload->>'stored_file_name'),''),regexp_replace(v_path,'^.*/','')),
    v_path,nullif(p_payload->>'file_size','')::bigint,nullif(trim(p_payload->>'mime_type'),''),v_primary,auth.uid(),v_bucket,true
  ) returning * into v_row;
  return v_row;
end;
$function$;

create or replace function public.admin_register_mvp_product_image(
  p_product_id uuid,
  p_payload jsonb
)
returns public.product_images
language plpgsql
security invoker
set search_path to 'public','storage'
as $function$
declare
  v_row public.product_images%rowtype;
  v_path text;
  v_primary boolean;
begin
  if public.get_my_role() not in ('admin','super_admin') then raise exception 'Admin access required'; end if;
  if not exists(select 1 from public.products where id=p_product_id) then raise exception 'Product not found'; end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'Invalid payload'; end if;
  v_path := nullif(trim(p_payload->>'image_path'),'');
  if v_path is null or v_path !~ ('^' || p_product_id::text || '/[^/].*') or v_path ~ '(^|/)\.\.(/|$)' or v_path ~ '^/' or v_path ~* '^[a-z][a-z0-9+.-]*:' or position('\\' in v_path)>0 then raise exception 'Invalid image path'; end if;
  if not exists(select 1 from storage.objects o where o.bucket_id='product-images' and o.name=v_path) then raise exception 'Storage object not found'; end if;
  v_primary := coalesce((p_payload->>'is_primary')::boolean,false);
  if v_primary then update public.product_images set is_primary=false where product_id=p_product_id; end if;
  insert into public.product_images(product_id,image_path,image_type,alt_text_ar,alt_text_en,sort_order,is_primary,is_available)
  values(p_product_id,v_path,coalesce(nullif(trim(p_payload->>'image_type'),''),'render'),nullif(trim(p_payload->>'alt_text_ar'),''),nullif(trim(p_payload->>'alt_text_en'),''),coalesce(nullif(p_payload->>'sort_order','')::int,0),v_primary,true)
  returning * into v_row;
  return v_row;
end;
$function$;

revoke all on function public.admin_save_mvp_supplier(uuid,jsonb) from public, anon;
revoke all on function public.admin_save_mvp_product(uuid,jsonb) from public, anon;
revoke all on function public.admin_replace_mvp_product_specifications(uuid,jsonb) from public, anon;
revoke all on function public.admin_register_mvp_product_file(uuid,jsonb) from public, anon;
revoke all on function public.admin_register_mvp_product_image(uuid,jsonb) from public, anon;
grant execute on function public.admin_save_mvp_supplier(uuid,jsonb) to authenticated;
grant execute on function public.admin_save_mvp_product(uuid,jsonb) to authenticated;
grant execute on function public.admin_replace_mvp_product_specifications(uuid,jsonb) to authenticated;
grant execute on function public.admin_register_mvp_product_file(uuid,jsonb) to authenticated;
grant execute on function public.admin_register_mvp_product_image(uuid,jsonb) to authenticated;
