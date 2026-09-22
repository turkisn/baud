-- Secure download semantics: only free, approved, public products may be downloaded anonymously.

create or replace function public.increment_download_count(product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set download_count = coalesce(download_count, 0) + 1
  where id = product_id
    and status = 'approved'
    and visibility = 'public'
    and is_free = true;
end;
$$;

revoke execute on function public.increment_download_count(uuid) from public;
grant execute on function public.increment_download_count(uuid) to anon, authenticated;

drop policy if exists files_public_free_read on storage.objects;
create policy files_public_free_read
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'product-files'
  and exists (
    select 1
    from public.product_files pf
    join public.products p on p.id = pf.product_id
    where pf.file_path = storage.objects.name
      and p.status = 'approved'
      and p.visibility = 'public'
      and p.is_free = true
  )
);
