import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

// Never accepts a database URL. Always creates and destroys its own local
// cluster. Supply BUOD_PG_BIN only after approving/installing a native runtime.
const bin = process.env.BUOD_PG_BIN;
assert.ok(bin && path.isAbsolute(bin), 'Set BUOD_PG_BIN to the approved PostgreSQL bin directory');
const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(path.join(tmpdir(), 'buod-native-'));
const data = path.join(temporary, 'data');
const socket = path.join(temporary, 'socket');
await mkdir(socket, { mode: 0o700 });
const probe = createServer();
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('PG')));
Object.assign(env, { PGHOST: socket, PGPORT: String(port), PGUSER: 'postgres', PGDATABASE: 'postgres' });
const clients = [];
let started = false;
function run(binary, args, input) {
  const result = spawnSync(path.join(bin, binary), args, { env, input, encoding: 'utf8', timeout: 30_000, maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`${binary}: ${result.error?.message || result.stderr || result.stdout}`);
  return result.stdout.trim();
}
const sql = query => run('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1'], query);
function session(name) {
  const child = spawn(path.join(bin, 'psql'), ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1'], { env: { ...env, PGAPPNAME: name }, stdio: ['pipe', 'pipe', 'pipe'] });
  const state = { child, output: '', errors: '', done: false, exitCode: null };
  child.stdout.on('data', chunk => { state.output += chunk; });
  child.stderr.on('data', chunk => { state.errors += chunk; });
  child.on('error', error => { state.errors += error.message; state.done = true; });
  child.on('exit', code => { state.exitCode = code; state.done = true; });
  child.stdin.write("\\set VERBOSITY verbose\nset statement_timeout='10s';\n");
  clients.push(state);
  return state;
}
async function until(predicate, description) {
  const deadline = Date.now() + 8_000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`Timed out: ${description}`);
    await delay(25);
  }
}
async function sendAndWait(client, command, marker) {
  client.child.stdin.write(`${command}\nselect '${marker}';\n`);
  await until(() => client.output.includes(marker) || client.done, marker);
  assert.ok(client.output.includes(marker), client.errors);
}
const A = 'c0000000-0000-4000-8000-000000000001';
const B = 'c0000000-0000-4000-8000-000000000002';
const U = 'c0000000-0000-4000-8000-000000000003';
const claims = id => `select set_config('request.jwt.claims','{"sub":"${id}","role":"authenticated"}',true); set local role authenticated;`;
function resetRoles() {
  sql(`alter table public.profiles disable trigger enforce_profile_role_acl;
    update public.profiles set role=case when id='${U}' then 'user' else 'super_admin' end where id in ('${A}','${B}','${U}');
    alter table public.profiles enable trigger enforce_profile_role_acl;
    truncate public.admin_audit_log;`);
}
try {
  console.log(run('postgres', ['--version']));
  run('initdb', ['-D', data, '-U', 'postgres', '--auth-local=trust', '--auth-host=reject', '--no-locale', '--encoding=UTF8']);
  // Restrict TCP to loopback and reject TCP authentication. Unix socket access
  // is restricted by the owner-only temporary parent directory.
  run('pg_ctl', ['-D', data, '-l', path.join(temporary, 'server.log'), '-o', `-h 127.0.0.1 -p ${port} -k ${socket}`, '-w', 'start']);
  started = true;
  assert.equal(sql('show listen_addresses;'), '127.0.0.1');
  assert.equal(sql("select count(*) from pg_hba_file_rules where type in ('host','hostssl','hostnossl') and auth_method <> 'reject';"), '0');
  console.log('PASS transport: loopback-only listener, TCP authentication rejected, owner-only Unix socket directory');
  sql(await readFile(path.join(root, 'supabase/tests/platform_fixture.sql'), 'utf8'));
  const migrations = (await readdir(path.join(root, 'supabase/migrations'))).filter(name => name.endsWith('.sql')).sort();
  for (const name of migrations) {
    run('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-f', path.join(root, 'supabase/migrations', name)]);
  }
  console.log(`PASS ${migrations.length} migrations on native PostgreSQL`);
  for (const name of ['admin_security.sql', 'workspace_security.sql', 'launch_security.sql']) {
    const result = run('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-f', path.join(root, 'supabase/tests', name)]);
    assert.ok(result.includes('PASS:'), `Missing pass marker: ${name}`);
    console.log(`PASS native SQL suite ${name}`);
  }
  sql(`insert into auth.users(id,email,raw_user_meta_data) values
    ('${A}','race-a@example.invalid','{}'),('${B}','race-b@example.invalid','{}'),('${U}','race-target@example.invalid','{}');`);
  for (const isolation of ['read committed', 'repeatable read']) {
    for (const [first, second] of [[A, B], [B, A]]) {
      resetRoles();
      const label = `${isolation.replaceAll(' ', '-')}-${first === A ? 'a' : 'b'}`;
      const one = session(`buod-first-${label}`);
      const two = session(`buod-second-${label}`);
      // Establish both snapshots before demotion, including repeatable-read.
      await sendAndWait(two, `begin isolation level ${isolation}; ${claims(second)} select public.get_my_role();`, 'SECOND_READY');
      await sendAndWait(one, `begin isolation level ${isolation}; ${claims(first)} select public.admin_set_user_role('${second}','user');`, 'FIRST_HOLDS_LOCK');
      two.child.stdin.write(`select public.admin_set_user_role('${first}','user');\n`);
      await until(() => sql(`select count(*) from pg_stat_activity where application_name='buod-second-${label}' and wait_event_type='Lock';`) === '1', 'second transaction waiting on database lock');
      await sendAndWait(one, 'commit;', 'FIRST_COMMITTED');
      one.child.stdin.end();
      await until(() => two.done, 'second transaction denied');
      assert.notEqual(two.exitCode, 0, 'Stale authorization unexpectedly succeeded');
      assert.match(two.errors, isolation === 'repeatable read' ? /40001/ : /Permission denied/);
      assert.equal(sql("select count(*) from public.profiles where role='super_admin';"), '1');
      assert.equal(sql(`select role from public.profiles where id='${first}';`), 'super_admin');
      assert.equal(sql(`select count(*) from public.admin_audit_log where action='user.role_change' and actor_user_id='${first}' and target_id='${second}' and metadata->>'old_role'='super_admin' and metadata->>'new_role'='user';`), '1');
      console.log(`PASS concurrent cross-demotion ${label}: loser ${isolation === 'repeatable read' ? '40001 serialization failure' : 'Permission denied'}, one super-admin, one audit`);
    }
  }
  resetRoles();
  const first = session('buod-audit-first');
  const second = session('buod-audit-second');
  await sendAndWait(first, `begin; ${claims(A)} select public.admin_set_user_role('${U}','reviewer');`, 'AUDIT_FIRST');
  second.child.stdin.write(`begin; ${claims(B)} select public.admin_set_user_role('${U}','admin'); commit; select 'AUDIT_SECOND';\n`);
  await until(() => sql("select count(*) from pg_stat_activity where application_name='buod-audit-second' and wait_event_type='Lock';") === '1', 'second audit writer blocked');
  await sendAndWait(first, 'commit;', 'AUDIT_COMMITTED');
  first.child.stdin.end();
  await until(() => second.output.includes('AUDIT_SECOND') || second.done, 'second audit writer finished');
  assert.ok(second.output.includes('AUDIT_SECOND'), second.errors);
  second.child.stdin.end();
  assert.equal(sql(`select role from public.profiles where id='${U}';`), 'admin');
  assert.equal(sql(`select string_agg(metadata->>'old_role'||'>'|| (metadata->>'new_role'),',' order by created_at,id) from public.admin_audit_log where action='user.role_change';`), 'user>reviewer,reviewer>admin');
  console.log('PASS concurrent role updates: serialized old/new audit chain and final role');
  console.log('PASS native regression: 57 migrations, 3 SQL suites, 5 real two-session concurrency scenarios');
  console.log('LIMIT: platform Auth/Storage tables are test scaffolding; HTTP services and deployed-version parity remain external gates.');
} finally {
  for (const client of clients) if (!client.done) client.child.stdin.end();
  if (started) {
    run('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']);
    const stopped = spawnSync(path.join(bin, 'pg_ctl'), ['-D', data, 'status'], { env, encoding: 'utf8' });
    assert.equal(stopped.status, 3, 'Temporary server did not stop');
    console.log('PASS cleanup: PostgreSQL stopped; no persistent service');
  }
  await rm(temporary, { recursive: true, force: true });
  console.log('PASS cleanup: disposable cluster removed');
}
