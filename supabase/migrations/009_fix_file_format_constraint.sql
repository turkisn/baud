-- ============================================================
-- BUAD Platform — Migration 009: Fix product_files.file_format CHECK constraint
-- Run AFTER migrations 001–008.
-- ============================================================
--
-- PROBLEM:
--   Migration 001 defines file_format CHECK as:
--     ('RFA','RVT','MAX','FBX','OBJ','SKP','DWG','IFC','PDF','ZIP','OTHER')
--   '3DS' is missing. Uploading a .3ds file produces format='3DS', which
--   violates the constraint and causes the product_files INSERT to fail.
--
-- FIX:
--   Drop the existing constraint (whatever its auto-generated name) and
--   recreate it with '3DS' added.
--
-- The frontend maps unknown extensions to 'OTHER' as a belt-and-braces
-- fallback (see productService.js VALID_FILE_FORMATS), so this migration
-- is defense-in-depth — uploads don't break while it is pending.
-- ============================================================

DO $$ DECLARE
  v_constraint_name TEXT;
BEGIN
  -- Find the existing file_format CHECK constraint by matching its clause.
  -- 'SKP' is a reliable discriminator: it appears only in the file_format
  -- CHECK and nowhere else in product_files constraints.
  SELECT tc.constraint_name INTO v_constraint_name
  FROM information_schema.table_constraints  tc
  JOIN information_schema.check_constraints  cc
    ON  tc.constraint_name   = cc.constraint_name
    AND tc.constraint_schema = cc.constraint_schema
  WHERE tc.table_schema    = 'public'
    AND tc.table_name      = 'product_files'
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause    LIKE '%SKP%'
  LIMIT 1;

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.product_files DROP CONSTRAINT %I', v_constraint_name);
  END IF;

  ALTER TABLE public.product_files
    ADD CONSTRAINT product_files_file_format_check
    CHECK (file_format IN (
      'RFA','RVT','MAX','FBX','OBJ','SKP','DWG','IFC','PDF','ZIP','3DS','OTHER'
    ));
END $$;
