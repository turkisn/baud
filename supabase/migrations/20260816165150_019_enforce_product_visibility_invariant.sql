create or replace function public.enforce_product_visibility_invariant()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status <> 'approved' then
    new.visibility := 'private';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_product_visibility_invariant() from public, anon, authenticated;

drop trigger if exists trg_03_enforce_product_visibility on public.products;
create trigger trg_03_enforce_product_visibility
before insert or update of status, visibility on public.products
for each row execute function public.enforce_product_visibility_invariant();

update public.products
set visibility = 'private'
where status <> 'approved'
  and visibility = 'public';

alter table public.products
  drop constraint if exists products_public_requires_approved;
alter table public.products
  add constraint products_public_requires_approved
  check (visibility <> 'public' or status = 'approved');
