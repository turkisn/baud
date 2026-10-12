# Initial launch hardening — local, not released

Base: `3c6cd6310e783d66746b8ff9f3ad7576059c8059` (freshly fetched origin/staging, 12 October 2026).
Branch: `fix/initial-launch-hardening`.
Checkout: `/Users/macbook/Documents/Codex/2026-10-12/task/baud-launch`.
Original `/Users/macbook/Downloads/baud` remains clean and unchanged; no main changes, push, deployment, live schema/account changes, or new supplier portal.

## Changes

- Revoke direct profile insertion/deletion; retain only editable profile columns. Reviewers read their own profile. Role RPC locks the profile table and caller row before authorization, prohibits null/self/unauthorized roles and removal of the last super_admin. Row lock also forces stale repeatable-read callers to abort after concurrent demotion.
- Revoke callable audit claims. Catalog row mutations append trusted audit records in the same transaction. Existing trusted role/verification RPC audit calls remain available internally. Client category mutations no longer issue independent audit requests.
- One guarded product/specification RPC and one frontend request. Invalid specification shape/type rolls back the whole operation. New writes to published products require active matching categories, published suppliers, slug and confirmed rights. Inactive categories no longer block archiving. New products default to downloads disabled; admin editor exposes explicit licence permission.
- Usage timestamps are server assigned; per-identity advisory locking serializes rate counting. Invoker recording returns a preallocated UUID without SELECT/RETURNING, retaining event privacy. Deferred supplier-document/proof buckets deny new uploads/replacements, bounding ordinary-user storage to zero for the deferred workflow. Existing per-file limits remain for admin catalog assets.
- Downloads require licence permission and rights in storage policy; private short-lived signed URLs are still generated per request. Existing already-issued signed URLs remain valid until expiry (five minutes), a release/incident-response consideration.
- Admin product/supplier requests discard stale results, clamp empty final pages after mutations, retry the failed editor resource, protect unsaved editor close/unload and client navigation (including browser Back), disable typing while saving and use returned saved rows instead of overwriting state with another asynchronous refresh. User role mutations reload filtered lists.
- Bundled products appear only under explicit `VITE_DEMO_MODE=true` in staging/development/test. They are labelled fictional and no longer claim verified/rights/in-stock status. Mobile demo disclosure remains visible. Supplier homepage badges reflect actual verification. Curated IFC GLB, attribution and hash-pinning are untouched.
- Detail galleries use the selected thumbnail consistently; detail image failure offers retry. Product-card links preserve catalog filters on return. Home/product/supplier critical requests have retry paths. Guest project copy explicitly states no automatic account import.
- Reset requires fresh recovery intent bound to user and JWT session_id; ordinary sign-in/new session/account switch cannot activate it. Recovery identity is shown and errors do not always falsely claim expiry. Profile outages fail closed with retry; focus refresh observes role downgrade.
- Browser suite now builds then serves Vite preview; CI includes catalog and launch suites. Catalog tests derive totals from fixture records (40 local + 64 synthetic remote), not a hardcoded production count of 100.
- Production configuration validation rejects demo mode, staging Supabase, missing/placeholder public settings and privileged browser keys. `npm run release:check` must pass with the actual production public settings, which were not supplied/verified.

The app now uses React Router’s data router for supported navigation blocking. This adds approximately 19 kB gzip to the entry. Payload gates are explicitly 155 kB entry / 165 kB lazy viewer / 490 kB total (previously 150 / 165 / 480), preserving bounded growth rather than removing checks.

## Test evidence

See `docs/evidence/` and final results below. All HTTP browser fixtures are synthetic. They validate frontend behavior, NOT live Auth delivery or database authorization.

Baseline: lint, 66/66 unit tests, build and bundle budget passed (standalone Node 20.11.0).
Implementation: 71/71 unit tests and lint without warnings passed using bundled Node 24.21.0. **Final compiled-production browser suite: 43/43 passed (see evidence).** Full check (lint, 71 tests, production build, payload budgets) also passed on standalone Node 20.11.0; this does not remove the Node 22/24 release gate.

A browser regression caught recovery cancellation on reload (`SIGNED_IN` is also emitted during session restoration). Fixed by binding to session_id, not only event type. A separate test locator mismatch in Arabic was fixed without altering app behavior.

SQL: `supabase/tests/launch_security.sql` authored, **not executed**. Tests profile role bypasses, self edits, reviewer isolation, audit forgery, atomic product/spec failures, private event recording, backdating/rate limit, deferred storage, licence denial/allow and inactive-category archival. `supabase/tests/concurrent_roles.md` contains the two-session negative test. Neither is evidence of a passing database test.

## Environment and remaining release gates

1. **Database runtime unavailable:** no PostgreSQL, psql or Docker. Supabase CLI v2.118.0 was found in npm cache and used to create `20261012131038_initial_launch_hardening.sql`; no live connection/application. It is separately listed as not applied in `supabase/pending-migrations.json`; historical reconciled manifest/checksums stay unchanged. Provision an approved disposable local Supabase runtime, replay migrations, execute all SQL tests and the concurrency procedure, run advisors and review query plans. Only then seek approval to apply to staging.
2. **Supported build runtime:** bundled Node 24 cannot dlopen Rollup because macOS enforces different Team IDs. No security controls or signatures were changed. Standalone Node 20 builds/tests the app but is below `engines` requirements. Repeat clean install/build/browser tests on standalone Node 22/24 or CI before release.
3. **Dependencies:** initial fresh audit reported 8 findings (6 high, 2 moderate); compatible patch `source-map-js` 1.2.1 → 1.2.2 reduced this to **7 (5 high, 2 moderate)**, in build tooling/transitive dependencies. Do not infer the old audit was current. A Tailwind major upgrade may be necessary; assess independently and rerun visual tests before approving it.
4. **External lifecycle gates:** real email confirmation, reset delivery, refresh/token invalidation, signed-link expiry, storage upload limits and live RLS/API denials require an approved synthetic staging-account campaign. No real credentials/accounts were entered, changed or created here.
5. **Content/config/legal:** audit the actual database catalog (bundled demos isolated does not cleanse staging DB content). Verify rights, supplier status, file/image existence and licence settings; do not manufacture assets/rights. Production backend, domain, SMTP, operator/support contact, terms/privacy and security settings remain owner decisions. Current terms/privacy remain staging-specific.
6. **Authorization:** obtain parent approval before any push; any eventual PR must be draft. No production deploy/merge/live RLS/account/security-setting mutations without explicit approval.

## Rollout and rollback

Apply reviewed backend migration before deploying its frontend: the new frontend expects `admin_save_mvp_product_bundle`. Old admin RPCs remain for compatibility, so frontend rollback does not require reopening profile/audit/storage vulnerabilities. If the SQL transaction fails it rolls back entirely. Do not reverse these controls to restore an insecure surface; use a reviewed forward repair. Pre-existing invalid specification values are tolerated by the NOT VALID check but all new/changed rows are checked; inventory and repair existing values before VALIDATE CONSTRAINT.

## Journey coverage and limits

| Persona | Local coverage | Gate remaining |
|---|---|---|
| Visitor | All public mounted pages, Arabic RTL/mobile, search/paging/retry/filter return, projects/compare, 3D recovery | Actual published data and legal readiness |
| Designer/user | signup validation/confirmation messaging, login error categories, project save/reload/export/conflicts; admin denial | Live confirmation/email and licensed file download lifecycle |
| Supplier classification | All six admin routes denied; no supplier portal added; deferred upload policies | Execute storage negative SQL |
| Reviewer/supervisor | All six admin routes denied intentionally; self-only profile policy | Execute reviewer RLS/API negative SQL |
| Admin | All six admin pages, atomic save request/rejection draft retention, unsaved close, supplier slug, stale search and role downgrade | Execute transactional publication, audit, asset and role SQL |
| Super admin | All six admin routes; same shared editor paths | Execute concurrent demotions and last-super-admin tests |

Mounted routes: `/`, `/blocks`, `/blocks/:slug`, `/suppliers`, `/suppliers/:slug`, `/projects`, `/compare`, `/login`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`, six `/admin/*` pages, `/admin` redirect, catch-all. Unmounted legacy authoring components are not a promised launch workflow.


## Final local evidence

- `docs/evidence/unit-node24.log`: 71 passed, zero failed/skipped.
- `docs/evidence/lint-node24.log`: zero errors/warnings.
- `docs/evidence/browser-production.log`: 43 passed; synthetic HTTP/identities, compiled Vite preview and installed Chrome.
- `docs/evidence/check-node20.log`: full lint/unit/build/budget command on available standalone runtime.
- `docs/evidence/dependency-audit-summary.json`: seven remaining build-tooling findings, release gate.
- `docs/evidence/release-config.log`: expected failure because actual production settings are absent.
- `docs/evidence/arabic-mobile.png`: inspected 390px RTL 3D dialog, visible demo disclosure and controls.

The final suite also checks rejection/retry of malformed administrative API lists. Both the browser test fixtures and the app now distinguish a single profile response from a list response. No known failing local frontend test remains. Database security and concurrency are still **unverified**, not passed.
