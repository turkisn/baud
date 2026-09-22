-- Protect internal review/revision history and close PUBLIC execute on role helper.

REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- Review actions contain internal notes and must never be publicly readable.
DROP POLICY IF EXISTS product_review_actions_public_read ON public.product_review_actions;
DROP POLICY IF EXISTS product_review_actions_owner_all ON public.product_review_actions;
DROP POLICY IF EXISTS product_review_actions_owner_read ON public.product_review_actions;
CREATE POLICY product_review_actions_owner_read
ON public.product_review_actions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_id
      AND p.created_by = (select auth.uid())
  )
);

-- Revision snapshots can contain internal/previous values; owners may read their own history,
-- while reviewer/admin write access remains provided by product_revisions_admin_all.
DROP POLICY IF EXISTS product_revisions_public_read ON public.product_revisions;
DROP POLICY IF EXISTS product_revisions_owner_all ON public.product_revisions;
DROP POLICY IF EXISTS product_revisions_owner_read ON public.product_revisions;
CREATE POLICY product_revisions_owner_read
ON public.product_revisions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_id
      AND p.created_by = (select auth.uid())
  )
);
