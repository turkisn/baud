-- ============================================================
-- BUAD Platform — Migration 003: Storage Bucket Policies
-- Run in Supabase Dashboard → Storage → Policies
-- Or run in SQL Editor (requires storage extension)
-- ============================================================

-- ── Create Buckets ────────────────────────────────────────────
-- Run these in Supabase Dashboard → Storage → New Bucket
-- OR via SQL:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true,  20971520,  -- 20 MB
   ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('product-files',  'product-files',  false, 104857600, -- 100 MB
   ARRAY['application/octet-stream','application/zip','application/pdf',
         'model/vnd.3mf','application/x-fbx']),
  ('supplier-documents', 'supplier-documents', false, 20971520,
   ARRAY['application/pdf','image/jpeg','image/png']),
  ('ownership-proofs', 'ownership-proofs', false, 20971520,
   ARRAY['application/pdf','image/jpeg','image/png'])
ON CONFLICT (id) DO NOTHING;

-- ── product-images policies (public bucket) ───────────────────
DROP POLICY IF EXISTS "images_public_view"    ON storage.objects;
DROP POLICY IF EXISTS "images_owner_upload"   ON storage.objects;
DROP POLICY IF EXISTS "images_owner_delete"   ON storage.objects;
DROP POLICY IF EXISTS "images_admin_all"      ON storage.objects;

CREATE POLICY "images_public_view" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "images_owner_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "images_owner_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- ── product-files policies (private bucket, signed URLs) ─────
DROP POLICY IF EXISTS "files_owner_upload"   ON storage.objects;
DROP POLICY IF EXISTS "files_owner_read"     ON storage.objects;
DROP POLICY IF EXISTS "files_owner_delete"   ON storage.objects;
DROP POLICY IF EXISTS "files_admin_all"      ON storage.objects;

CREATE POLICY "files_owner_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-files'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Owner can read own files
CREATE POLICY "files_owner_read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'product-files'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','super_admin','reviewer')
    )
  );

CREATE POLICY "files_owner_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'product-files'
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','super_admin')
    )
  );

-- ── supplier-documents & ownership-proofs ────────────────────
CREATE POLICY "docs_owner_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id IN ('supplier-documents','ownership-proofs')
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "docs_owner_read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id IN ('supplier-documents','ownership-proofs')
    AND (
      (storage.foldername(name))[1] = auth.uid()::TEXT
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','super_admin')
    )
  );
