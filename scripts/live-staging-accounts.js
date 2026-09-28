// Opt-in acceptance checks against BUOD Staging only. Never part of default CI.
// Only disposable Auth API accounts are touched, never the user's dashboard session.
// Covers accounts/workspace APIs, not email delivery, browser acceptance or file uploads.
import assert from 'node:assert/strict';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { randomUUID, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from 'vite';

const ref = 'uhcvfwajowdszxteanlx';
const url = `https://${ref}.supabase.co`;
assert.equal(process.env.BUOD_LIVE_STAGING, '1', 'Explicit staging opt-in required');
const env = loadEnv('development', process.cwd(), 'VITE_');
assert.equal(env.VITE_SUPABASE_URL, url, 'Refusing a different backend');
const publicKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
assert.ok(publicKey, 'Missing public key');
const run = randomUUID();
const users = [];
const passed = [];
let phase = 'administrative access';
let admin;

function client(key = publicKey) {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal || AbortSignal.timeout(20000) }) },
  });
}
function ok(result) {
  if (result.error) {
    const error = new Error('Remote operation failed');
    error.code = result.error.code || result.error.statusCode || result.error.status;
    throw error;
  }
  return result.data;
}
async function step(name, action) {
  phase = name;
  console.log(`CHECK ${name}`);
  await action();
  passed.push(name);
  console.log(`PASS ${name}`);
}
function keyRecords(value) {
  if (!value || typeof value !== 'object') return [];
  return [value, ...Object.values(value).flatMap(keyRecords)];
}
async function fixture(label, confirmed = true) {
  const email = `qa-${run}-${label}@buod-test.invalid`;
  const password = `Aa1!${randomBytes(24).toString('base64url')}`;
  const data = ok(await admin.auth.admin.createUser({
    email, password, email_confirm: confirmed,
    user_metadata: { full_name: `QA ${label}`, role: 'super_admin', user_type: 'engineer' },
  }));
  const user = { id: data.user.id, email, password, client: client(), confirmed };
  users.push(user);
  // IDs are non-secret recovery targets if this test process is forcibly stopped.
  console.log(`FIXTURE user ${user.id}`);
  return user;
}
async function signIn(user) {
  ok(await user.client.auth.signInWithPassword({ email: user.email, password: user.password }));
}
async function cleanup() {
  if (!admin) return;
  const failures = [];
  async function attempt(label, action) {
    try { ok(await action()); } catch { failures.push(label); }
  }
  // Only these newly created fixture identities are signed out, never the dashboard account.
  for (const user of users) await attempt(`session ${user.id}`, () => user.client.auth.signOut({ scope: 'global' }));
  for (const user of users) {
    // Auth deletion cascades to the profile; service_role intentionally has no
    // direct profile DELETE grant. The removed profile also removes elevated roles.
    await attempt(`user ${user.id}`, () => admin.auth.admin.deleteUser(user.id));
  }
  console.log(JSON.stringify({ cleanup: failures.length ? 'INCOMPLETE' : 'complete', failures }));
  if (failures.length) process.exitCode = 1;
}

try {
  let raw;
  try {
    raw = execFileSync(process.env.BUOD_SUPABASE_CLI || 'supabase', [
      'projects', 'api-keys', '--project-ref', ref, '--reveal', '--output', 'json',
    ], { encoding: 'utf8', timeout: 180000, killSignal: 'SIGKILL', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    const safe = new Error('Administrative access unavailable');
    safe.code = error.code || `cli_exit_${error.status}`;
    throw safe;
  }
  const records = keyRecords(JSON.parse(raw));
  const credential = records.find(row => row.name === 'service_role' && typeof row.api_key === 'string')
    || records.find(row => row.type === 'secret' && typeof row.api_key === 'string');
  assert.ok(credential, 'Admin key missing from CLI response');
  admin = client(credential.api_key);
  raw = undefined;
  console.log(`STAGING RUN ${run}`);
  const a = await fixture('a');
  const b = await fixture('b');
  const unconfirmed = await fixture('unconfirmed', false);
  const anonymous = client();

  await step('real password sign-in and server-controlled default role', async () => {
    await signIn(a); await signIn(b);
    const profile = ok(await a.client.from('profiles').select('id,role').eq('id', a.id).single());
    assert.equal(profile.role, 'user');
  });
  await step('wrong password and unconfirmed email are rejected', async () => {
    const wrong = await client().auth.signInWithPassword({ email: a.email, password: 'Not-the-fixture-password1!' });
    assert.equal(wrong.error?.code, 'invalid_credentials');
    const pending = await unconfirmed.client.auth.signInWithPassword({ email: unconfirmed.email, password: unconfirmed.password });
    assert.equal(pending.error?.code, 'email_not_confirmed');
  });
  await step('profile and admin RPC privilege escalation denied', async () => {
    const direct = await a.client.from('profiles').update({ role: 'super_admin' }).eq('id', a.id);
    assert.ok(direct.error);
    const rpc = await a.client.rpc('admin_set_user_role', { target_user_id: a.id, new_role: 'super_admin' });
    assert.ok(rpc.error);
    assert.equal(ok(await a.client.from('profiles').select('role').eq('id', a.id).single()).role, 'user');
  });
  const mutation = randomUUID();
  const initial = [{ id: randomUUID(), name: 'QA API workspace', products: [] }];
  await step('workspace save and idempotent retry persist real data', async () => {
    const args = { p_projects: initial, p_expected_revision: 0, p_mutation_id: mutation };
    assert.equal(ok(await a.client.rpc('save_my_workspace', args)).revision, 1);
    assert.equal(ok(await a.client.rpc('save_my_workspace', args)).revision, 1);
    assert.deepEqual(ok(await a.client.from('user_workspaces').select('projects').eq('owner_id', a.id).single()).projects, initial);
  });
  await step('cross-account workspace reads and writes denied', async () => {
    assert.equal(ok(await b.client.from('user_workspaces').select('owner_id').eq('owner_id', a.id)).length, 0);
    const write = await b.client.from('user_workspaces').update({ projects: [], revision: 2, last_mutation_id: randomUUID() }).eq('owner_id', a.id).select('owner_id');
    assert.ok(write.error || write.data.length === 0);
    assert.equal(ok(await a.client.from('user_workspaces').select('revision').eq('owner_id', a.id).single()).revision, 1);
    assert.ok((await anonymous.from('user_workspaces').select('owner_id')).error);
  });
  await step('stale workspace writes fail without data loss', async () => {
    const started = performance.now();
    const stale = await a.client.rpc('save_my_workspace', { p_projects: [], p_expected_revision: 0, p_mutation_id: randomUUID() });
    const elapsedMs = Math.round(performance.now() - started);
    console.log(JSON.stringify({ staleStatus: stale.status, staleCode: stale.error?.code, elapsedMs }));
    assert.equal(stale.error?.code, 'PT409');
    assert.equal(stale.status, 409);
    assert.ok(elapsedMs < 5000, 'A business conflict must return promptly');
    assert.deepEqual(ok(await a.client.from('user_workspaces').select('projects').eq('owner_id', a.id).single()).projects, initial);
  });

  if (process.env.BUOD_LIVE_BROWSER === '1') {
    const { runBrowserAcceptance } = await import('./live-staging-browser.js');
    await runBrowserAcceptance({ a, b, admin, client, fixture, ok, step, run });
  }

  console.log(JSON.stringify({ result: 'PASS', scope: 'accounts-and-workspace', checks: passed.length, run }));
} catch (error) {
  console.error(JSON.stringify({ result: 'FAIL', phase, code: error.code || error.name,
    actual: typeof error.actual === 'string' ? error.actual.slice(0, 100) : undefined,
    expected: typeof error.expected === 'string' ? error.expected.slice(0, 100) : undefined,
    passed: passed.length, run }));
  process.exitCode = 1;
} finally {
  await cleanup();
}
