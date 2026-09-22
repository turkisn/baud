create or replace function private.get_my_role()
returns text
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(
    (
      select p.role
      from public.profiles as p
      where p.id = auth.uid()
    ),
    'user'::text
  );
$function$;

comment on function private.get_my_role() is
  'Returns the caller authorization role and fails closed to user when no profile row exists.';
