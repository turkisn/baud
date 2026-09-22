begin;

-- User profile segmentation is editable by the user, but identity/security fields stay server-controlled.
create or replace function public.enforce_profile_role_acl()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.get_my_role() not in ('admin','super_admin') then
    new.role := old.role;
    new.email := old.email;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

-- Snapshot user type on every event so historical analytics remain stable if a user later changes profile type.
alter table public.usage_events add column if not exists user_type text;

alter table public.usage_events drop constraint if exists usage_events_user_type_check;
alter table public.usage_events add constraint usage_events_user_type_check check (
  user_type is null or user_type = any(array[
    'general_user','interior_designer','architect','engineer','design_office',
    'engineering_office','contractor','developer','student',
    'supplier_representative','manufacturer_representative','other'
  ]::text[])
);

create or replace function public.set_usage_event_user_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Never trust client-supplied identity/segmentation for analytics.
  new.user_id := auth.uid();
  select p.user_type into new.user_type
  from public.profiles p
  where p.id = auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_usage_events_user_snapshot on public.usage_events;
create trigger trg_usage_events_user_snapshot
before insert on public.usage_events
for each row execute function public.set_usage_event_user_snapshot();

create index if not exists usage_events_user_type_created_idx
  on public.usage_events (user_type, created_at desc)
  where user_type is not null;

-- Only sanitized profile fields may be changed through the normal self-service route.
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url, phone, company_name, user_type, onboarding_completed) on public.profiles to authenticated;
grant select on public.profiles to authenticated;

commit;
