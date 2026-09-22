drop policy if exists product_files_public_metadata_read on public.product_files;

revoke all privileges on table public.product_files from anon;

grant select (
  id,
  product_id,
  file_type,
  software_name,
  software_version,
  file_format,
  original_file_name,
  file_size,
  mime_type,
  is_primary,
  is_available,
  created_at
) on public.product_files to anon;

create policy product_files_public_metadata_read
on public.product_files
for select
to anon
using (
  is_available = true
  and exists (
    select 1
    from public.products p
    where p.id = product_files.product_id
      and p.status = 'approved'
      and p.visibility = 'public'
  )
);
