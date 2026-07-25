-- ============================================================
-- BUAD Platform — Migration 010: Fix Product Submission Flow
-- Run AFTER migrations 001–009.
--
-- PROBLEMS FIXED
-- ──────────────
-- 1. products_owner_update RLS policy had no WITH CHECK clause.
--    PostgreSQL defaults WITH CHECK to the USING expression when
--    WITH CHECK is omitted on an UPDATE policy.
--    USING = (status IN ('draft','rejected'))
--    → WITH CHECK also = (status IN ('draft','rejected'))
--    → Setting status = 'pending_review' fails WITH CHECK silently.
--    The UPDATE returns 0 rows with no error. Status stays 'draft'.
--
--    Migration 006 section 5 was supposed to fix this (adding WITH
--    CHECK that includes 'pending_review'), but if that migration
--    aborted mid-flight the fix never took effect in production.
--
-- 2. generate_buod_reference and auto_set_buod_reference lacked
--    SECURITY DEFINER in migration 004. Without it the INSERT into
--    buod_reference_counters (which has a deny-all RLS policy) ran
--    as the authenticated role and was blocked. Migration 006 section
--    8 patched this, but same caveat applies if 006 never finished.
--    CREATE OR REPLACE is idempotent: safe to re-run.
--
-- 3. Categories table may be empty in production if migration 005
--    was not applied. An empty table → no options in the dropdown
--    → user submits without selecting → category_id = null always.
--    INSERT … ON CONFLICT DO NOTHING is idempotent: safe to re-run.
-- ============================================================


-- ─────────────────────────────────────────────────────────────────
-- 1. Fix products_owner_update RLS policy
--
--    USING  → row is editable when it is still in an owner-editable
--              state (draft / rejected / revision_required).
--    WITH CHECK → after the UPDATE the new row must either remain in
--              an owner-editable state OR have moved to pending_review.
--              This is the minimum permission required for the
--              draft → pending_review transition; 'approved' and
--              'archived' remain unreachable by this path.
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
-- 2. Ensure generate_buod_reference is SECURITY DEFINER
--    (idempotent via CREATE OR REPLACE)
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
-- 3. Ensure auto_set_buod_reference is SECURITY DEFINER
--    (idempotent via CREATE OR REPLACE; trigger is re-bound)
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
-- 4. Ensure cats_public_read RLS policy exists on categories
--    (safe to re-run: DROP IF EXISTS then CREATE)
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cats_public_read" ON public.categories;
CREATE POLICY "cats_public_read" ON public.categories
  FOR SELECT USING (true);


-- ─────────────────────────────────────────────────────────────────
-- 5. Re-seed categories (ON CONFLICT DO NOTHING — idempotent)
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
-- 6. Re-seed subcategories (ON CONFLICT DO NOTHING — idempotent)
-- ─────────────────────────────────────────────────────────────────
WITH cat AS (SELECT id FROM public.categories WHERE code='FUR')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES
  ('SOF','كنب وجلسات',   'Sofas & Sectionals',1),
  ('CHR','كراسي',         'Chairs',            2),
  ('TBL','طاولات',        'Tables',            3),
  ('BED','أسرة',          'Beds',              4),
  ('STG','خزائن وأرفف',  'Storage & Shelving',5),
  ('OTH','أخرى',          'Other',             6)
) AS sub(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='LGT')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES
  ('PEN','معلقة',   'Pendant',  1),
  ('CEL','سقفية',   'Ceiling',  2),
  ('WLL','جدارية',  'Wall',     3),
  ('FLR','أرضية',   'Floor',    4),
  ('TAB','طاولة',   'Table',    5),
  ('REC','مدفونة',  'Recessed', 6),
  ('OUT','خارجية',  'Outdoor',  7)
) AS sub(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='KIT')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES
  ('CAB','خزائن',      'Cabinets',     1),
  ('CNT','أسطح عمل',  'Countertops',  2),
  ('SNK','أحواض',      'Sinks',        3),
  ('APL','أجهزة',      'Appliances',   4)
) AS sub(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='BTH')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES
  ('SAN','أدوات صحية',     'Sanitary Ware', 1),
  ('VNT','وحدة مغسلة',    'Vanity',        2),
  ('SHW','دوش',            'Shower',        3),
  ('BTB','حوض استحمام',   'Bathtub',       4),
  ('ACC','إكسسوار',        'Accessories',   5)
) AS sub(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='DOR')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES
  ('WOD','خشبي',           'Wood',       1),
  ('MTL','معدني',          'Metal',      2),
  ('GLS','زجاجي',          'Glass',      3),
  ('FIR','مقاوم للحريق',  'Fire Rated', 4)
) AS sub(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='WIN')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES
  ('FRM','مؤطر',       'Framed',   1),
  ('FRL','بدون إطار', 'Frameless',2),
  ('SKY','منور',       'Skylight', 3),
  ('CRN','زاوية',      'Corner',   4)
) AS sub(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='FLR')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES
  ('PRQ','باركيه',  'Parquet',1),
  ('TIL','بلاط',    'Tiles',  2),
  ('MRB','رخام',    'Marble', 3),
  ('CRP','سجاد',    'Carpet', 4),
  ('EXP','إيبوكسي', 'Epoxy',  5)
) AS sub(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='WAL')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('PNT','دهان','Paint',1),('WLP','ورق جدران','Wallpaper',2),('STN','تكسية حجر','Stone Cladding',3),('WDP','تكسية خشب','Wood Panel',4)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='CEL')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('GYP','جبس','Gypsum',1),('ACT','بلاط صوتي','Acoustic Tiles',2),('STR','سقف مشدود','Stretch Ceiling',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='DEC')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('VAS','مزهريات','Vases & Objects',1),('ART','لوحات','Art & Frames',2),('MIR','مرايا','Mirrors',3),('RUG','سجاد','Rugs',4),('CUS','وسائد','Cushions',5)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='OFF')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('DSK','مكاتب','Desks',1),('OCH','كراسي مكتبية','Office Chairs',2),('CAB','أدراج','Filing & Storage',3),('WRK','محطات عمل','Workstations',4)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='OUT')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('FUR','أثاث خارجي','Outdoor Furniture',1),('PVN','تبليط','Paving',2),('FNT','نوافير','Fountains',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='LND')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('PLT','نباتات','Plants',1),('TRE','أشجار','Trees',2),('POT','أصص','Pots & Planters',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='SAN')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('WC','مراحيض','WC & Bidets',1),('BSN','أحواض','Basins',2),('TAP','حنفيات','Taps & Mixers',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='ELC')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('SWT','مفاتيح','Switches & Sockets',1),('PNL','لوحات','Panels',2),('CBL','إدارة الكابلات','Cable Management',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='MCH')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('AHU','وحدات هواء','Air Handling',1),('FCU','فان كويل','Fan Coil Units',2),('GRL','شبكات','Grilles & Diffusers',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='ARC')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('COL','أعمدة','Columns',1),('RLG','درابزين','Railings',2),('STA','درج','Stairs',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='STR')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('BEA','عوارض','Beams',1),('SLB','بلاطات','Slabs',2),('FND','أساسات','Foundation',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;
