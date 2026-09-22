alter table public.products
  add column if not exists publication_state text
  generated always as (
    case
      when status = 'approved' and visibility = 'public' then 'published'
      when status = 'archived' then 'archived'
      else 'draft'
    end
  ) stored;

create index if not exists products_publication_state_idx
  on public.products(publication_state);

comment on column public.products.publication_state is
  'Read-only generated MVP projection derived from status/visibility. Write publication_state only through admin_save_mvp_product RPC.';
