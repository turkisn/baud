-- ============================================================
-- BUAD Platform — Migration 007: Admin Backoffice
-- Run AFTER migrations 001–006.
-- Fully idempotent — safe to run multiple times.
-- ============================================================
--
-- WHAT THIS MIGRATION ADDS
-- ─────────────────────────
-- A) admin_audit_log table — records all sensitive admin actions.
--    No passwords, tokens, or secrets are stored.
--
-- B) admin_log_action() SECURITY DEFINER RPC — the only safe write
--    path to admin_audit_log from the frontend (prevents direct INSERT
--    by non-admins, prevents row tampering).
--
-- C) Fix products_reviewer_read — currently limits reviewers to only
--    'pending_review' status. Reviewers need to see all statuses for
--    full review context (approved, rejected, revision_required).
--    DROP old policy, CREATE broader one.
--
-- D) profiles_reviewer_read — reviewers could not read profile data
--    (submitter names) because profiles_select_own was limited to
--    self OR admin/super_admin. Add a reviewer SELECT policy.
--
-- E) admin_verify_entity() SECURITY DEFINER RPC — atomic verification
--    of supplier or manufacturer with mandatory audit log.
--    Only admin/super_admin may call; reviewer gets RAISE EXCEPTION.
--
-- F) Indexes on admin_audit_log for efficient admin queries.
-- ============================================================


-- ─────────────────────────────────────────────────────────────────
-- A. admin_audit_log table
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,          -- e.g. 'product.approve', 'user.role_change'
  target_type   TEXT,                   -- e.g. 'product', 'user', 'supplier'
  target_id     UUID,
  metadata      JSONB DEFAULT '{}',     -- context — no secrets
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_admin_read"   ON public.admin_audit_log;
DROP POLICY IF EXISTS "audit_log_admin_insert"  ON public.admin_audit_log;
DROP POLICY IF EXISTS "audit_log_deny_update"   ON public.admin_audit_log;
DROP POLICY IF EXISTS "audit_log_deny_delete"   ON public.admin_audit_log;

-- Admins and super_admins can read the log
CREATE POLICY "audit_log_admin_read" ON public.admin_audit_log
  FOR SELECT USING (public.get_my_role() IN ('admin', 'super_admin'));

-- Direct INSERT is denied — go through admin_log_action() SECURITY DEFINER
CREATE POLICY "audit_log_admin_insert" ON public.admin_audit_log
  FOR INSERT WITH CHECK (false);

-- Nobody can UPDATE or DELETE audit rows (immutable log)
CREATE POLICY "audit_log_deny_update" ON public.admin_audit_log
  FOR UPDATE USING (false);
CREATE POLICY "audit_log_deny_delete" ON public.admin_audit_log
  FOR DELETE USING (false);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_actor      ON public.admin_audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target     ON public.admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.admin_audit_log(created_at DESC);


-- ─────────────────────────────────────────────────────────────────
-- B. admin_log_action() — trusted audit-log write path
--
--    • SECURITY DEFINER bypasses the "INSERT WITH CHECK (false)" RLS
--      policy on admin_audit_log so only this function can write rows.
--    • Caller must be admin, super_admin, or reviewer (reviewer can
--      log product review actions). All other roles → exception.
--    • Returns the new log row id.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_log_action(
  p_action      TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id   UUID DEFAULT NULL,
  p_metadata    JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_new_id      UUID;
BEGIN
  v_caller_role := public.get_my_role();

  IF v_caller_role NOT IN ('admin', 'super_admin', 'reviewer') THEN
    RAISE EXCEPTION
      'Permission denied: only admin, super_admin, or reviewer may write audit logs.';
  END IF;

  INSERT INTO public.admin_audit_log (actor_user_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_metadata)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_log_action(TEXT, TEXT, UUID, JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_log_action(TEXT, TEXT, UUID, JSONB) TO authenticated;


-- ─────────────────────────────────────────────────────────────────
-- C. Fix products_reviewer_read
--
--    Old policy (migration 002) restricted reviewers to pending_review
--    only. Reviewers need full read access for context:
--    they need to see approved/rejected/revision_required products to
--    provide consistent review decisions.
--
--    products_admin_all still covers admin/super_admin separately.
--    This new policy ONLY adds reviewer read on all statuses.
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "products_reviewer_read" ON public.products;

CREATE POLICY "products_reviewer_read" ON public.products
  FOR SELECT
  USING (public.get_my_role() = 'reviewer');

-- Also extend reviewer access to product sub-tables (images, files, specs, etc.)
-- The existing *_admin_all policies already include reviewer:
--   USING (get_my_role() IN ('admin','super_admin','reviewer'))
-- So no changes needed for sub-tables.


-- ─────────────────────────────────────────────────────────────────
-- D. profiles_reviewer_read
--
--    Reviewers need to read profile data (submitter name, email) when
--    reviewing products. Without this, foreign-key joins to profiles
--    return NULL for reviewer role.
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_reviewer_read" ON public.profiles;

CREATE POLICY "profiles_reviewer_read" ON public.profiles
  FOR SELECT
  USING (public.get_my_role() = 'reviewer');


-- ─────────────────────────────────────────────────────────────────
-- E. admin_verify_entity() — atomic verification with audit log
--
--    Verifies a supplier or manufacturer record in a single DB call,
--    also writing to admin_audit_log. Using a SECURITY DEFINER RPC
--    ensures:
--      1. The caller's role is checked server-side (no frontend bypass).
--      2. The audit log INSERT bypasses the deny-all INSERT policy.
--      3. The verification UPDATE goes through admin_all RLS correctly.
--
--    Allowed callers:   admin, super_admin
--    Blocked callers:   reviewer, supplier, manufacturer, user, anon
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_verify_entity(
  p_entity_type   TEXT,           -- 'supplier' | 'manufacturer'
  p_entity_id     UUID,
  p_new_status    TEXT,           -- 'unverified' | 'pending' | 'verified'
  p_notes         TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- Validate entity type
  IF p_entity_type NOT IN ('supplier', 'manufacturer') THEN
    RAISE EXCEPTION 'Invalid entity_type "%". Must be supplier or manufacturer.', p_entity_type;
  END IF;

  -- Validate status value
  IF p_new_status NOT IN ('unverified', 'pending', 'verified') THEN
    RAISE EXCEPTION 'Invalid status "%". Must be unverified, pending, or verified.', p_new_status;
  END IF;

  -- Check caller role
  v_caller_role := public.get_my_role();
  IF v_caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Permission denied: only admin or super_admin may verify entities.';
  END IF;

  -- Apply update
  IF p_entity_type = 'supplier' THEN
    UPDATE public.suppliers
    SET    verification_status = p_new_status,
           updated_at          = NOW()
    WHERE  id = p_entity_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Supplier % not found.', p_entity_id;
    END IF;
  ELSE
    UPDATE public.manufacturers
    SET    verification_status = p_new_status,
           updated_at          = NOW()
    WHERE  id = p_entity_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Manufacturer % not found.', p_entity_id;
    END IF;
  END IF;

  -- Write audit log (SECURITY DEFINER context — bypasses deny-all INSERT policy)
  INSERT INTO public.admin_audit_log (actor_user_id, action, target_type, target_id, metadata)
  VALUES (
    auth.uid(),
    p_entity_type || '.verification_change',
    p_entity_type,
    p_entity_id,
    jsonb_build_object(
      'new_status', p_new_status,
      'notes', p_notes
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_verify_entity(TEXT, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_verify_entity(TEXT, UUID, TEXT, TEXT) TO authenticated;


-- ─────────────────────────────────────────────────────────────────
-- F. Additional index for products.created_by lookups
--    (admin users page shows submitter names)
-- ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_supplier_id    ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer_id ON public.products(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role           ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_suppliers_owner         ON public.suppliers(owner_id);
CREATE INDEX IF NOT EXISTS idx_manufacturers_owner     ON public.manufacturers(owner_id);


-- ─────────────────────────────────────────────────────────────────
-- SECURITY INVARIANTS AFTER MIGRATION 007
--
-- ✓ admin_audit_log is append-only (no UPDATE/DELETE by any user).
-- ✓ admin_audit_log INSERT only via admin_log_action() or admin_verify_entity().
-- ✓ Reviewer can read all product statuses (not just pending_review).
-- ✓ Reviewer can read profiles for submitter context.
-- ✓ Supplier verification only via admin_verify_entity() — role checked server-side.
-- ✓ No secrets stored in audit log (metadata is application-controlled).
-- ✓ All SECURITY DEFINER functions have SET search_path = public.
-- ─────────────────────────────────────────────────────────────────
