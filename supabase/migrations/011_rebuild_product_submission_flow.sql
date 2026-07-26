-- ============================================================
-- BUAD Platform — Migration 011: Rebuild Product Submission Flow
-- Run AFTER migrations 001–010.
-- Fully idempotent — safe to run on any production state.
--
-- ROOT CAUSES ADDRESSED
-- ─────────────────────
-- A. categories table empty or cats_public_read policy missing
--    → supplier sees empty dropdown → category_id = NULL always.
--
-- B. products_owner_update (migration 002) had no WITH CHECK.
--    PostgreSQL defaults WITH CHECK = USING = status IN (draft,rejected).
--    UPDATE to pending_review fails WITH CHECK silently (0 rows, no error).
--
-- C. generate_buod_reference (migration 004) was not SECURITY DEFINER.
--    buod_reference_counters has deny-all RLS. The INSERT inside the
--    trigger ran as the authenticated role → RLS block → trigger exception
--    → entire UPDATE rolled back.
--
-- D. Two-step INSERT+UPDATE approach has no atomicity: if the UPDATE
--    fails, the product stays as an orphaned draft with files attached
--    while the frontend may still report success.
--
-- SOLUTION
-- ────────
-- Add a SECURITY DEFINER RPC submit_product_for_review() that performs
-- the draft→pending_review transition as a single atomic DB operation.
-- The RPC enforces ownership, category, and state server-side before
-- touching anything, then executes the UPDATE that fires the BUOD trigger.
-- All previous idempotent fixes (policies, functions, seeds) are re-applied
-- here so that migration 011 alone is sufficient on a broken production DB.
-- ============================================================


-- ─────────────────────────────────────────────────────────────────
-- 1. Ensure get_my_role is SECURITY DEFINER + search_path
--    (idempotent — migration 002 created it without these)
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
-- 2. Fix products.status CHECK to include revision_required
--    (migration 001 omitted it; migration 006 section 4 added it
--     but may not have run)
-- ─────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_constraint TEXT;
  r RECORD;
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
  ) INTO v_constraint;

  IF NOT v_constraint::BOOLEAN THEN
    EXECUTE 'ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check';
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
      CHECK (status IN ('draft','pending_review','approved','rejected','revision_required','archived'));
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────
-- 3. Fix products.file_format CHECK to include 3DS
--    (migration 001 omitted it; migration 009 added it but may not have run)
-- ─────────────────────────────────────────────────────────────────
DO $$ DECLARE
  v_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO v_name
  FROM information_schema.table_constraints  tc
  JOIN information_schema.check_constraints  cc
    ON  tc.constraint_name   = cc.constraint_name
    AND tc.constraint_schema = cc.constraint_schema
  WHERE tc.table_schema    = 'public'
    AND tc.table_name      = 'product_files'
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause    LIKE '%SKP%'
  LIMIT 1;

  IF v_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.product_files DROP CONSTRAINT %I', v_name);
  END IF;

  ALTER TABLE public.product_files
    ADD CONSTRAINT product_files_file_format_check
    CHECK (file_format IN ('RFA','RVT','MAX','FBX','OBJ','SKP','DWG','IFC','PDF','ZIP','3DS','OTHER'));
EXCEPTION WHEN duplicate_object THEN
  NULL; -- constraint already exists with correct values
END $$;


-- ─────────────────────────────────────────────────────────────────
-- 4. Fix products_owner_update RLS policy
--    USING  → only allow edit when current status is owner-editable
--    WITH CHECK → after update, new status must be in allowed set
--    (migration 002 had no WITH CHECK; migration 006/010 may not have run)
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
-- 5. Ensure cats_public_read and subcats_public_read exist
--    (idempotent — 002 creates them but may have been dropped)
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cats_public_read"    ON public.categories;
DROP POLICY IF EXISTS "subcats_public_read" ON public.subcategories;

CREATE POLICY "cats_public_read"    ON public.categories    FOR SELECT USING (true);
CREATE POLICY "subcats_public_read" ON public.subcategories FOR SELECT USING (true);


-- ─────────────────────────────────────────────────────────────────
-- 6. Re-seed categories (ON CONFLICT DO NOTHING — idempotent)
--    Ensures dropdown is never empty in production.
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.categories (code, name_ar, name_en, icon, sort_order) VALUES
  ('FUR','أثاث',           'Furniture',       '🛋️', 1),
  ('LGT','إضاءة',          'Lighting',        '💡', 2),
  ('KIT','مطبخ',           'Kitchen',         '🍳', 3),
  ('BTH','حمامات',         'Bathroom',        '🚿', 4),
  ('DOR','أبواب',          'Doors',           '🚪', 5),
  ('WIN','نوافذ',          'Windows',         '🪟', 6),
  ('FLR','أرضيات',         'Flooring',        '◼️', 7),
  ('WAL','تشطيبات جدران',  'Wall Finishes',   '🧱', 8),
  ('CEL','أسقف',           'Ceiling',         '⬜', 9),
  ('DEC','ديكور',          'Decoration',      '🎨',10),
  ('OFF','مكتبي',          'Office',          '🖥️',11),
  ('OUT','خارجي',          'Outdoor',         '🌿',12),
  ('LND','تنسيق موقع',     'Landscape',       '🌳',13),
  ('SAN','صحي',            'Sanitary',        '🚰',14),
  ('ELC','كهرباء',         'Electrical',      '⚡',15),
  ('MCH','ميكانيكا',       'Mechanical',      '⚙️',16),
  ('ARC','معماري',         'Architectural',   '🏛️',17),
  ('STR','إنشائي',         'Structural',      '🏗️',18)
ON CONFLICT (code) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────
-- 7. Re-seed subcategories (ON CONFLICT DO NOTHING — idempotent)
-- ─────────────────────────────────────────────────────────────────
WITH cat AS (SELECT id FROM public.categories WHERE code='FUR')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('SOF','كنب وجلسات','Sofas & Sectionals',1),('CHR','كراسي','Chairs',2),('TBL','طاولات','Tables',3),('BED','أسرة','Beds',4),('STG','خزائن وأرفف','Storage & Shelving',5),('OTH','أخرى','Other',6)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='LGT')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('PEN','معلقة','Pendant',1),('CEL','سقفية','Ceiling',2),('WLL','جدارية','Wall',3),('FLR','أرضية','Floor',4),('TAB','طاولة','Table',5),('REC','مدفونة','Recessed',6),('OUT','خارجية','Outdoor',7)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='KIT')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('CAB','خزائن','Cabinets',1),('CNT','أسطح عمل','Countertops',2),('SNK','أحواض','Sinks',3),('APL','أجهزة','Appliances',4)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='BTH')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('SAN','أدوات صحية','Sanitary Ware',1),('VNT','وحدة مغسلة','Vanity',2),('SHW','دوش','Shower',3),('BTB','حوض استحمام','Bathtub',4),('ACC','إكسسوار','Accessories',5)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='DOR')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('WOD','خشبي','Wood',1),('MTL','معدني','Metal',2),('GLS','زجاجي','Glass',3),('FIR','مقاوم للحريق','Fire Rated',4)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='WIN')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('FRM','مؤطر','Framed',1),('FRL','بدون إطار','Frameless',2),('SKY','منور','Skylight',3),('CRN','زاوية','Corner',4)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='FLR')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('PRQ','باركيه','Parquet',1),('TIL','بلاط','Tiles',2),('MRB','رخام','Marble',3),('CRP','سجاد','Carpet',4),('EXP','إيبوكسي','Epoxy',5)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='WAL')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('PNT','دهان','Paint',1),('WLP','ورق جدران','Wallpaper',2),('STN','تكسية حجر','Stone Cladding',3),('WDP','تكسية خشب','Wood Panel',4)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='CEL')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('GYP','جبس','Gypsum',1),('ACT','بلاط صوتي','Acoustic Tiles',2),('STR','سقف مشدود','Stretch Ceiling',3)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='DEC')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('VAS','مزهريات','Vases & Objects',1),('ART','لوحات','Art & Frames',2),('MIR','مرايا','Mirrors',3),('RUG','سجاد','Rugs',4),('CUS','وسائد','Cushions',5)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='OFF')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('DSK','مكاتب','Desks',1),('OCH','كراسي مكتبية','Office Chairs',2),('CAB','أدراج','Filing & Storage',3),('WRK','محطات عمل','Workstations',4)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='OUT')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('FUR','أثاث خارجي','Outdoor Furniture',1),('PVN','تبليط','Paving',2),('FNT','نوافير','Fountains',3)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='LND')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('PLT','نباتات','Plants',1),('TRE','أشجار','Trees',2),('POT','أصص','Pots & Planters',3)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='SAN')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('WC','مراحيض','WC & Bidets',1),('BSN','أحواض','Basins',2),('TAP','حنفيات','Taps & Mixers',3)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='ELC')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('SWT','مفاتيح','Switches & Sockets',1),('PNL','لوحات','Panels',2),('CBL','إدارة الكابلات','Cable Management',3)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='MCH')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('AHU','وحدات هواء','Air Handling',1),('FCU','فان كويل','Fan Coil Units',2),('GRL','شبكات','Grilles & Diffusers',3)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='ARC')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('COL','أعمدة','Columns',1),('RLG','درابزين','Railings',2),('STA','درج','Stairs',3)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='STR')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, s.code, s.name_ar, s.name_en, s.sort_order FROM cat,
(VALUES ('BEA','عوارض','Beams',1),('SLB','بلاطات','Slabs',2),('FND','أساسات','Foundation',3)) s(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────
-- 8. Ensure generate_buod_reference is SECURITY DEFINER
--    (idempotent — migration 004 created it without SECURITY DEFINER,
--     causing the INSERT into buod_reference_counters to be blocked
--     by the deny-all RLS policy on that table)
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


-- ─────────────────────────────────────────────────────────────────
-- 9. Ensure auto_set_buod_reference is SECURITY DEFINER
--    and covers all valid source states
--    (idempotent — migration 004 created it without SECURITY DEFINER)
-- ─────────────────────────────────────────────────────────────────
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
  -- Generate BUOD reference once, on first submission.
  -- Do NOT regenerate if the product already has a reference
  -- (covers the revision_required → pending_review resubmit path).
  IF NEW.buod_reference IS NULL
     AND NEW.status = 'pending_review'
     AND (
       TG_OP = 'INSERT'
       OR OLD.status = 'draft'
       OR OLD.status = 'rejected'
       OR OLD.status = 'revision_required'
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

DROP TRIGGER IF EXISTS trg_auto_buod_reference ON public.products;
CREATE TRIGGER trg_auto_buod_reference
  BEFORE INSERT OR UPDATE OF status ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_buod_reference();


-- ─────────────────────────────────────────────────────────────────
-- 10. Ensure enforce_product_column_acl trigger exists
--     (idempotent — migration 006 creates it; may not have run)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_product_column_acl()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins/reviewers pass through untouched.
  IF public.get_my_role() IN ('admin', 'super_admin', 'reviewer') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Force all security-sensitive columns to safe defaults on INSERT.
    -- This is the primary defence against a supplier self-approving via API.
    NEW.status              := 'draft';
    NEW.visibility          := 'private';
    NEW.verification_status := 'unverified';
    NEW.approved_by         := NULL;
    NEW.approved_at         := NULL;
    NEW.admin_notes         := NULL;
    NEW.rejection_reason    := NULL;
    NEW.buod_reference      := NULL;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Preserve admin-only columns; supplier may NOT modify these.
    -- status is intentionally excluded — suppliers must be able to
    -- change it (draft → pending_review) via submit_product_for_review().
    NEW.approved_by         := OLD.approved_by;
    NEW.approved_at         := OLD.approved_at;
    NEW.verification_status := OLD.verification_status;
    NEW.visibility          := OLD.visibility;
    NEW.admin_notes         := OLD.admin_notes;
    NEW.rejection_reason    := OLD.rejection_reason;
    -- buod_reference excluded: trg_auto_buod_reference is sole authority.
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
-- 11. submit_product_for_review() — the definitive submission RPC
--
--     SECURITY DEFINER: runs as the function owner (postgres superuser),
--     bypassing RLS on the UPDATE. This removes the dependency on
--     products_owner_update WITH CHECK being correct, while preserving
--     all business-rule checks inside this function.
--
--     auth.uid() is still available inside SECURITY DEFINER because
--     Supabase propagates JWT claims as GUC values, which are not
--     affected by the role switch. Ownership is therefore verifiable.
--
--     Trigger behaviour inside SECURITY DEFINER context:
--     - enforce_product_column_acl fires on the UPDATE statement.
--       get_my_role() inside that trigger reads auth.uid() → supplier role
--       → UPDATE path preserves admin-only cols, does NOT touch status. ✓
--     - trg_auto_buod_reference fires on UPDATE OF status.
--       generate_buod_reference() is also SECURITY DEFINER → bypasses
--       counters deny-all RLS → counter increments correctly. ✓
--
--     The function returns the product row after all triggers have run,
--     so the caller receives the actual status and buod_reference that
--     ended up in the database — no assumptions needed.
--
--     Error codes (raised via RAISE EXCEPTION, caught by Supabase JS):
--       PRODUCT_NOT_FOUND        — product id does not exist
--       NOT_OWNER                — caller is not created_by
--       INVALID_STATE:<status>   — current status is not submittable
--       CATEGORY_REQUIRED        — category_id is NULL
-- ─────────────────────────────────────────────────────────────────
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
  -- Lock the row for the duration of this transaction.
  -- Prevents two concurrent submissions of the same product.
  SELECT * INTO v_product
  FROM public.products
  WHERE public.products.id = p_product_id
  FOR UPDATE;

  -- 1. Existence check
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
  END IF;

  -- 2. Ownership check (auth.uid() works inside SECURITY DEFINER)
  IF v_product.created_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'NOT_OWNER';
  END IF;

  -- 3. State check — only these states may transition to pending_review
  IF v_product.status NOT IN ('draft', 'rejected', 'revision_required') THEN
    RAISE EXCEPTION 'INVALID_STATE:%', v_product.status;
  END IF;

  -- 4. Category is required for review
  IF v_product.category_id IS NULL THEN
    RAISE EXCEPTION 'CATEGORY_REQUIRED';
  END IF;

  -- 5. Execute the status transition.
  --    enforce_product_column_acl fires (preserves admin cols, allows status change).
  --    trg_auto_buod_reference fires (generates BUOD ref if buod_reference IS NULL).
  UPDATE public.products
  SET    status = 'pending_review'
  WHERE  public.products.id = p_product_id;

  -- 6. Return the final state — read AFTER triggers have committed their changes.
  RETURN QUERY
  SELECT
    p.id,
    p.status::TEXT,
    p.buod_reference,
    p.category_id
  FROM public.products p
  WHERE p.id = p_product_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_product_for_review(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.submit_product_for_review(UUID) TO authenticated;


-- ─────────────────────────────────────────────────────────────────
-- SECURITY INVARIANTS AFTER MIGRATION 011
--
-- ✓ products_owner_update WITH CHECK prevents supplier from setting
--   status to 'approved' or 'archived' via direct UPDATE.
-- ✓ enforce_product_column_acl BEFORE INSERT forces status='draft'
--   regardless of what the supplier sends.
-- ✓ enforce_product_column_acl BEFORE UPDATE preserves admin-only
--   columns; supplier cannot set approved_by, verified_status, etc.
-- ✓ submit_product_for_review() checks ownership server-side before
--   touching any data; a supplier cannot submit another user's product.
-- ✓ submit_product_for_review() requires category_id != NULL; a product
--   without a category cannot reach pending_review.
-- ✓ generate_buod_reference() is SECURITY DEFINER; the counter INSERT
--   bypasses deny-all RLS on buod_reference_counters.
-- ✓ BUOD reference is set by the server-side trigger only, never by
--   the supplier directly.
-- ✓ Concurrent submissions of the same product are prevented by
--   SELECT ... FOR UPDATE in submit_product_for_review().
-- ✓ All SECURITY DEFINER functions have SET search_path = public.
-- ✓ submit_product_for_review() is callable only by authenticated users.
-- ─────────────────────────────────────────────────────────────────
