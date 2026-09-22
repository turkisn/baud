DROP POLICY IF EXISTS "products_owner_update" ON public.products;
CREATE POLICY "products_owner_update" ON public.products
FOR UPDATE
USING (created_by = auth.uid() AND status IN ('draft','rejected','revision_required'))
WITH CHECK (created_by = auth.uid() AND status IN ('draft','pending_review','rejected','revision_required'));

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
CREATE TRIGGER trg_auto_buod_reference BEFORE INSERT OR UPDATE OF status ON public.products FOR EACH ROW EXECUTE FUNCTION public.auto_set_buod_reference();

DROP POLICY IF EXISTS "cats_public_read" ON public.categories;
CREATE POLICY "cats_public_read" ON public.categories FOR SELECT USING (true);
