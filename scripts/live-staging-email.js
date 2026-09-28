// Opt-in email delivery check. Never logs passwords, sessions or confirmation links.
// A newly created real-address fixture is retained until its recipient confirms receipt.
import assert from 'node:assert/strict';
import process from 'node:process';
import { randomBytes } from 'node:crypto';
import { chromium, expect } from '@playwright/test';
import { createInterface } from 'node:readline/promises';

assert.equal(process.env.BUOD_LIVE_STAGING, '1');
const email = process.env.BUOD_TEST_EMAIL;
assert.ok(email && /\S+@\S+\.\S+/.test(email), 'A user-authorized test email is required');
const mode = process.env.BUOD_EMAIL_MODE;
assert.ok(['signup', 'recovery'].includes(mode));
const base = 'https://baud-git-staging-baud1.vercel.app';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
try {
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.setItem('buod_language', 'en'));
  const page = await context.newPage();
  page.setDefaultTimeout(25000);
  const input = createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  let accessUrl;
  try { accessUrl = await input.question('Temporary preview URL (kept in memory): '); } finally { input.close(); }
  assert.equal(new URL(accessUrl).origin, base);
  await page.goto(accessUrl);
  assert.equal(new URL(page.url()).origin, base);
  await page.goto(`${base}/${mode === 'signup' ? 'login?mode=signup' : 'forgot-password'}`);
  if (mode === 'signup') {
    await page.locator('#full-name').fill('BUOD Email Acceptance Test');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(`Aa1!${randomBytes(24).toString('base64url')}`);
  } else {
    await page.locator('#recovery-email').fill(email);
  }
  const [response] = await Promise.all([
    page.waitForResponse(response => response.url().startsWith(`https://uhcvfwajowdszxteanlx.supabase.co/auth/v1/${mode === 'signup' ? 'signup' : 'recover'}`)),
    page.locator('form button[type="submit"]').click(),
  ]);
  const data = await response.json();
  console.log(JSON.stringify({ mode, httpStatus: response.status(), code: data.code || data.error_code, fixtureId: mode === 'signup' ? data.id || data.user?.id : undefined }));
  assert.equal(response.status(), 200);
  await expect(page.getByRole('heading', { name: mode === 'signup' ? 'Account created!' : 'Check your email', exact: true })).toBeVisible();
  console.log('PASS email request accepted; actual inbox delivery still needs recipient confirmation');
} catch (error) {
  console.error(JSON.stringify({ result: 'FAIL', mode, code: error.code || error.name }));
  process.exitCode = 1;
} finally { await browser.close(); }
