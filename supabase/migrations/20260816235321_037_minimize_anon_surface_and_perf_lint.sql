-- Tighten anonymous table grants without changing public read contracts.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r','p','v','m','f')
  LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON TABLE %I.%I FROM anon', r.nspname, r.relname);
    IF r.relkind IN ('r','p') THEN
      EXECUTE format('REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE %I.%I FROM anon', r.nspname, r.relname);
    END IF;
  END LOOP;
END $$;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM anon;

-- Preserve the same RLS semantics while avoiding repeated auth.uid() initialization per row.
DROP POLICY IF EXISTS usage_events_insert_own ON public.usage_events;
CREATE POLICY usage_events_insert_own
ON public.usage_events
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Remove exact duplicate indexes only; keep one equivalent index for each access path.
DROP INDEX IF EXISTS public.products_slug_unique_idx;
DROP INDEX IF EXISTS public.suppliers_slug_unique_idx;
DROP INDEX IF EXISTS public.usage_events_user_created_idx;
