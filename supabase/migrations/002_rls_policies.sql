-- ============================================================
-- BUAD Platform — Migration 002: Row Level Security Policies
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ── Enable RLS ───────────────────────────────────────────────
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_files         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_materials     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_components    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_revisions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_review_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buod_reference_counters ENABLE ROW LEVEL SECURITY;

-- ── Helper: get current user role ────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ── profiles ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all"    ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.get_my_role() IN ('admin','super_admin'));

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.get_my_role() IN ('admin','super_admin'));

-- ── categories / subcategories (public read) ─────────────────
DROP POLICY IF EXISTS "cats_public_read"  ON public.categories;
DROP POLICY IF EXISTS "subcats_public_read" ON public.subcategories;
DROP POLICY IF EXISTS "cats_admin_write"  ON public.categories;
DROP POLICY IF EXISTS "subcats_admin_write" ON public.subcategories;

CREATE POLICY "cats_public_read"    ON public.categories    FOR SELECT USING (true);
CREATE POLICY "subcats_public_read" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "cats_admin_write"    ON public.categories
  FOR ALL USING (public.get_my_role() IN ('admin','super_admin'));
CREATE POLICY "subcats_admin_write" ON public.subcategories
  FOR ALL USING (public.get_my_role() IN ('admin','super_admin'));

-- ── suppliers ────────────────────────────────────────────────
DROP POLICY IF EXISTS "suppliers_public_read"   ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_owner_write"   ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_admin_all"     ON public.suppliers;

CREATE POLICY "suppliers_public_read" ON public.suppliers
  FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "suppliers_owner_write" ON public.suppliers
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "suppliers_admin_all" ON public.suppliers
  FOR ALL USING (public.get_my_role() IN ('admin','super_admin'));

-- ── manufacturers ────────────────────────────────────────────
DROP POLICY IF EXISTS "mfr_public_read"   ON public.manufacturers;
DROP POLICY IF EXISTS "mfr_owner_write"   ON public.manufacturers;
DROP POLICY IF EXISTS "mfr_admin_all"     ON public.manufacturers;

CREATE POLICY "mfr_public_read"   ON public.manufacturers
  FOR SELECT USING (verification_status = 'verified');
CREATE POLICY "mfr_owner_write"   ON public.manufacturers
  FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "mfr_admin_all"     ON public.manufacturers
  FOR ALL USING (public.get_my_role() IN ('admin','super_admin'));

-- ── products ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "products_public_read"     ON public.products;
DROP POLICY IF EXISTS "products_owner_read"      ON public.products;
DROP POLICY IF EXISTS "products_owner_insert"    ON public.products;
DROP POLICY IF EXISTS "products_owner_update"    ON public.products;
DROP POLICY IF EXISTS "products_reviewer_read"   ON public.products;
DROP POLICY IF EXISTS "products_admin_all"       ON public.products;

-- Public: approved + public products only
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT
  USING (status = 'approved' AND visibility = 'public');

-- Owner: see all own products
CREATE POLICY "products_owner_read" ON public.products
  FOR SELECT
  USING (created_by = auth.uid());

-- Owner: insert own products
CREATE POLICY "products_owner_insert" ON public.products
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Owner: update draft or rejected products only
CREATE POLICY "products_owner_update" ON public.products
  FOR UPDATE
  USING (created_by = auth.uid() AND status IN ('draft','rejected'));

-- Reviewer: see pending products
CREATE POLICY "products_reviewer_read" ON public.products
  FOR SELECT
  USING (
    public.get_my_role() IN ('reviewer','admin','super_admin')
    AND status = 'pending_review'
  );

-- Admin: full access
CREATE POLICY "products_admin_all" ON public.products
  FOR ALL
  USING (public.get_my_role() IN ('admin','super_admin'));

-- ── product sub-tables (images, files, specs, materials, components) ─
-- Policy: owner or admin can read/write; public can read files of approved products

DO $$ DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['product_images','product_files','product_specifications','product_materials','product_components','product_revisions','product_review_actions']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_owner_all"  ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_admin_all"  ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_public_read" ON public.%I', tbl, tbl);

    -- Owner access via product ownership
    EXECUTE format(
      'CREATE POLICY "%s_owner_all" ON public.%I FOR ALL USING (
        EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.created_by = auth.uid())
      )', tbl, tbl);

    -- Admin full access
    EXECUTE format(
      'CREATE POLICY "%s_admin_all" ON public.%I FOR ALL USING (
        public.get_my_role() IN (''admin'',''super_admin'',''reviewer'')
      )', tbl, tbl);

    -- Public read for approved product sub-data
    EXECUTE format(
      'CREATE POLICY "%s_public_read" ON public.%I FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.status = ''approved'' AND p.visibility = ''public'')
      )', tbl, tbl);
  END LOOP;
END $$;

-- ── BUOD reference counters: only functions can write ────────
DROP POLICY IF EXISTS "counters_deny_all" ON public.buod_reference_counters;
CREATE POLICY "counters_deny_all" ON public.buod_reference_counters
  FOR ALL USING (false); -- Only SECURITY DEFINER functions can modify
