CREATE OR REPLACE FUNCTION public.increment_view_count(product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = product_id
    AND status = 'approved'
    AND visibility = 'public';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_view_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_download_count(product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = product_id
    AND status = 'approved'
    AND visibility = 'public';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_download_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_download_count(UUID) TO anon, authenticated;
