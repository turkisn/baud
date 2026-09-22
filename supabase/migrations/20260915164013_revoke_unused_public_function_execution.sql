begin;

revoke execute on function public.get_product_by_reference(text) from public, anon, authenticated;
revoke execute on function public.handle_updated_at() from public, anon, authenticated;
revoke execute on function public.set_product_price_timestamp() from public, anon, authenticated;
revoke execute on function public.set_product_price_updated_at() from public, anon, authenticated;

commit;
