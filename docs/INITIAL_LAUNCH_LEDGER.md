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
3. **Dependency gate resolved locally:** authorized official Tailwind 4.3.3 + `@tailwindcss/vite` migration removes the entire `braces` chain and obsolete parser override. Clean `npm ci`, full audit and production-only audit now report **zero vulnerabilities**. All 80 pre-migration visual baselines pass unchanged. Browser minimums increase to Safari 16.4 / Chrome 111 / Firefox 128; local browser verification uses Chrome 154, not all minimum-version engines. See [Tailwind migration evidence and compatibility limits](TAILWIND4_MIGRATION.md).
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
- `docs/evidence/dependency-audit-summary.json`: historical pre-migration five-high finding. Current `tailwind4-audit-full.json` and `tailwind4-audit-production.json` both report zero.
- `docs/evidence/release-config.log`: expected failure because actual production settings are absent.
- `docs/evidence/arabic-mobile.png`: inspected 390px RTL 3D dialog, visible demo disclosure and controls; CSS transitions disabled for stable capture. Focused acceptance rerun: 1/1 passed (`mobile-evidence.log`).

The expanded suite also checks signup classification for designers/supplier/manufacturer representatives, admin/super-admin role-change denial, download signing retry/300-second TTL, and rejection/retry of malformed administrative API lists. Both the browser test fixtures and the app now distinguish a single profile response from a list response. No known failing local frontend test remains. Embedded database security tests now pass. Native multi-session concurrency now passes. Live Supabase service behavior remains **unverified**, not passed.


## Historical dependency findings before the authorized Tailwind migration

Pre-migration snapshot, superseded by the zero-finding Tailwind 4 audits. These are **five npm affected-package entries, one underlying advisory**, not five separate CVEs. [GitHub-reviewed GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists `braces <=3.0.3`, patched versions **None**. Raw npm JSON and the installed dependency tree are preserved in evidence.

| Affected installed package | Dependency path from this project | npm fixAvailable |
|---|---|---|
| braces 3.0.3 | tailwindcss → chokidar → braces; tailwindcss → micromatch → braces; tailwindcss → fast-glob → micromatch → braces | tailwindcss 4.3.3, semver-major |
| chokidar 3.6.0 | tailwindcss → chokidar | tailwindcss 4.3.3, semver-major |
| fast-glob 3.3.3 | tailwindcss → fast-glob → micromatch | `true` (no concrete package/version in this entry) |
| micromatch 4.0.8 | tailwindcss → micromatch; tailwindcss → fast-glob → micromatch | tailwindcss 4.3.3, semver-major |
| tailwindcss 3.4.19 | direct development dependency | tailwindcss 4.3.3, semver-major |

Ordinary `npm audit fix --dry-run --ignore-scripts` changes zero versions and retains all five findings; its proposed 49 additions are absent optional packages, not advisory fixes. Do not infer a compatible fix from the boolean `fast-glob.fixAvailable` alone. At that checkpoint production-only audit was zero and full CI audit remained failing. The authorized migration below resolves that gate.

Replacing Tailwind 3 with the official Tailwind 4 Vite/PostCSS plugin is practical as a planned CSS migration, not a drop-in patch. This repository has 1,895 stylesheet lines, 23 `@apply` sites, regex safelists, custom layers/global rules and utility usage across 60 JSX files. The [official upgrade guide](https://tailwindcss.com/docs/upgrade-guide) requires updated plugin/directives and documents changed safelisting, utility defaults, cascade and browser requirements. Acceptance requires deciding minimum browsers and comparing all mounted pages, admin modals, RTL/mobile, focus and reduced-motion states. Replacing only chokidar with a major version breaks its glob API assumptions; replacing micromatch/fast-glob arbitrarily or hiding advisories is not acceptable. Shipping frozen generated CSS would remove a reproducible authoring/build contract and is not the preferred repair. No audit exclusions or unsafe aliases were introduced.


## Tailwind 4 follow-up

The authorized official migration is implemented. Brand tokens and Arabic fonts remain in the canonical theme through the supported `@config` bridge. Source detection is explicit; unused duplicate configuration and obsolete dependencies/override are removed. Documented utility renames, native layer placement, legacy status colors, responsive hero line heights and the existing gold shadow preserve the captured design. All 72 route/language/viewport screenshots plus eight focused 3D/editor views pass against unchanged Tailwind 3 baselines. No application SQL or pinned asset changed. Full details, raw results, browser compatibility and remaining acceptance gaps are in [TAILWIND4_MIGRATION.md](TAILWIND4_MIGRATION.md).


## Final local acceptance and release handoff

A final critical-diff review found and fixed three remaining administrative request edges: old supplier-filter responses, category lookup recovery targeting the wrong request, and stale editor-failure context misdirecting a subsequent list retry. Four browser regressions cover these cases. Five additional local Chrome checks pass for actual Cairo-loaded Arabic pages, forced colors and keyboard focus on signup/recovery, 3D disclosure/controls, and admin modal trapping/restoration. Safari 27 is installed but WebDriver confirms Remote Automation is disabled; Firefox/WebKit test runtimes are absent. No setting or install was changed. See [STAGING_RELEASE_HANDOFF.md](STAGING_RELEASE_HANDOFF.md) for the original-finding disposition, final results, exact pending migration/hash, rollout/backup/rollback prerequisites, bounded synthetic campaign and owner facts. No live mutation, push or deployment occurred.

## Native PostgreSQL 17.6 follow-up

Official signed/notarized Postgres.app v2.8.5 PG17 image verified by release SHA-256 and disk checksum, then executed directly from a read-only workspace mount. PostgreSQL **17.6** matches staging's reported upstream version. **57 migrations, 3 SQL security suites, 5 real two-session concurrency scenarios passed**; transport bounds, shutdown, cluster removal and image detachment confirmed. Raw evidence: `docs/evidence/database-native-pg17.log`. An initial wrapper attempt stopped before tests solely because its version-string assertion omitted the vendor suffix; corrected wrapper then passed. No application code/migration changed, security check bypassed, persistent service installed or live database modified.

Read-only browser inspection confirmed authenticated BUOD Staging, but Backups navigation did not leave Schema Visualizer. Final safe read confirmed that page; browser work stopped as requested. Backup/recovery evidence remains an owner prerequisite, with no claim that the Free-plan badge proves absence of backups. See handoff for the minimal recovery-point/operator/Storage evidence needed. Existing frontend results remain valid and were not rerun for this evidence-only update.
