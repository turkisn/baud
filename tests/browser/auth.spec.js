import { test, expect } from '@playwright/test';

test('signup validates required fields before contacting Auth', async ({ page }) => {
  let requests = 0;
  await page.addInitScript(() => localStorage.setItem('buod_language', 'en'));
  await page.route('https://*.supabase.co/**', route => { requests++; return route.fulfill({ json: [] }); });
  await page.goto('/login?mode=signup');
  await page.locator('form').getByRole('button', { name: 'Create Account', exact: true }).click();
  await expect(page.getByText('Name is required.', { exact: true })).toBeVisible();
  await expect(page.getByText('Valid email required.', { exact: true })).toBeVisible();
  await expect(page.getByText('Password is required.', { exact: true })).toBeVisible();
  await expect(page.locator('#full-name')).toBeFocused();
  expect(requests).toBe(0);
});

test('duplicate-obscured signup response does not promise account creation or delivery', async ({ page }) => {
  let submitted;
  await page.addInitScript(() => localStorage.setItem('buod_language', 'en'));
  await page.route('https://*.supabase.co/**', route => {
    if (new URL(route.request().url()).pathname === '/auth/v1/signup') {
      submitted = route.request().postDataJSON();
      return route.fulfill({ json: { id: 'fixture', identities: [], email: 'fixture@example.invalid' } });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto('/login?mode=signup');
  await page.locator('#full-name').fill('Fixture Designer');
  await page.locator('#email').fill('fixture@example.invalid');
  await page.locator('#password').fill('Fixture-only-not-a-real-password');
  await page.locator('form').getByRole('button', { name: 'Create Account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Check your email', exact: true })).toBeVisible();
  await expect(page.getByText('Account created!', { exact: true })).toHaveCount(0);
  expect(submitted.email).toBe('fixture@example.invalid');
});

test('reset route without a session provides a working new-link path', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('buod_language', 'en'));
  await page.route('https://*.supabase.co/**', route => route.fulfill({ json: [] }));
  await page.goto('/reset-password');
  await expect(page.getByRole('heading', { name: 'Reset link unavailable' })).toBeVisible();
  await page.getByRole('link', { name: 'Request a new link' }).click();
  await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
});

// Deterministic UI contract checks. These do not replace live Auth account tests.
const cases = [
  { code: 'invalid_credentials', message: 'Invalid login credentials', status: 400, expected: 'Email or password is incorrect.' },
  { code: 'email_not_confirmed', message: 'Email not confirmed', status: 400, expected: 'Confirm your email before signing in.' },
  { code: 'over_request_rate_limit', message: 'Rate limit exceeded', status: 429, expected: 'Too many attempts. Wait a moment and try again.' },
  { code: 'unexpected_failure', message: 'Internal authentication failure: private diagnostic', status: 500, expected: 'Authentication is temporarily unavailable. Please try again.' },
];

for (const scenario of cases) {
  test(`login explains ${scenario.code} without exposing diagnostics`, async ({ page }) => {
    const crashes = [];
    page.on('pageerror', error => crashes.push(error.message));
    await page.addInitScript(() => localStorage.setItem('buod_language', 'en'));
    await page.route('https://*.supabase.co/**', route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/auth/v1/token') return route.fulfill({
        status: scenario.status,
        contentType: 'application/json',
        body: JSON.stringify({ code: scenario.code, msg: scenario.message }),
      });
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    await page.locator('#email').fill('auth-fixture@example.invalid');
    await page.locator('#password').fill('Fixture-only-not-a-real-password');
    await page.locator('form').getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByText(scenario.expected, { exact: true })).toBeVisible();
    await expect(page.getByText('private diagnostic', { exact: false })).toHaveCount(0);
    await expect(page.locator('form').getByRole('button', { name: 'Sign In', exact: true })).toBeEnabled();
    expect(crashes).toEqual([]);
  });
}
