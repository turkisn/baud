alter table public.products drop constraint if exists products_price_nonnegative_check;

alter table public.product_files drop constraint if exists product_files_file_type_check;
update public.product_files set file_type='block' where file_type is null;
alter table public.product_files alter column file_type set not null;
alter table public.product_files add constraint product_files_mvp_file_type_check
  check (file_type in ('block','datasheet'));

alter table public.products drop constraint if exists products_currency_format_check;
alter table public.products add constraint products_currency_format_check
  check (currency is null or currency ~ '^[A-Z]{3}$');

alter table public.products drop constraint if exists products_supplier_product_url_scheme_check;
alter table public.products add constraint products_supplier_product_url_scheme_check
  check (supplier_product_url is null or btrim(supplier_product_url)='' or supplier_product_url ~* '^https?://');

alter table public.products drop constraint if exists products_source_url_scheme_check;
alter table public.products add constraint products_source_url_scheme_check
  check (source_url is null or btrim(source_url)='' or source_url ~* '^https?://');

alter table public.suppliers drop constraint if exists suppliers_website_scheme_check;
alter table public.suppliers add constraint suppliers_website_scheme_check
  check (website is null or btrim(website)='' or website ~* '^https?://');

update public.product_specifications set data_type='text' where data_type is null or btrim(data_type)='';
alter table public.product_specifications alter column data_type set default 'text';
alter table public.product_specifications alter column data_type set not null;
alter table public.product_specifications drop constraint if exists product_specifications_data_type_format_check;
alter table public.product_specifications add constraint product_specifications_data_type_format_check
  check (data_type ~ '^[a-z][a-z0-9_]{0,31}$');
