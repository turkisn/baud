# Staging migration history

The remote **staging** database is the source of truth for the current BUOD MVP backend contract.

- Reconciled through **12 October 2026** from `supabase_migrations.schema_migrations` in project `BUOD Staging`.
- All **57** remote migrations, from `20260816022848_001_initial_schema` through `20261012165202_close_backend_security_contract`, are present locally with their exact remote version and name.
- Every local SQL file was checksum-compared with the recorded remote statement. The only permitted byte difference is a normalized final newline; there are no SQL-content mismatches.
- The legacy untimestamped `001`–`012` filenames were replaced with their original remote timestamps so Supabase tooling sees the same history on both sides.

These historical migrations are already applied to staging and must not be re-applied there manually. Future schema changes must be created as new timestamped migrations and verified with Supabase advisors before deployment. Never use a destructive reset to repair migration history.

On **27 September 2026**, migration `20260927033045_paginated_catalog_search` was applied to staging and added to the manifest (53 migrations total). It adds a bounded, SECURITY INVOKER catalog endpoint with database-side search, facets, stable pagination, counts, and public file metadata. Tests as `anon` confirmed zero page overlap and zero unpublished records. The existing API remains available to older deployments.

On **28 September 2026 (Riyadh)**, `20260927220821_private_cloud_workspaces` and `20260927222233_workspace_rls_initplans` were applied (55 migrations total). They add per-user workspace storage, owner-only RLS, bounded payloads, guarded revision increments and an idempotent SECURITY INVOKER save RPC. The follow-up expresses JWT checks as directly recognizable scalar initialization plans. Real role-isolation tests in `supabase/tests/workspace_security.sql` passed and rolled back all fixtures. Performance advisors report only pre-existing unused-index information; security advisors retain the six existing guarded administrative functions and disabled leaked-password protection warning.

On **12 October 2026**, `20261012165202_close_backend_security_contract` was applied (57 migrations total). It moves all six elevated administrative implementations into the private schema, leaves narrow SECURITY INVOKER façades in the public API, and applies deny-by-default privileges to future tables, sequences, and functions. `supabase/tests/admin_security.sql` and `supabase/tests/backend_contract.sql` both pass against staging. Supabase security advisors now report no database-structure warnings; the remaining leaked-password warning is an Auth plan capability, not a schema defect.

## Pending reconciliation (not applied)

`20261012174342_reconcile_initial_launch_security` preserves all 57 applied files and supersedes the never-applied `20261012131038` launch migration. It corrects the global PUBLIC function EXECUTE default (schema-level revokes alone do not remove it), makes audit logging internal-only, and retains public invoker wrappers around hardened private operations. The original default-privilege closure statement above is incomplete until this pending migration is approved and applied. See `docs/STAGING_RELEASE_HANDOFF.md` for evidence and live release gates.
