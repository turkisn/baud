-- BUOD Staging hardening: safe, behavior-preserving changes only.

-- 1) Lock function search paths.
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.get_product_by_reference(text) SET search_path = public;

-- 2) Trigger/helper functions must not be directly callable through PostgREST RPC.
REVOKE EXECUTE ON FUNCTION public.auto_set_buod_reference() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_product_column_acl() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_profile_role_acl() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_buod_reference(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- 3) Future BOQ table is intentionally closed until project ownership exists.
DROP POLICY IF EXISTS project_product_instances_deny_all ON public.project_product_instances;
CREATE POLICY project_product_instances_deny_all
ON public.project_product_instances
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 4) Cover foreign keys used in joins/deletes and avoid sequential scans at scale.
CREATE INDEX IF NOT EXISTS idx_product_components_linked_product_id ON public.product_components(linked_product_id);
CREATE INDEX IF NOT EXISTS idx_product_components_product_id ON public.product_components(product_id);
CREATE INDEX IF NOT EXISTS idx_product_files_product_id ON public.product_files(product_id);
CREATE INDEX IF NOT EXISTS idx_product_files_uploaded_by ON public.product_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_materials_product_id ON public.product_materials(product_id);
CREATE INDEX IF NOT EXISTS idx_product_materials_supplier_id ON public.product_materials(supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_review_actions_product_id ON public.product_review_actions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_review_actions_reviewer_id ON public.product_review_actions(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_product_revisions_changed_by ON public.product_revisions(changed_by);
CREATE INDEX IF NOT EXISTS idx_product_revisions_product_id ON public.product_revisions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_specifications_product_id ON public.product_specifications(product_id);
CREATE INDEX IF NOT EXISTS idx_products_approved_by ON public.products(approved_by);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_project_product_instances_product_id ON public.project_product_instances(product_id);
