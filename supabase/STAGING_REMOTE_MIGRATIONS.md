# Staging migration history

The remote **staging** database is the source of truth for the current BUOD MVP backend contract.

- Reconciled on **22 September 2026** from `supabase_migrations.schema_migrations` in project `BUOD Staging`.
- All **52** remote migrations, from `20260816022848_001_initial_schema` through `20260915172206_consolidate_and_optimize_storage_rls`, are present locally with their exact remote version, name, and recorded SQL.
- Every local SQL file was checksum-compared with the recorded remote statement. The only permitted byte difference is a normalized final newline; there are no SQL-content mismatches.
- The legacy untimestamped `001`–`012` filenames were replaced with their original remote timestamps so Supabase tooling sees the same history on both sides.

These historical migrations are already applied to staging and must not be re-applied there manually. Future schema changes must be created as new timestamped migrations and verified with Supabase advisors before deployment. Never use a destructive reset to repair migration history.

On **27 September 2026**, migration `20260927033045_paginated_catalog_search` was applied to staging and added to the manifest (53 migrations total). It adds a bounded, SECURITY INVOKER catalog endpoint with database-side search, facets, stable pagination, counts, and public file metadata. Tests as `anon` confirmed zero page overlap and zero unpublished records. The existing API remains available to older deployments.

On **28 September 2026 (Riyadh)**, `20260927220821_private_cloud_workspaces` and `20260927222233_workspace_rls_initplans` were applied (55 migrations total). They add per-user workspace storage, owner-only RLS, bounded payloads, guarded revision increments and an idempotent SECURITY INVOKER save RPC. The follow-up expresses JWT checks as directly recognizable scalar initialization plans. Real role-isolation tests in `supabase/tests/workspace_security.sql` passed and rolled back all fixtures. Performance advisors report only pre-existing unused-index information; security advisors retain the six existing guarded administrative functions and disabled leaked-password protection warning.
