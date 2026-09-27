import { test, expect } from '@playwright/test';

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
