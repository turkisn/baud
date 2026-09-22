CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

DO $$
DECLARE v_constraint TEXT; r RECORD;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name=cc.constraint_name AND tc.constraint_schema=cc.constraint_schema
    WHERE tc.table_schema='public' AND tc.table_name='products' AND tc.constraint_type='CHECK' AND cc.check_clause LIKE '%revision_required%'
  ) INTO v_constraint;
  IF NOT v_constraint::BOOLEAN THEN
    ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
    FOR r IN
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc
        ON tc.constraint_name=cc.constraint_name AND tc.constraint_schema=cc.constraint_schema
      WHERE tc.table_schema='public' AND tc.table_name='products' AND tc.constraint_type='CHECK' AND cc.check_clause LIKE '%pending_review%'
    LOOP
      EXECUTE format('ALTER TABLE public.products DROP CONSTRAINT %I', r.constraint_name);
    END LOOP;
    ALTER TABLE public.products ADD CONSTRAINT products_status_check CHECK (status IN ('draft','pending_review','approved','rejected','revision_required','archived'));
  END IF;
END $$;

DO $$ DECLARE v_name TEXT; BEGIN
  SELECT tc.constraint_name INTO v_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.check_constraints cc
    ON tc.constraint_name=cc.constraint_name AND tc.constraint_schema=cc.constraint_schema
  WHERE tc.table_schema='public' AND tc.table_name='product_files' AND tc.constraint_type='CHECK' AND cc.check_clause LIKE '%SKP%'
  LIMIT 1;
  IF v_name IS NOT NULL THEN EXECUTE format('ALTER TABLE public.product_files DROP CONSTRAINT %I',v_name); END IF;
  ALTER TABLE public.product_files ADD CONSTRAINT product_files_file_format_check CHECK (file_format IN ('RFA','RVT','MAX','FBX','OBJ','SKP','DWG','IFC','PDF','ZIP','3DS','OTHER'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP POLICY IF EXISTS "products_owner_update" ON public.products;
CREATE POLICY "products_owner_update" ON public.products
FOR UPDATE
USING (created_by = auth.uid() AND status IN ('draft','rejected','revision_required'))
WITH CHECK (created_by = auth.uid() AND status IN ('draft','rejected','revision_required'));

DROP POLICY IF EXISTS "cats_public_read" ON public.categories;
DROP POLICY IF EXISTS "subcats_public_read" ON public.subcategories;
CREATE POLICY "cats_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "subcats_public_read" ON public.subcategories FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.generate_buod_reference(p_category_code TEXT,p_subcategory_code TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_next_num BIGINT; BEGIN
  INSERT INTO public.buod_reference_counters(category_code,subcategory_code,last_number)
  VALUES(p_category_code,p_subcategory_code,1)
  ON CONFLICT(category_code,subcategory_code)
  DO UPDATE SET last_number=buod_reference_counters.last_number+1
  RETURNING last_number INTO v_next_num;
  RETURN format('BUOD-%s-%s-%s',upper(p_category_code),upper(p_subcategory_code),lpad(v_next_num::TEXT,6,'0'));
END; $$;

CREATE OR REPLACE FUNCTION public.auto_set_buod_reference()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cat_code TEXT; v_sub_code TEXT; BEGIN
  IF NEW.buod_reference IS NULL AND NEW.status='pending_review' AND (TG_OP='INSERT' OR OLD.status='draft' OR OLD.status='rejected' OR OLD.status='revision_required') THEN
    SELECT code INTO v_cat_code FROM public.categories WHERE id=NEW.category_id;
    SELECT code INTO v_sub_code FROM public.subcategories WHERE id=NEW.subcategory_id;
    NEW.buod_reference := public.generate_buod_reference(COALESCE(v_cat_code,'GEN'),COALESCE(v_sub_code,'GEN'));
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_auto_buod_reference ON public.products;
DROP TRIGGER IF EXISTS trg_02_auto_buod_reference ON public.products;
CREATE TRIGGER trg_02_auto_buod_reference
BEFORE INSERT OR UPDATE OF status ON public.products
FOR EACH ROW EXECUTE FUNCTION public.auto_set_buod_reference();

CREATE OR REPLACE FUNCTION public.enforce_product_column_acl()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.get_my_role() IN ('admin','super_admin','reviewer') THEN RETURN NEW; END IF;
  IF TG_OP='INSERT' THEN
    NEW.status:='draft';
    NEW.visibility:='private';
    NEW.verification_status:='unverified';
    NEW.approved_by:=NULL;
    NEW.approved_at:=NULL;
    NEW.admin_notes:=NULL;
    NEW.rejection_reason:=NULL;
    NEW.buod_reference:=NULL;
  ELSIF TG_OP='UPDATE' THEN
    NEW.approved_by:=OLD.approved_by;
    NEW.approved_at:=OLD.approved_at;
    NEW.verification_status:=OLD.verification_status;
    NEW.visibility:=OLD.visibility;
    NEW.admin_notes:=OLD.admin_notes;
    NEW.rejection_reason:=OLD.rejection_reason;
    NEW.buod_reference:=OLD.buod_reference;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS enforce_product_column_acl ON public.products;
DROP TRIGGER IF EXISTS trg_01_enforce_product_column_acl ON public.products;
CREATE TRIGGER trg_01_enforce_product_column_acl
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.enforce_product_column_acl();

CREATE OR REPLACE FUNCTION public.submit_product_for_review(p_product_id UUID)
RETURNS TABLE (id UUID,status TEXT,buod_reference TEXT,category_id UUID)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_product public.products;
BEGIN
  SELECT * INTO v_product FROM public.products WHERE public.products.id=p_product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND'; END IF;
  IF v_product.created_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'NOT_OWNER'; END IF;
  IF v_product.status NOT IN ('draft','rejected','revision_required') THEN RAISE EXCEPTION 'INVALID_STATE:%',v_product.status; END IF;
  IF v_product.category_id IS NULL THEN RAISE EXCEPTION 'CATEGORY_REQUIRED'; END IF;
  UPDATE public.products SET status='pending_review' WHERE public.products.id=p_product_id;
  RETURN QUERY SELECT p.id,p.status::TEXT,p.buod_reference,p.category_id FROM public.products p WHERE p.id=p_product_id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.submit_product_for_review(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_product_for_review(UUID) TO authenticated;
