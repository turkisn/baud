create unique index if not exists products_slug_unique_idx
  on public.products(slug)
  where slug is not null;

create unique index if not exists suppliers_slug_unique_idx
  on public.suppliers(slug)
  where slug is not null;

create unique index if not exists product_images_one_primary_idx
  on public.product_images(product_id)
  where is_primary = true;

create unique index if not exists product_files_one_primary_per_type_idx
  on public.product_files(product_id, file_type)
  where is_primary = true;

create unique index if not exists product_files_storage_object_unique_idx
  on public.product_files(storage_bucket, file_path)
  where file_path is not null;

create unique index if not exists product_images_path_unique_idx
  on public.product_images(image_path);
