-- ============================================================
-- BUAD Platform — Migration 006: Security Hardening
-- Run AFTER migrations 001–005.
-- Fully idempotent — safe to run multiple times.
-- ============================================================
--
-- HOW TO CREATE THE FIRST SUPER_ADMIN (read this before running)
-- ──────────────────────────────────────────────────────────────
-- 1. Make sure the target user has already signed up so their profile
--    row exists in public.profiles.
-- 2. In Supabase Dashboard → SQL Editor, run:
--
--      UPDATE public.profiles
--      SET    role = 'super_admin'
--      WHERE  email = 'turkey.alnusian@gmail.com';
--
-- Why this works safely: the enforce_profile_role_acl trigger below
-- calls get_my_role() → auth.uid(). The SQL Editor runs as the postgres
-- superuser with no JWT context, so auth.uid() returns NULL.
-- In PL/pgSQL, IF NULL THEN evaluates as FALSE, so the trigger does NOT
-- reset the role — the UPDATE succeeds.
--
-- For all subsequent role changes (after the first super_admin exists),
-- use the admin_set_user_role() RPC defined in section 7.
--
-- ============================================================
--
-- WHAT THIS MIGRATION FIXES
-- ─────────────────────────
-- A) CRITICAL (migration 002): profiles_update_own has no WITH CHECK
--    on role, so any user can escalate themselves to admin via API.
--    Fix → enforce_profile_role_acl BEFORE UPDATE trigger (section 2).
--
-- B) CRITICAL (migration 002): products_owner_insert has no column
--    restrictions. A supplier can INSERT with status='approved',
--    visibility='public', verification_status='verified'.
--    Fix → enforce_product_column_acl BEFORE INSERT trigger (section 3).
--
-- C) HIGH (migration 002): products_owner_update has no WITH CHECK.
--    Fix → new policy WITH CHECK (section 5) + same trigger (section 3).
--
-- D) HIGH (migration 002): handle_new_user trusted any role from
--    user-supplied metadata, including admin/super_admin.
--    Fix → whitelist only designer/supplier/manufacturer (section 1).
--
-- E) CRITICAL (migration 004): generate_buod_reference and
--    auto_set_buod_reference are NOT SECURITY DEFINER. migration 002
--    set buod_reference_counters to DENY ALL for RLS, so the counter
--    INSERT/UPDATE is blocked for every authenticated user — BUOD
--    reference generation fails completely in production.
--    Fix → recreate both functions with SECURITY DEFINER (section 8).
--
-- F) MEDIUM (all migrations): SECURITY DEFINER functions are missing
--    SET search_path = public.
--    Fix → added to every SECURITY DEFINER function (all sections).
--
-- G) LOW: increment_view_count missing REVOKE EXECUTE FROM PUBLIC.
--    Fix → explicit REVOKE then targeted GRANT (section 6).
--
-- ============================================================


-- ─────────────────────────────────────────────────────────────────
-- 0. Patch get_my_role()
--    Defined in migration 002 without SET search_path. Safe to
--    replace with CREATE OR REPLACE.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


-- ─────────────────────────────────────────────────────────────────
-- 1. Fix handle_new_user
--
--    Security rules:
--    • Whitelist: only 'designer', 'supplier', 'manufacturer' may be
--      self-selected at signup. Every other value — including
--      'admin', 'reviewer', 'super_admin' — is silently coerced to
--      'user'.
--    • ON CONFLICT: only updates full_name and email. The role column
--      is deliberately excluded — a re-registration must never
--      downgrade or overwrite an existing privileged role.
--    • SET search_path = public: prevents search-path injection.
--    • All table references are fully qualified.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_role TEXT;
BEGIN
  safe_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' IN ('designer', 'supplier', 'manufacturer')
    THEN NEW.raw_user_meta_data->>'role'
    ELSE 'user'
  END;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    safe_role
  )
  ON CONFLICT (id) DO UPDATE
    SET
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      email     = COALESCE(EXCLUDED.email,     public.profiles.email);
      -- role deliberately excluded: re-registration must not touch it.

  RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 2. Protect profiles.role from self-escalation
--
--    Migration 002 "profiles_update_own" has no WITH CHECK on role.
--    RLS controls row access, not column access. Any authenticated
--    user could therefore run:
--        supabase.from('profiles').update({ role: 'admin' })
--    and succeed.
--
--    This BEFORE UPDATE trigger is the correct fix: it fires
--    regardless of how the UPDATE reaches the database and silently
--    resets role to OLD.role for any caller whose auth.uid() maps
--    to a non-admin profile.
--
--    Bootstrap / trusted contexts:
--    In the Supabase SQL Editor (postgres role) and when called with
--    the service_role key, auth.uid() returns NULL because there is
--    no JWT. get_my_role() returns NULL. In PL/pgSQL, IF NULL THEN
--    evaluates as FALSE, so the trigger does NOT block the change.
--    This is the intended behaviour: trusted contexts bypass the guard.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_profile_role_acl()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() = NULL  →  get_my_role() = NULL
  -- NULL NOT IN ('admin','super_admin')  →  NULL  (not TRUE)
  -- IF NULL THEN  →  FALSE  →  block is skipped  →  trusted context passes
  IF public.get_my_role() NOT IN ('admin', 'super_admin') THEN
    NEW.role := OLD.role;   -- silently preserve; never raise an error
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_role_acl ON public.profiles;
CREATE TRIGGER enforce_profile_role_acl
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_role_acl();


-- ─────────────────────────────────────────────────────────────────
-- 3. Protect admin-only product columns on INSERT and UPDATE
--
--    Trigger is named enforce_* ('e') so it sorts alphabetically
--    BEFORE trg_auto_buod_reference ('t'). PostgreSQL fires BEFORE
--    ROW triggers in name order within the same timing and event.
--
--    INSERT attack path (supplier sends status='pending_review'):
--      1. enforce_product_column_acl → forces status='draft',
--         buod_reference=NULL.
--      2. trg_auto_buod_reference → WHEN requires status='pending_review';
--         sees 'draft' → skips. Counter is NOT incremented. Safe.
--
--    Normal submit path (supplier sends UPDATE status='pending_review'):
--      1. enforce_product_column_acl → resets admin columns to OLD
--         values. buod_reference is intentionally NOT touched here.
--      2. trg_auto_buod_reference → sees status='pending_review' and
--         buod_reference IS NULL → generates and assigns the reference.
--
--    Admin path:
--      1. enforce_product_column_acl → get_my_role() IN ('admin',
--         'super_admin','reviewer') → RETURN NEW immediately.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_product_column_acl()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_my_role() IN ('admin', 'super_admin', 'reviewer') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status              := 'draft';
    NEW.visibility          := 'private';
    NEW.verification_status := 'unverified';
    NEW.approved_by         := NULL;
    NEW.approved_at         := NULL;
    NEW.admin_notes         := NULL;
    NEW.rejection_reason    := NULL;
    NEW.buod_reference      := NULL;
    -- buod_reference=NULL on INSERT ensures that even if the status
    -- were somehow 'pending_review' at this point (it isn't, because
    -- we just forced 'draft'), the BUOD trigger's IS NULL guard would
    -- still fire correctly. Belt-and-braces.

  ELSIF TG_OP = 'UPDATE' THEN
    NEW.approved_by         := OLD.approved_by;
    NEW.approved_at         := OLD.approved_at;
    NEW.verification_status := OLD.verification_status;
    NEW.visibility          := OLD.visibility;
    NEW.admin_notes         := OLD.admin_notes;
    NEW.rejection_reason    := OLD.rejection_reason;
    -- buod_reference excluded: trg_auto_buod_reference (fires after
    -- this trigger alphabetically) is the sole authority for that column.

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_product_column_acl ON public.products;
CREATE TRIGGER enforce_product_column_acl
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_product_column_acl();


-- ─────────────────────────────────────────────────────────────────
-- 4. Add 'revision_required' to products.status CHECK constraint
-- ─────────────────────────────────────────────────────────────────
DO $$
DECLARE
  r          RECORD;
  already_ok BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints  tc
    JOIN information_schema.check_constraints  cc
      ON  tc.constraint_name   = cc.constraint_name
      AND tc.constraint_schema = cc.constraint_schema
    WHERE tc.table_schema    = 'public'
      AND tc.table_name      = 'products'
      AND tc.constraint_type = 'CHECK'
      AND cc.check_clause    LIKE '%revision_required%'
  ) INTO already_ok;

  IF NOT already_ok THEN
    -- Drop by canonical name (ALTER TABLE … DROP CONSTRAINT IF EXISTS is valid)
    EXECUTE 'ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check';

    -- Catch any stale auto-named status constraint.
    -- '%pending_review%' appears only in the status column CHECK —
    -- not in visibility or verification_status constraints.
    FOR r IN
      SELECT tc.constraint_name
      FROM information_schema.table_constraints  tc
      JOIN information_schema.check_constraints  cc
        ON  tc.constraint_name   = cc.constraint_name
        AND tc.constraint_schema = cc.constraint_schema
      WHERE tc.table_schema    = 'public'
        AND tc.table_name      = 'products'
        AND tc.constraint_type = 'CHECK'
        AND cc.check_clause    LIKE '%pending_review%'
    LOOP
      EXECUTE format('ALTER TABLE public.products DROP CONSTRAINT %I', r.constraint_name);
    END LOOP;

    ALTER TABLE public.products
      ADD CONSTRAINT products_status_check
      CHECK (status IN (
        'draft', 'pending_review', 'approved',
        'rejected', 'revision_required', 'archived'
      ));
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────
-- 5. Fix products_owner_update RLS policy
--
--    Old policy (migration 002) had no WITH CHECK, allowing a supplier
--    to UPDATE their own product status to 'approved'.
--    The trigger in section 3 is the primary column-level defence;
--    this RLS WITH CHECK is a second independent layer.
--    Also adds 'revision_required' to USING so suppliers can edit and
--    resubmit a product after an admin has requested changes.
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "products_owner_update" ON public.products;

CREATE POLICY "products_owner_update" ON public.products
  FOR UPDATE
  USING (
    created_by = auth.uid()
    AND status IN ('draft', 'rejected', 'revision_required')
  )
  WITH CHECK (
    created_by = auth.uid()
    AND status IN ('draft', 'pending_review', 'rejected', 'revision_required')
  );


-- ─────────────────────────────────────────────────────────────────
-- 6. increment_view_count
--
--    • SET search_path = public.
--    • WHERE restricts to approved + public rows only.
--    • Only view_count is modified.
--    • REVOKE FROM PUBLIC then targeted GRANT.
--      PostgreSQL grants EXECUTE to PUBLIC by default; the explicit
--      REVOKE closes that gap. service_role and postgres (superuser)
--      can always call functions regardless of grants.
--    • anon: intentional — unauthenticated page views should count.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_view_count(product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET    view_count = COALESCE(view_count, 0) + 1
  WHERE  id         = product_id
    AND  status     = 'approved'
    AND  visibility = 'public';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_view_count(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.increment_view_count(UUID) TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────────
-- 7. Trusted role-management RPC: admin_set_user_role
--
--    This is the ONLY safe path for promoting/demoting users to
--    privileged roles after the initial bootstrap.
--
--    Privilege tiers enforced inside the function:
--
--    ┌─────────────────────────────────┬──────────────────────────────────┐
--    │ Caller                          │ May assign                       │
--    ├─────────────────────────────────┼──────────────────────────────────┤
--    │ auth.uid() IS NULL              │ any role (trusted backend)       │
--    │ (SQL Editor / service_role)     │                                  │
--    ├─────────────────────────────────┼──────────────────────────────────┤
--    │ super_admin                     │ any role                         │
--    ├─────────────────────────────────┼──────────────────────────────────┤
--    │ admin                           │ reviewer, designer, supplier,    │
--    │                                 │ manufacturer, user               │
--    │                                 │ (NOT admin or super_admin)       │
--    │                                 │ (NOT targets already admin/      │
--    │                                 │  super_admin — "remove" blocked) │
--    ├─────────────────────────────────┼──────────────────────────────────┤
--    │ anyone else                     │ nothing — exception              │
--    └─────────────────────────────────┴──────────────────────────────────┘
--
--    Additional invariants:
--    • No caller may change their own role through this RPC.
--    • anon cannot reach this RPC (REVOKE FROM PUBLIC).
--    • SECURITY DEFINER so the UPDATE bypasses the profiles_update_own
--      RLS policy and the enforce_profile_role_acl trigger — this RPC
--      IS the trusted role-management path.
--
--    Usage examples:
--      -- SQL Editor (bootstrap / one-off):
--      SELECT public.admin_set_user_role(
--        '00000000-0000-0000-0000-000000000000',
--        'admin'
--      );
--
--      -- Trusted backend (service_role key):
--      const { error } = await supabase.rpc('admin_set_user_role', {
--        target_user_id: userId,
--        new_role: 'reviewer',
--      });
--
--      -- Admin UI (caller must be admin or super_admin):
--      const { error } = await supabase.rpc('admin_set_user_role', {
--        target_user_id: userId,
--        new_role: 'supplier',
--      });
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  target_user_id UUID,
  new_role       TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role      TEXT;
  target_curr_role TEXT;
BEGIN
  -- 1. Validate new_role is a known value
  IF new_role NOT IN (
    'user', 'designer', 'supplier', 'manufacturer',
    'reviewer', 'admin', 'super_admin'
  ) THEN
    RAISE EXCEPTION
      'Invalid role "%". Must be one of: user, designer, supplier, '
      'manufacturer, reviewer, admin, super_admin.', new_role;
  END IF;

  -- 2. Trusted context: SQL Editor (postgres) or service_role key.
  --    auth.uid() = NULL in both cases — no JWT sub claim.
  --    Bypass all further checks and apply the change directly.
  IF auth.uid() IS NULL THEN
    UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'No profile found for user id %.', target_user_id;
    END IF;
    RETURN;
  END IF;

  -- 3. From here the caller holds a JWT — resolve their role.
  caller_role := public.get_my_role();

  -- 4. Only admin and super_admin may call this RPC at all.
  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION
      'Permission denied: only admin or super_admin can change user roles.';
  END IF;

  -- 5. No caller may change their own role.
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'Permission denied: you may not change your own role.';
  END IF;

  -- 6. Fetch the target's current role (needed for "remove" check below).
  SELECT role INTO target_curr_role
  FROM   public.profiles
  WHERE  id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No profile found for user id %.', target_user_id;
  END IF;

  -- 7. Assigning admin or super_admin requires super_admin.
  IF new_role IN ('admin', 'super_admin') AND caller_role <> 'super_admin' THEN
    RAISE EXCEPTION
      'Permission denied: only super_admin may assign the "%" role.', new_role;
  END IF;

  -- 8. Modifying a user whose current role is admin or super_admin also
  --    requires super_admin — this closes the "demote admin" path for
  --    other admins.
  IF target_curr_role IN ('admin', 'super_admin') AND caller_role <> 'super_admin' THEN
    RAISE EXCEPTION
      'Permission denied: only super_admin may modify a user who currently '
      'holds the "%" role.', target_curr_role;
  END IF;

  -- 9. All checks passed — apply the role change.
  UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated;
-- NOT granted to anon.
-- service_role and postgres bypass GRANT checks (superuser privilege).


-- ─────────────────────────────────────────────────────────────────
-- 8. Patch generate_buod_reference and auto_set_buod_reference
--
--    CRITICAL BUG IN MIGRATION 004:
--    Neither function was declared SECURITY DEFINER. Migration 002
--    set buod_reference_counters to DENY ALL via RLS ("Only SECURITY
--    DEFINER functions can modify"). Without SECURITY DEFINER, the
--    INSERT/UPDATE in generate_buod_reference runs as the authenticated
--    role and is blocked by that deny-all policy. BUOD reference
--    generation silently fails for every product submission.
--
--    Additional fix: auto_set_buod_reference's WHEN condition did not
--    include OLD.status = 'revision_required'. Now that this status
--    exists, a product resubmitted after revision (revision_required →
--    pending_review) where buod_reference is somehow NULL would never
--    get a reference generated. Adding it for completeness (in practice
--    buod_reference is already set before revision_required is reached,
--    so NEW.buod_reference IS NULL would be false anyway).
--
--    The trigger is recreated after the function to rebind it to the
--    updated function body.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_buod_reference(
  p_category_code    TEXT,
  p_subcategory_code TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_num BIGINT;
BEGIN
  INSERT INTO public.buod_reference_counters (category_code, subcategory_code, last_number)
    VALUES (p_category_code, p_subcategory_code, 1)
  ON CONFLICT (category_code, subcategory_code)
  DO UPDATE
    SET last_number = buod_reference_counters.last_number + 1
  RETURNING last_number INTO v_next_num;

  RETURN format('BUOD-%s-%s-%s',
    upper(p_category_code),
    upper(p_subcategory_code),
    lpad(v_next_num::TEXT, 6, '0')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_set_buod_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cat_code TEXT;
  v_sub_code TEXT;
BEGIN
  IF NEW.buod_reference IS NULL
     AND NEW.status = 'pending_review'
     AND (
       TG_OP = 'INSERT'
       OR OLD.status = 'draft'
       OR OLD.status = 'rejected'
       OR OLD.status = 'revision_required'   -- added: covers resubmission path
     )
  THEN
    SELECT code INTO v_cat_code FROM public.categories    WHERE id = NEW.category_id;
    SELECT code INTO v_sub_code FROM public.subcategories WHERE id = NEW.subcategory_id;

    v_cat_code := COALESCE(v_cat_code, 'GEN');
    v_sub_code := COALESCE(v_sub_code, 'GEN');

    NEW.buod_reference := public.generate_buod_reference(v_cat_code, v_sub_code);
  END IF;

  RETURN NEW;
END;
$$;

-- Rebind trigger to updated function
DROP TRIGGER IF EXISTS trg_auto_buod_reference ON public.products;
CREATE TRIGGER trg_auto_buod_reference
  BEFORE INSERT OR UPDATE OF status ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_buod_reference();


-- ─────────────────────────────────────────────────────────────────
-- SECURITY DEFINER + search_path audit across all migrations
--
-- migration 001:
--   handle_updated_at          — NOT SECURITY DEFINER (correct: only sets
--                                NEW.updated_at, no cross-table access needed)
--   handle_new_user            — patched above (section 1) ✓
--
-- migration 002:
--   get_my_role                — patched above (section 0) ✓
--
-- migration 004:
--   generate_buod_reference    — patched above (section 8) ✓
--   auto_set_buod_reference    — patched above (section 8) ✓
--   get_product_by_reference   — NOT SECURITY DEFINER (correct: public
--                                SELECT, RLS visibility is intentional)
--
-- migration 006 (this file):
--   enforce_profile_role_acl   — SECURITY DEFINER + search_path ✓
--   enforce_product_column_acl — SECURITY DEFINER + search_path ✓
--   increment_view_count       — SECURITY DEFINER + search_path ✓
--   admin_set_user_role        — SECURITY DEFINER + search_path ✓
--
-- ─────────────────────────────────────────────────────────────────
-- SECURITY INVARIANTS AFTER THIS MIGRATION
--
-- ✓ Signup cannot produce admin/reviewer/super_admin profiles.
-- ✓ Authenticated users cannot escalate their own role via profile UPDATE.
-- ✓ Product INSERT forces status=draft, visibility=private,
--   verification_status=unverified — no column can be self-approved.
-- ✓ Product UPDATE cannot set approved_by, approved_at,
--   verification_status, visibility, admin_notes, rejection_reason.
-- ✓ Product status cannot be self-escalated to 'approved' or 'archived'
--   (RLS WITH CHECK layer, independent of the trigger).
-- ✓ BUOD reference counter cannot be inflated via crafted INSERT
--   (enforce trigger fires first, forces status='draft').
-- ✓ BUOD counter INSERT now works for authenticated users (SECURITY
--   DEFINER on generate_buod_reference bypasses deny-all RLS).
-- ✓ All SECURITY DEFINER functions have SET search_path = public.
-- ✓ increment_view_count: callable only by anon and authenticated.
-- ✓ admin_set_user_role: callable only by admin/super_admin or trusted
--   contexts; all other callers get RAISE EXCEPTION.
-- ✓ No caller can change their own role via admin_set_user_role.
-- ✓ admin may assign only: reviewer, designer, supplier, manufacturer, user.
-- ✓ admin may NOT assign admin or super_admin (requires super_admin).
-- ✓ admin may NOT modify a user whose current role is admin or super_admin.
-- ✓ super_admin may assign any valid role.
-- ✓ SQL Editor / service_role (auth.uid()=NULL) bypass all role checks
--   and can assign any role — required for backend administration.
-- ─────────────────────────────────────────────────────────────────
