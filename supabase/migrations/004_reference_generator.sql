-- ============================================================
-- BUAD Platform — Migration 004: BUOD Reference Generator
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ── Atomic reference generator ───────────────────────────────
-- Uses advisory lock + counter table to guarantee uniqueness
-- even under concurrent inserts.

CREATE OR REPLACE FUNCTION public.generate_buod_reference(
  p_category_code    TEXT,
  p_subcategory_code TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_num BIGINT;
BEGIN
  -- Upsert counter atomically (row-level lock prevents duplicates)
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

-- ── Trigger function ─────────────────────────────────────────
-- Fires on INSERT or UPDATE when status becomes 'pending_review'
-- and buod_reference is still NULL.

CREATE OR REPLACE FUNCTION public.auto_set_buod_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_cat_code TEXT;
  v_sub_code TEXT;
BEGIN
  -- Only generate once, when first submitted for review
  IF NEW.buod_reference IS NULL
     AND NEW.status = 'pending_review'
     AND (TG_OP = 'INSERT' OR OLD.status = 'draft' OR OLD.status = 'rejected')
  THEN
    -- Fetch category and subcategory codes
    SELECT code INTO v_cat_code
      FROM public.categories
     WHERE id = NEW.category_id;

    SELECT code INTO v_sub_code
      FROM public.subcategories
     WHERE id = NEW.subcategory_id;

    -- Fallback codes if category/subcategory missing
    v_cat_code := COALESCE(v_cat_code, 'GEN');
    v_sub_code := COALESCE(v_sub_code, 'GEN');

    NEW.buod_reference := public.generate_buod_reference(v_cat_code, v_sub_code);
  END IF;

  RETURN NEW;
END;
$$;

-- Drop and recreate trigger to avoid conflicts on re-run
DROP TRIGGER IF EXISTS trg_auto_buod_reference ON public.products;

CREATE TRIGGER trg_auto_buod_reference
  BEFORE INSERT OR UPDATE OF status ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_buod_reference();

-- ── Unique constraint on buod_reference ──────────────────────
-- Already added in schema (UNIQUE column), this adds explicit index
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_buod_ref_unique
  ON public.products(buod_reference)
  WHERE buod_reference IS NOT NULL;

-- ── Helper: get product by BUOD reference ────────────────────
CREATE OR REPLACE FUNCTION public.get_product_by_reference(p_ref TEXT)
RETURNS SETOF public.products
LANGUAGE sql STABLE AS $$
  SELECT * FROM public.products WHERE buod_reference = upper(p_ref) LIMIT 1;
$$;
