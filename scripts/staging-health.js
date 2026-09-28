// Read-only, bounded staging probe. No accounts, writes, retries or credentials in output.
import assert from 'node:assert/strict';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { loadEnv } from 'vite';

assert.equal(process.env.BUOD_LIVE_STAGING, '1', 'Explicit staging opt-in required');
const env = loadEnv('development', process.cwd(), 'VITE_');
const base = 'https://uhcvfwajowdszxteanlx.supabase.co';
assert.equal(env.VITE_SUPABASE_URL, base, 'Refusing a different backend');
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
assert.ok(key, 'Missing public key');
assert.ok(!key.startsWith('sb_secret_'), 'Use a public key only');
if (key.split('.').length === 3) {
  assert.equal(JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role, 'anon', 'Use anon, never service_role');
}
const cases = [
  { name: 'home-totals', args: { p_limit: 0 } },
  { name: 'catalog-page', args: { p_limit: 24 } },
  { name: 'search', args: { p_limit: 24, p_query: 'basalt' } },
];
const measurements = [];
let failed = false;
// Ten batches, only three concurrent reads. Abort further batches on any failure.
for (let batch = 0; batch < 10 && !failed; batch++) {
  await Promise.all(cases.map(async ({ name, args }) => {
    const start = performance.now();
    try {
      const response = await fetch(`${base}/rest/v1/rpc/get_mvp_catalog_page`, {
        method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' },
        body: JSON.stringify(args), signal: AbortSignal.timeout(10_000),
      });
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.ok(Number.isSafeInteger(data.total) && data.total >= (name === 'search' ? 0 : 1));
      assert.ok(Array.isArray(data.products) && data.products.length <= args.p_limit);
      measurements.push({ name, ms: Math.round(performance.now() - start) });
    } catch {
      failed = true;
      console.error(JSON.stringify({ check: name, result: 'FAIL', batch }));
    }
  }));
  if (!failed && batch < 9) await new Promise(resolve => setTimeout(resolve, 250));
}
const sorted = measurements.map(row => row.ms).sort((a, b) => a - b);
const percentile = p => sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)] ?? null;
const summary = { scope: 'staging-read-only-probe', requests: measurements.length, concurrency: 3,
  p50Ms: percentile(.5), p95Ms: percentile(.95), maxMs: sorted.at(-1) ?? null };
// An operational regression threshold, not a production SLA or load-capacity claim.
const slow = summary.p95Ms !== null && summary.p95Ms > 2000;
console.log(JSON.stringify({ ...summary, result: failed || slow ? 'FAIL' : 'PASS', reason: slow ? 'p95-over-2s' : undefined }));
if (failed || slow) process.exitCode = 1;
