DO $$ DECLARE
  v_constraint_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO v_constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
   AND tc.constraint_schema = cc.constraint_schema
  WHERE tc.table_schema='public'
    AND tc.table_name='product_files'
    AND tc.constraint_type='CHECK'
    AND cc.check_clause LIKE '%SKP%'
  LIMIT 1;
  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.product_files DROP CONSTRAINT %I', v_constraint_name);
  END IF;
  ALTER TABLE public.product_files
    ADD CONSTRAINT product_files_file_format_check
    CHECK (file_format IN ('RFA','RVT','MAX','FBX','OBJ','SKP','DWG','IFC','PDF','ZIP','3DS','OTHER'));
END $$;
