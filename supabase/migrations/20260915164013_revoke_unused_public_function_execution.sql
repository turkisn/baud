-- Trigger helpers are internal implementation details, and the legacy lookup RPC
-- has been superseded by get_mvp_product. None should remain on the public API.

begin;

revoke execute on function public.get_product_by_reference(text) from public, anon, authenticated;
revoke execute on function public.handle_updated_at() from public, anon, authenticated;
revoke execute on function public.set_product_price_timestamp() from public, anon, authenticated;
revoke execute on function public.set_product_price_updated_at() from public, anon, authenticated;

commit;
