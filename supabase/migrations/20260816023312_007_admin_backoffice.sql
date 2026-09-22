CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_log_admin_read" ON public.admin_audit_log;
DROP POLICY IF EXISTS "audit_log_admin_insert" ON public.admin_audit_log;
DROP POLICY IF EXISTS "audit_log_deny_update" ON public.admin_audit_log;
DROP POLICY IF EXISTS "audit_log_deny_delete" ON public.admin_audit_log;
CREATE POLICY "audit_log_admin_read" ON public.admin_audit_log FOR SELECT USING (public.get_my_role() IN ('admin','super_admin'));
CREATE POLICY "audit_log_admin_insert" ON public.admin_audit_log FOR INSERT WITH CHECK (false);
CREATE POLICY "audit_log_deny_update" ON public.admin_audit_log FOR UPDATE USING (false);
CREATE POLICY "audit_log_deny_delete" ON public.admin_audit_log FOR DELETE USING (false);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.admin_audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON public.admin_audit_log(target_type,target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.admin_audit_log(created_at DESC);

CREATE OR REPLACE FUNCTION public.admin_log_action(p_action TEXT,p_target_type TEXT DEFAULT NULL,p_target_id UUID DEFAULT NULL,p_metadata JSONB DEFAULT '{}')
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_caller_role TEXT; v_new_id UUID; BEGIN
  v_caller_role := public.get_my_role();
  IF v_caller_role NOT IN ('admin','super_admin','reviewer') THEN RAISE EXCEPTION 'Permission denied: only admin, super_admin, or reviewer may write audit logs.'; END IF;
  INSERT INTO public.admin_audit_log(actor_user_id,action,target_type,target_id,metadata) VALUES(auth.uid(),p_action,p_target_type,p_target_id,p_metadata) RETURNING id INTO v_new_id;
  RETURN v_new_id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_log_action(TEXT,TEXT,UUID,JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_log_action(TEXT,TEXT,UUID,JSONB) TO authenticated;

DROP POLICY IF EXISTS "products_reviewer_read" ON public.products;
CREATE POLICY "products_reviewer_read" ON public.products FOR SELECT USING (public.get_my_role()='reviewer');
DROP POLICY IF EXISTS "profiles_reviewer_read" ON public.profiles;
CREATE POLICY "profiles_reviewer_read" ON public.profiles FOR SELECT USING (public.get_my_role()='reviewer');

CREATE OR REPLACE FUNCTION public.admin_verify_entity(p_entity_type TEXT,p_entity_id UUID,p_new_status TEXT,p_notes TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_caller_role TEXT; BEGIN
  IF p_entity_type NOT IN ('supplier','manufacturer') THEN RAISE EXCEPTION 'Invalid entity_type "%". Must be supplier or manufacturer.',p_entity_type; END IF;
  IF p_new_status NOT IN ('unverified','pending','verified') THEN RAISE EXCEPTION 'Invalid status "%". Must be unverified, pending, or verified.',p_new_status; END IF;
  v_caller_role := public.get_my_role();
  IF v_caller_role NOT IN ('admin','super_admin') THEN RAISE EXCEPTION 'Permission denied: only admin or super_admin may verify entities.'; END IF;
  IF p_entity_type='supplier' THEN
    UPDATE public.suppliers SET verification_status=p_new_status,updated_at=NOW() WHERE id=p_entity_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Supplier % not found.',p_entity_id; END IF;
  ELSE
    UPDATE public.manufacturers SET verification_status=p_new_status,updated_at=NOW() WHERE id=p_entity_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Manufacturer % not found.',p_entity_id; END IF;
  END IF;
  INSERT INTO public.admin_audit_log(actor_user_id,action,target_type,target_id,metadata)
  VALUES(auth.uid(),p_entity_type||'.verification_change',p_entity_type,p_entity_id,jsonb_build_object('new_status',p_new_status,'notes',p_notes));
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_verify_entity(TEXT,UUID,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_verify_entity(TEXT,UUID,TEXT,TEXT) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer_id ON public.products(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_suppliers_owner ON public.suppliers(owner_id);
CREATE INDEX IF NOT EXISTS idx_manufacturers_owner ON public.manufacturers(owner_id);
