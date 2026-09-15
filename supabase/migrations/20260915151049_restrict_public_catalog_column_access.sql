revoke select on table
  public.products,
  public.suppliers,
  public.manufacturers,
  public.product_components,
  public.product_materials
from anon, authenticated;

grant select (
  id, buod_reference, product_name_ar, product_name_en,
  short_description_ar, short_description_en, full_description_ar, full_description_en,
  category_id, subcategory_id, product_type, supplier_id, manufacturer_id,
  brand_name, model_number, manufacturer_product_code, country_of_origin, unit,
  status, verification_status, visibility, is_free, price, currency,
  lead_time, min_order_qty, in_stock, license_type, license_commercial,
  license_download, license_modify, license_redistribute, source_url,
  rights_confirmed, featured_image_path, version_number, view_count, download_count,
  created_at, updated_at, slug, supplier_product_url, price_updated_at,
  is_featured, sort_order, publication_state
) on table public.products to anon, authenticated;

grant select (
  id, company_name_ar, company_name_en, commercial_name, country, city, website,
  logo_path, verification_status, created_at, updated_at, slug,
  description_ar, description_en, cover_image_path, is_published, sort_order
) on table public.suppliers to anon, authenticated;

grant select (
  id, product_id, material_name_ar, material_name_en, material_code,
  material_type, finish, color, quantity_per_product, unit
) on table public.product_materials to anon, authenticated;
