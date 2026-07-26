-- ============================================================
-- BUAD Platform — Migration 012: Fix View and Download Counters
-- Run AFTER migrations 001–011.
-- Fully idempotent — safe to run multiple times.
--
-- ROOT CAUSES ADDRESSED
-- ─────────────────────
-- A. increment_view_count (migration 006) was never deployed to production,
--    so every RPC call fails silently (both call sites swallow errors with
--    .catch(() => {})). View counts stay at 0 permanently.
--    Fix → CREATE OR REPLACE with correct SECURITY DEFINER + grants (below).
--
-- B. increment_download_count has never been implemented anywhere:
--    no SQL function, no productService method, no frontend call.
--    Fix → new SECURITY DEFINER RPC + productService.incrementDownloadCount()
--    + LibraryDetail.jsx handleDownloadFile post-download hook.
--
-- SECURITY MODEL
-- ──────────────
-- Both functions are SECURITY DEFINER (run as postgres superuser), which:
--   • Bypasses RLS — the products_public_read policy only grants SELECT;
--     direct UPDATE by anon/authenticated on view_count/download_count
--     would be blocked by the lack of an UPDATE policy for those roles.
--   • Bypasses the enforce_product_column_acl trigger's column-lock:
--     that trigger does NOT reset view_count or download_count in its
--     UPDATE branch, so the increment passes through correctly.
--
-- The WHERE clause (status='approved' AND visibility='public') ensures
-- counters are only modified for rows that are publicly visible.
-- Bots/attackers calling the RPC with a random UUID will hit 0 rows.
--
-- GRANTS
-- ──────
-- anon: intentional — unauthenticated page views and downloads should
--   count. The library is publicly accessible without login.
-- authenticated: supplier/admin users viewing/downloading count too.
-- PUBLIC: explicitly revoked (PostgreSQL grants EXECUTE to PUBLIC by default).
-- ============================================================


-- ─────────────────────────────────────────────────────────────────
-- 1. increment_view_count — re-create idempotently
--    (migration 006 section 6 defines this; re-applying here ensures
--     the function exists even if 006 was not run in production)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_view_count(product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET    view_count = COALESCE(view_count, 0) + 1
  WHERE  id         = product_id
    AND  status     = 'approved'
    AND  visibility = 'public';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_view_count(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.increment_view_count(UUID) TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────────
-- 2. increment_download_count — new function
--    Mirrors increment_view_count: SECURITY DEFINER, approved+public
--    guard, same grant pattern.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_download_count(product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET    download_count = COALESCE(download_count, 0) + 1
  WHERE  id             = product_id
    AND  status         = 'approved'
    AND  visibility     = 'public';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_download_count(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.increment_download_count(UUID) TO anon, authenticated;
