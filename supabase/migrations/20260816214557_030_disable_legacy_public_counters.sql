revoke execute on function public.increment_view_count(uuid) from public, anon, authenticated;
revoke execute on function public.increment_download_count(uuid) from public, anon, authenticated;
grant execute on function public.increment_view_count(uuid) to service_role;
grant execute on function public.increment_download_count(uuid) to service_role;
