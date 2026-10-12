# Local concurrency test — executed on native PostgreSQL 18.6

On 12 October 2026, `scripts/test-database-native.js` passed five real two-session scenarios after replaying all 57 migrations and the three SQL suites. See `docs/evidence/database-native.log`. It creates its own disposable cluster and does not accept a database URL. Auth/Storage platform tables are fixture scaffolding; this does not test their HTTP services or deployed-version parity.

Reproduce only with an approved native runtime:

```sh
BUOD_PG_BIN=/absolute/path/to/approved/PostgreSQL/bin npm run test:database:native
```

The runner asserts loopback-only listening, rejects TCP authentication, uses an owner-only Unix socket directory, and stops/removes its disposable cluster in `finally`. The manual sequence below describes the assertions automated by the runner.

Requires a disposable PostgreSQL/Supabase instance with all migrations applied and two synthetic super_admin profiles A and B. Do not run against a live project.

1. Session A: `BEGIN; SET LOCAL ROLE authenticated;` set `request.jwt.claims` with A's UUID; call `admin_set_user_role(B, 'user')`; leave the transaction open.
2. Session B: `BEGIN; SET LOCAL ROLE authenticated;` set claims with B's UUID; call `admin_set_user_role(A, 'user')` asynchronously. It must block on the profile table lock.
3. Commit session A. Session B must now fail with `Permission denied` after re-reading B's current role, leaving A as super_admin. Roll back B.
4. Repeat reversing A and B. Also exercise two concurrent admin requests promoting/demoting one user and verify both audit old/new values match the serialized database transitions.
5. Attempt null role, self-demotion, admin managing admin/super_admin, direct INSERT/DELETE/UPDATE role paths. All must be denied. Ordinary name/company/classification edits and signup must succeed.
6. Repeat under REPEATABLE READ: one transaction must abort on serialization rather than allow two stale authorizations. Default PostgREST isolation is the principal supported path; do not approve if the deployed isolation differs without verification.

Record actual SQL, PostgreSQL version, isolation, results and cleanup evidence. Merely inspecting the lock statement does not prove concurrency correctness.
