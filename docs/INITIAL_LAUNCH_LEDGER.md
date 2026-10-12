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
Initial implementation passed 71/71 unit tests and 43/43 compiled browser tests. Follow-up review found an already-installed standalone Node **24.19.0** at `/Users/macbook/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`. Clean `npm ci --ignore-scripts --no-audit`, lint, 71/71 unit tests, production build and payload budgets pass on this supported runtime. The final expanded browser suite passed **55/55**; every browser backend response is synthetic.

A browser regression caught recovery cancellation on reload (`SIGNED_IN` is also emitted during session restoration). Fixed by binding to session_id, not only event type. A separate test locator mismatch in Arabic was fixed without altering app behavior.

SQL: `npm run test:database` now executes all **57 migrations unchanged** and all **3 SQL suites** on in-memory PostgreSQL 18.6 via official test-only `@electric-sql/pglite@0.5.9`. Auth/Storage platform tables and JWT claims are synthetic scaffolding documented in `platform_fixture.sql`; application policies, grants, triggers and functions run as real PostgreSQL SQL. Tests prove profile role-write denial and safe signup/self-edit, reviewer profile/RPC isolation, trusted audits, atomic rollback even after product update/spec deletion, private event recording, server timestamps/rate limiting, deferred storage denial, licence allow/deny, archival, workspace ownership and stale-revision conflicts. This is **not** a test of live Supabase, GoTrue, Storage HTTP, or concurrent sessions.

Independent review additionally fixed missing explicit RLS on the deferred `project_product_instances` table in a fresh migration replay (historical policy depended on dashboard setup), in-flight asset upload versus editor save/close, missing-profile recovery, licence-aware download controls and file retry. Reset PUT requests use the explicitly verified recovery token; a tab/account switch cannot retarget the write. SDK logout errors now accurately report cleared local credentials with unconfirmed remote revocation. The current SDK clears its local session on 503 as well as on successful logout; restoring credentials would be unsafe.

## Environment and remaining release gates

1. **Native database/concurrency gate resolved locally:** user approved the exact official Postgres.app download/run. Postgres.app 2.9.6 / PostgreSQL 18.6 passed official SHA-256 comparison, disk-image verification, strict code-signature checks on the read-only original, and Gatekeeper (`Notarized Developer ID`). A copied bundle gained FinderInfo metadata, so it was not executed; the verified read-only original was used without changing attributes/security settings. `npm run test:database:native` passed 57 migrations, all 3 SQL suites and **5 real two-session scenarios**: both cross-demotion directions under READ COMMITTED and REPEATABLE READ, plus serialized audit old/new transitions. READ COMMITTED losers receive Permission denied; REPEATABLE READ losers receive SQLSTATE 40001; one super-admin survives. The image was ejected after testing and the unused copied bundle removed; only the official DMG is retained in the task workspace. The harness accepts no database URL, creates a fresh cluster, binds only loopback, rejects TCP authentication, uses owner-only Unix sockets, stops PostgreSQL and deletes the cluster. Actual Supabase Auth/Storage services and deployed PostgreSQL-version parity remain external gates.
2. **Supported runtime gate resolved:** standalone Node 24.19.0 loads native Rollup and completes clean install/build/tests. No Node installation, signature change or macOS security bypass was needed. The separate ChatGPT app-bundled Node has library-validation restrictions and is not used for these final builds.
3. **Dependency gate reduced but not cleared:** initial audit 8 → prior patch 7 → current **5 high, zero moderate**, all the same unpatched `braces` issue propagated through `chokidar`, `micromatch`, `fast-glob`, and Tailwind 3. The official selector parser 7.1.6 override fixes GHSA-rj75-hqrm-r3gf; clean build produced byte-identical CSS (SHA-256 `07965be878fade689ee4565ab433ff05b56c9fe5930e2a071a53301ed8f43b52`). Its upstream major change makes insertion during iteration safe; project compilation and browser tests validate this integration. No patched `braces` or Tailwind 3 release was available in npm metadata. npm recommends Tailwind 4.3.3, a framework migration raising minimum browsers to Safari 16.4 / Chrome 111 / Firefox 128 per [official upgrade guidance](https://tailwindcss.com/docs/upgrade-guide). Preserve the failing audit gate; decide browser support and complete visual migration before release, or wait for an official compatible fix. Do not misrepresent this as an all-clear audit.
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
| Supplier classification | All six admin routes denied; no supplier portal added; deferred upload policies | Embedded storage RLS passed; actual Storage HTTP remains gated |
| Reviewer/supervisor | All six admin routes denied intentionally; self-only profile policy | Embedded reviewer RLS/RPC denial passed; live API remains gated |
| Admin | All six admin pages, atomic save request/rejection draft retention, unsaved close, supplier slug, stale search and role downgrade | Embedded and native transaction/audit/role SQL passed; real service gate remains |
| Super admin | All six admin routes; same shared editor paths | Native concurrent demotions and guarded-role tests passed; live service gate remains |

Mounted routes: `/`, `/blocks`, `/blocks/:slug`, `/suppliers`, `/suppliers/:slug`, `/projects`, `/compare`, `/login`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`, six `/admin/*` pages, `/admin` redirect, catch-all. Unmounted legacy authoring components are not a promised launch workflow.


## Final local evidence

- `docs/evidence/unit-node24.log`: 71 passed, zero failed/skipped.
- `docs/evidence/lint-node24.log`: zero errors/warnings.
- `docs/evidence/browser-production.log`: **55 passed (1.7m)** on standalone Node 24.19.0; synthetic HTTP/identities, compiled Vite preview and installed Chrome.
- `docs/evidence/check-node24.log`: full lint/71-unit/build/budget pass on supported standalone Node 24.19.0. Earlier Node 20 log retained as historical evidence.
- `docs/evidence/database-embedded.log`: 57 migration replays and 3 SQL suites passed on PGlite PostgreSQL 18.6.
- `docs/evidence/database-native.log`: 57 migration replays, 3 SQL suites, 5 real two-session scenarios; explicit shutdown and disposable-cluster cleanup.
- `docs/evidence/postgres-runtime-integrity.json`: official digest, signature and Gatekeeper results; no security bypass.
- `docs/evidence/dependency-audit-summary.json`: five remaining high build-tooling findings, release gate.
- `docs/evidence/release-config.log`: expected failure because actual production settings are absent.
- `docs/evidence/arabic-mobile.png`: inspected 390px RTL 3D dialog, visible demo disclosure and controls; CSS transitions disabled for stable capture. Focused acceptance rerun: 1/1 passed (`mobile-evidence.log`).

The expanded suite also checks signup classification for designers/supplier/manufacturer representatives, admin/super-admin role-change denial, download signing retry/300-second TTL, and rejection/retry of malformed administrative API lists. Both the browser test fixtures and the app now distinguish a single profile response from a list response. No known failing local frontend test remains. Embedded database security tests now pass. Native multi-session concurrency now passes. Live Supabase service behavior remains **unverified**, not passed.


## Exact dependency findings and replacement assessment

Checked 12 October 2026. These are **five npm affected-package entries, one underlying advisory**, not five separate CVEs. [GitHub-reviewed GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists `braces <=3.0.3`, patched versions **None**. Raw npm JSON and the installed dependency tree are preserved in evidence.

| Affected installed package | Dependency path from this project | npm fixAvailable |
|---|---|---|
| braces 3.0.3 | tailwindcss → chokidar → braces; tailwindcss → micromatch → braces; tailwindcss → fast-glob → micromatch → braces | tailwindcss 4.3.3, semver-major |
| chokidar 3.6.0 | tailwindcss → chokidar | tailwindcss 4.3.3, semver-major |
| fast-glob 3.3.3 | tailwindcss → fast-glob → micromatch | `true` (no concrete package/version in this entry) |
| micromatch 4.0.8 | tailwindcss → micromatch; tailwindcss → fast-glob → micromatch | tailwindcss 4.3.3, semver-major |
| tailwindcss 3.4.19 | direct development dependency | tailwindcss 4.3.3, semver-major |

Ordinary `npm audit fix --dry-run --ignore-scripts` changes zero versions and retains all five findings; its proposed 49 additions are absent optional packages, not advisory fixes. Do not infer a compatible fix from the boolean `fast-glob.fixAvailable` alone. Production-only audit is zero, but full CI audit intentionally remains failing.

Replacing Tailwind 3 with the official Tailwind 4 Vite/PostCSS plugin is practical as a planned CSS migration, not a drop-in patch. This repository has 1,895 stylesheet lines, 23 `@apply` sites, regex safelists, custom layers/global rules and utility usage across 60 JSX files. The [official upgrade guide](https://tailwindcss.com/docs/upgrade-guide) requires updated plugin/directives and documents changed safelisting, utility defaults, cascade and browser requirements. Acceptance requires deciding minimum browsers and comparing all mounted pages, admin modals, RTL/mobile, focus and reduced-motion states. Replacing only chokidar with a major version breaks its glob API assumptions; replacing micromatch/fast-glob arbitrarily or hiding advisories is not acceptable. Shipping frozen generated CSS would remove a reproducible authoring/build contract and is not the preferred repair. No audit exclusions or unsafe aliases were introduced.
