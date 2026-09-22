-- Fix runtime type mismatch in submit_product_for_review():
-- products.buod_reference is varchar(30), while RETURNS TABLE declares TEXT.
CREATE OR REPLACE FUNCTION public.submit_product_for_review(p_product_id UUID)
RETURNS TABLE (
  id             UUID,
  status         TEXT,
  buod_reference TEXT,
  category_id    UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products;
BEGIN
  SELECT * INTO v_product
  FROM public.products
  WHERE public.products.id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
  END IF;

  IF v_product.created_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'NOT_OWNER';
  END IF;

  IF v_product.status NOT IN ('draft', 'rejected', 'revision_required') THEN
    RAISE EXCEPTION 'INVALID_STATE:%', v_product.status;
  END IF;

  IF v_product.category_id IS NULL THEN
    RAISE EXCEPTION 'CATEGORY_REQUIRED';
  END IF;

  UPDATE public.products
  SET status = 'pending_review'
  WHERE public.products.id = p_product_id;

  RETURN QUERY
  SELECT
    p.id,
    p.status::TEXT,
    p.buod_reference::TEXT,
    p.category_id
  FROM public.products p
  WHERE p.id = p_product_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_product_for_review(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_product_for_review(UUID) TO authenticated;
