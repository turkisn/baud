create index if not exists usage_events_user_created_at_idx
  on public.usage_events(user_id, created_at desc);

create or replace function public.set_usage_event_user_snapshot()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_file_id_text text;
  v_expected_file_type text;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if new.event_name not in (
    'page_view','product_view','supplier_view','search','filter',
    'block_download','datasheet_download','sign_in','sign_up','profile_update'
  ) then
    raise exception 'Unsupported event';
  end if;

  new.metadata := coalesce(new.metadata, '{}'::jsonb);
  if jsonb_typeof(new.metadata) <> 'object' then
    raise exception 'Metadata must be an object';
  end if;

  new.metadata := new.metadata - array[
    'user_id','user_type','email','role','auth_user_id',
    'file_path','storage_bucket','signed_url','access_token','refresh_token'
  ]::text[];

  if octet_length(new.metadata::text) > 8192 then
    raise exception 'Metadata too large';
  end if;

  if (
    select count(*)
    from public.usage_events e
    where e.user_id = v_uid
      and e.created_at >= now() - interval '1 minute'
  ) >= 300 then
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

  if new.event_name = 'product_view' and new.product_id is null then
    raise exception 'product_id required';
  end if;

  if new.event_name = 'supplier_view' and new.supplier_id is null then
    raise exception 'supplier_id required';
  end if;

  if new.event_name in ('block_download','datasheet_download') then
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
