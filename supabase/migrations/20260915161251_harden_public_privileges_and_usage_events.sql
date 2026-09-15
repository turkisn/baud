begin;

revoke truncate, trigger, references, maintain
on all tables in schema public
from anon, authenticated;

alter default privileges in schema public
revoke truncate, trigger, references, maintain
on tables
from anon, authenticated;

revoke all privileges
on table public.buod_reference_counters
from anon, authenticated;

revoke insert, update, delete
on table public.mvp_public_products, public.mvp_public_supplier_windows
from authenticated;

revoke select on table public.product_files from authenticated;

grant select (
  id, product_id, file_type, software_name, software_version, file_format,
  original_file_name, file_path, file_size, mime_type, is_primary,
  storage_bucket, is_available, created_at
) on table public.product_files to authenticated;

alter function public.admin_register_mvp_product_file(uuid, jsonb)
security definer;

alter function public.admin_register_mvp_product_file(uuid, jsonb)
set search_path = public, storage;

revoke execute on function public.admin_register_mvp_product_file(uuid, jsonb)
from public, anon;

grant execute on function public.admin_register_mvp_product_file(uuid, jsonb)
to authenticated;

create or replace function public.set_usage_event_user_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_uid uuid := auth.uid();
  v_file_id_text text;
  v_category_id_text text;
  v_supplier_id_text text;
  v_expected_file_type text;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if new.event_name not in (
    'session_start', 'catalog_view', 'product_view', 'supplier_view', 'search',
    'filter', 'block_download', 'datasheet_download', 'signup_complete', 'login'
  ) then
    raise exception 'Unsupported event';
  end if;

  new.metadata := coalesce(new.metadata, '{}'::jsonb);
  if jsonb_typeof(new.metadata) <> 'object' then
    raise exception 'Metadata must be an object';
  end if;

  select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
    into new.metadata
  from jsonb_each(new.metadata) as entry
  where entry.key = any (array['page', 'category_id', 'supplier_id', 'file_id']::text[]);

  if new.metadata ? 'page' and (
    jsonb_typeof(new.metadata->'page') <> 'string'
    or new.metadata->>'page' !~ '^[a-zA-Z0-9_-]{1,64}$'
  ) then
    raise exception 'Invalid page metadata';
  end if;

  if octet_length(new.metadata::text) > 8192 then
    raise exception 'Metadata too large';
  end if;

  if (
    select count(*)
    from public.usage_events e
    where e.user_id = v_uid
      and e.created_at >= now() - interval '1 minute'
  ) >= 120 then
    raise exception 'Event rate limit exceeded';
  end if;

  if new.product_id is not null and not exists (
    select 1 from public.products p
    where p.id = new.product_id
      and p.status = 'approved'
      and p.visibility = 'public'
  ) then
    raise exception 'Invalid product';
  end if;

  if new.supplier_id is not null and not exists (
    select 1 from public.suppliers s
    where s.id = new.supplier_id
      and s.is_published = true
  ) then
    raise exception 'Invalid supplier';
  end if;

  if new.metadata ? 'category_id' then
    v_category_id_text := nullif(trim(new.metadata->>'category_id'), '');
    if v_category_id_text is null
       or v_category_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or not exists (
         select 1 from public.categories c
         where c.id = v_category_id_text::uuid
           and c.is_active = true
       ) then
      raise exception 'Invalid category metadata';
    end if;
  end if;

  if new.metadata ? 'supplier_id' then
    v_supplier_id_text := nullif(trim(new.metadata->>'supplier_id'), '');
    if v_supplier_id_text is null
       or v_supplier_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or new.supplier_id is null
       or new.supplier_id::text <> lower(v_supplier_id_text) then
      raise exception 'Invalid supplier metadata';
    end if;
  end if;

  if new.event_name = 'product_view' and new.product_id is null then
    raise exception 'product_id required';
  end if;

  if new.event_name = 'supplier_view' and new.supplier_id is null then
    raise exception 'supplier_id required';
  end if;

  if new.event_name in ('block_download', 'datasheet_download') then
    if new.product_id is null then
      raise exception 'product_id required';
    end if;

    v_file_id_text := nullif(trim(new.metadata->>'file_id'), '');
    if v_file_id_text is null
       or v_file_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'Valid file_id required';
    end if;

    v_expected_file_type := case
      when new.event_name = 'block_download' then 'block'
      else 'datasheet'
    end;

    if not exists (
      select 1
      from public.product_files pf
      where pf.id = v_file_id_text::uuid
        and pf.product_id = new.product_id
        and pf.is_available = true
        and coalesce(pf.file_type, 'block') = v_expected_file_type
    ) then
      raise exception 'Invalid file';
    end if;
  else
    new.metadata := new.metadata - 'file_id';
  end if;

  new.user_id := v_uid;
  select p.user_type into new.user_type
  from public.profiles p
  where p.id = v_uid;

  if new.user_type is null then
    raise exception 'Profile not found';
  end if;

  return new;
end;
$function$;

revoke execute on function public.set_usage_event_user_snapshot()
from public, anon, authenticated;

commit;
