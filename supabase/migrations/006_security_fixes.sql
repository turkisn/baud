-- Migration 006: Security fixes and missing features
-- Run this in Supabase SQL Editor AFTER the previous 5 migrations.
-- Safe to run multiple times (uses IF EXISTS / OR REPLACE).

-- ─────────────────────────────────────────────────────────────────
-- 1. Fix handle_new_user: write role from sign-up metadata
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE
    SET
      full_name = EXCLUDED.full_name,
      email     = EXCLUDED.email,
      role      = COALESCE(EXCLUDED.role, public.profiles.role, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────
-- 2. Add 'revision_required' to products.status CHECK constraint
-- ─────────────────────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
     AND tc.constraint_schema = cc.constraint_schema
    WHERE tc.table_schema  = 'public'
      AND tc.table_name    = 'products'
      AND tc.constraint_type = 'CHECK'
      AND cc.check_clause LIKE '%archived%'
      AND cc.check_clause NOT LIKE '%revision_required%'
  LOOP
    EXECUTE format('ALTER TABLE public.products DROP CONSTRAINT %I', r.constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.products
  ADD CONSTRAINT IF NOT EXISTS products_status_check
  CHECK (status IN ('draft','pending_review','approved','rejected','revision_required','archived'));

-- ─────────────────────────────────────────────────────────────────
-- 3. Fix products_owner_update RLS: add WITH CHECK to block
--    self-escalation to 'approved'. Also allow 'revision_required'
--    so supplier can resubmit after revision.
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "products_owner_update" ON public.products;

CREATE POLICY "products_owner_update" ON public.products
  FOR UPDATE
  USING (created_by = auth.uid() AND status IN ('draft','rejected','revision_required'))
  WITH CHECK (
    created_by = auth.uid()
    AND status IN ('draft','pending_review','rejected','revision_required')
  );

-- ─────────────────────────────────────────────────────────────────
-- 4. Add increment_view_count RPC (called from productService.js)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_view_count(product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = product_id
    AND status     = 'approved'
    AND visibility = 'public';
END;
$$;

-- Grant execute to anonymous and authenticated so the frontend can call it
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO anon, authenticated;
