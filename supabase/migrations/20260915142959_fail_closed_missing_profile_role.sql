-- Fail closed when an authenticated user has no matching profile row.
--
-- The administrative RPCs intentionally use SECURITY DEFINER and validate the
-- caller through this helper. Returning NULL made PL/pgSQL `role NOT IN (...)`
-- guards evaluate to NULL instead of TRUE, so a profile-less account could
-- reach privileged code paths. Treating that exceptional state as the normal
-- `user` role keeps all existing RLS behavior while denying privileged access.

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
