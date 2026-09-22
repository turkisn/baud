CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE safe_role TEXT;
BEGIN
  safe_role := CASE WHEN NEW.raw_user_meta_data->>'role' IN ('designer','supplier','manufacturer') THEN NEW.raw_user_meta_data->>'role' ELSE 'user' END;
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, safe_role)
  ON CONFLICT (id) DO UPDATE SET full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name), email = COALESCE(EXCLUDED.email, public.profiles.email);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_profile_role_acl()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.get_my_role() NOT IN ('admin','super_admin') THEN NEW.role := OLD.role; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enforce_profile_role_acl ON public.profiles;
CREATE TRIGGER enforce_profile_role_acl BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_role_acl();

CREATE OR REPLACE FUNCTION public.enforce_product_column_acl()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.get_my_role() IN ('admin','super_admin','reviewer') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'draft'; NEW.visibility := 'private'; NEW.verification_status := 'unverified'; NEW.approved_by := NULL; NEW.approved_at := NULL; NEW.admin_notes := NULL; NEW.rejection_reason := NULL; NEW.buod_reference := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.approved_by := OLD.approved_by; NEW.approved_at := OLD.approved_at; NEW.verification_status := OLD.verification_status; NEW.visibility := OLD.visibility; NEW.admin_notes := OLD.admin_notes; NEW.rejection_reason := OLD.rejection_reason;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enforce_product_column_acl ON public.products;
CREATE TRIGGER enforce_product_column_acl BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.enforce_product_column_acl();

DO $$ DECLARE r RECORD; BEGIN
  ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
  FOR r IN SELECT tc.constraint_name FROM information_schema.table_constraints tc JOIN information_schema.check_constraints cc ON tc.constraint_name=cc.constraint_name AND tc.constraint_schema=cc.constraint_schema WHERE tc.table_schema='public' AND tc.table_name='products' AND tc.constraint_type='CHECK' AND cc.check_clause LIKE '%pending_review%' LOOP
    EXECUTE format('ALTER TABLE public.products DROP CONSTRAINT IF EXISTS %I', r.constraint_name);
  END LOOP;
  ALTER TABLE public.products ADD CONSTRAINT products_status_check CHECK (status IN ('draft','pending_review','approved','rejected','revision_required','archived'));
END $$;

DROP POLICY IF EXISTS "products_owner_update" ON public.products;
CREATE POLICY "products_owner_update" ON public.products FOR UPDATE USING (created_by = auth.uid() AND status IN ('draft','rejected','revision_required')) WITH CHECK (created_by = auth.uid() AND status IN ('draft','pending_review','rejected','revision_required'));

CREATE OR REPLACE FUNCTION public.increment_view_count(product_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products SET view_count = COALESCE(view_count,0)+1 WHERE id=product_id AND status='approved' AND visibility='public';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_view_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE caller_role TEXT; target_role TEXT;
BEGIN
  IF new_role NOT IN ('user','designer','supplier','manufacturer','reviewer','admin','super_admin') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  IF auth.uid() IS NULL THEN UPDATE public.profiles SET role=new_role WHERE id=target_user_id; RETURN; END IF;
  IF target_user_id = auth.uid() THEN RAISE EXCEPTION 'Cannot change own role'; END IF;
  caller_role := public.get_my_role();
  IF caller_role NOT IN ('admin','super_admin') THEN RAISE EXCEPTION 'Permission denied'; END IF;
  SELECT role INTO target_role FROM public.profiles WHERE id=target_user_id;
  IF caller_role='admin' AND (new_role IN ('admin','super_admin') OR target_role IN ('admin','super_admin')) THEN RAISE EXCEPTION 'Only super_admin may manage admin roles'; END IF;
  UPDATE public.profiles SET role=new_role WHERE id=target_user_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(UUID,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.generate_buod_reference(p_category_code TEXT,p_subcategory_code TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_next_num BIGINT; BEGIN
  INSERT INTO public.buod_reference_counters(category_code,subcategory_code,last_number) VALUES(p_category_code,p_subcategory_code,1)
  ON CONFLICT(category_code,subcategory_code) DO UPDATE SET last_number=buod_reference_counters.last_number+1 RETURNING last_number INTO v_next_num;
  RETURN format('BUOD-%s-%s-%s',upper(p_category_code),upper(p_subcategory_code),lpad(v_next_num::TEXT,6,'0'));
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_set_buod_reference()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cat_code TEXT; v_sub_code TEXT; BEGIN
  IF NEW.buod_reference IS NULL AND NEW.status='pending_review' AND (TG_OP='INSERT' OR OLD.status='draft' OR OLD.status='rejected' OR OLD.status='revision_required') THEN
    SELECT code INTO v_cat_code FROM public.categories WHERE id=NEW.category_id;
    SELECT code INTO v_sub_code FROM public.subcategories WHERE id=NEW.subcategory_id;
    NEW.buod_reference := public.generate_buod_reference(COALESCE(v_cat_code,'GEN'),COALESCE(v_sub_code,'GEN'));
  END IF;
  RETURN NEW;
END;
$$;
