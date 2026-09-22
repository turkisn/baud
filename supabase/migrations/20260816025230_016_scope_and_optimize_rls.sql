-- Scope RLS policies to API roles and cache auth.uid() per statement.

-- profiles
ALTER POLICY profiles_select_own ON public.profiles TO authenticated USING (id = (select auth.uid()) OR public.get_my_role() IN ('admin','super_admin'));
ALTER POLICY profiles_update_own ON public.profiles TO authenticated USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));
ALTER POLICY profiles_admin_all ON public.profiles TO authenticated;
ALTER POLICY profiles_reviewer_read ON public.profiles TO authenticated;

-- categories
ALTER POLICY cats_public_read ON public.categories TO anon, authenticated;
ALTER POLICY cats_admin_write ON public.categories TO authenticated;
ALTER POLICY subcats_public_read ON public.subcategories TO anon, authenticated;
ALTER POLICY subcats_admin_write ON public.subcategories TO authenticated;

-- suppliers/manufacturers
ALTER POLICY suppliers_public_read ON public.suppliers TO anon, authenticated;
ALTER POLICY suppliers_owner_write ON public.suppliers TO authenticated USING (owner_id = (select auth.uid())) WITH CHECK (owner_id = (select auth.uid()));
ALTER POLICY suppliers_admin_all ON public.suppliers TO authenticated;
ALTER POLICY mfr_public_read ON public.manufacturers TO anon, authenticated;
ALTER POLICY mfr_owner_write ON public.manufacturers TO authenticated USING (owner_id = (select auth.uid())) WITH CHECK (owner_id = (select auth.uid()));
ALTER POLICY mfr_admin_all ON public.manufacturers TO authenticated;

-- products
ALTER POLICY products_public_read ON public.products TO anon, authenticated;
ALTER POLICY products_owner_read ON public.products TO authenticated USING (created_by = (select auth.uid()));
ALTER POLICY products_owner_insert ON public.products TO authenticated WITH CHECK (created_by = (select auth.uid()));
ALTER POLICY products_owner_update ON public.products TO authenticated
  USING (created_by = (select auth.uid()) AND status IN ('draft','rejected','revision_required'))
  WITH CHECK (created_by = (select auth.uid()) AND status IN ('draft','rejected','revision_required'));
ALTER POLICY products_reviewer_read ON public.products TO authenticated;
ALTER POLICY products_admin_all ON public.products TO authenticated;

-- product child tables
ALTER POLICY product_images_public_read ON public.product_images TO anon, authenticated;
ALTER POLICY product_images_owner_all ON public.product_images TO authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.created_by = (select auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.created_by = (select auth.uid())));
ALTER POLICY product_images_admin_all ON public.product_images TO authenticated;

ALTER POLICY product_files_public_read ON public.product_files TO anon, authenticated;
ALTER POLICY product_files_owner_all ON public.product_files TO authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.created_by = (select auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.created_by = (select auth.uid())));
ALTER POLICY product_files_admin_all ON public.product_files TO authenticated;

ALTER POLICY product_specifications_public_read ON public.product_specifications TO anon, authenticated;
ALTER POLICY product_specifications_owner_all ON public.product_specifications TO authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.created_by = (select auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.created_by = (select auth.uid())));
ALTER POLICY product_specifications_admin_all ON public.product_specifications TO authenticated;

ALTER POLICY product_materials_public_read ON public.product_materials TO anon, authenticated;
ALTER POLICY product_materials_owner_all ON public.product_materials TO authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.created_by = (select auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.created_by = (select auth.uid())));
ALTER POLICY product_materials_admin_all ON public.product_materials TO authenticated;

ALTER POLICY product_components_public_read ON public.product_components TO anon, authenticated;
ALTER POLICY product_components_owner_all ON public.product_components TO authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.created_by = (select auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.created_by = (select auth.uid())));
ALTER POLICY product_components_admin_all ON public.product_components TO authenticated;

ALTER POLICY product_revisions_public_read ON public.product_revisions TO anon, authenticated;
ALTER POLICY product_revisions_owner_all ON public.product_revisions TO authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.created_by = (select auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.created_by = (select auth.uid())));
ALTER POLICY product_revisions_admin_all ON public.product_revisions TO authenticated;

ALTER POLICY product_review_actions_public_read ON public.product_review_actions TO anon, authenticated;
ALTER POLICY product_review_actions_owner_all ON public.product_review_actions TO authenticated USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.created_by = (select auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.created_by = (select auth.uid())));
ALTER POLICY product_review_actions_admin_all ON public.product_review_actions TO authenticated;

-- counters/audit
ALTER POLICY counters_deny_all ON public.buod_reference_counters TO anon, authenticated;
ALTER POLICY audit_log_admin_read ON public.admin_audit_log TO authenticated;
ALTER POLICY audit_log_admin_insert ON public.admin_audit_log TO authenticated;
ALTER POLICY audit_log_deny_update ON public.admin_audit_log TO authenticated;
ALTER POLICY audit_log_deny_delete ON public.admin_audit_log TO authenticated;

-- storage
ALTER POLICY images_public_view ON storage.objects TO anon, authenticated;
ALTER POLICY images_owner_upload ON storage.objects TO authenticated WITH CHECK (bucket_id='product-images' AND (select auth.uid()) IS NOT NULL AND (storage.foldername(name))[1]=(select auth.uid())::text);
ALTER POLICY images_owner_delete ON storage.objects TO authenticated USING (bucket_id='product-images' AND (storage.foldername(name))[1]=(select auth.uid())::text);
ALTER POLICY files_owner_upload ON storage.objects TO authenticated WITH CHECK (bucket_id='product-files' AND (select auth.uid()) IS NOT NULL AND (storage.foldername(name))[1]=(select auth.uid())::text);
ALTER POLICY files_owner_read ON storage.objects TO authenticated USING (bucket_id='product-files' AND ((storage.foldername(name))[1]=(select auth.uid())::text OR (SELECT role FROM public.profiles WHERE id=(select auth.uid())) IN ('admin','super_admin','reviewer')));
ALTER POLICY files_owner_delete ON storage.objects TO authenticated USING (bucket_id='product-files' AND ((storage.foldername(name))[1]=(select auth.uid())::text OR (SELECT role FROM public.profiles WHERE id=(select auth.uid())) IN ('admin','super_admin')));
ALTER POLICY docs_owner_upload ON storage.objects TO authenticated WITH CHECK (bucket_id IN ('supplier-documents','ownership-proofs') AND (select auth.uid()) IS NOT NULL AND (storage.foldername(name))[1]=(select auth.uid())::text);
ALTER POLICY docs_owner_read ON storage.objects TO authenticated USING (bucket_id IN ('supplier-documents','ownership-proofs') AND ((storage.foldername(name))[1]=(select auth.uid())::text OR (SELECT role FROM public.profiles WHERE id=(select auth.uid())) IN ('admin','super_admin')));

-- anon no longer needs the role helper once policies are role-scoped.
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon;
