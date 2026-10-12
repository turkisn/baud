import { test, expect } from '@playwright/test';

const owner = '22222222-2222-4222-8222-222222222222';
const session = { access_token: 'eyJ.' + btoa(JSON.stringify({ session_id: 'synthetic-session' })) + '.signature', refresh_token: 'isolated-refresh', token_type: 'bearer', expires_at: 4102444800, user: { id: owner, email: 'isolated@example.invalid', aud: 'authenticated', role: 'authenticated', user_metadata: {} } };
async function fixture(page, { language = 'ar', role, recovery = false } = {}) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(({ language, role, recovery, session }) => {
    localStorage.setItem('buod_language', language);
    if (role && !location.pathname.startsWith('/login')) localStorage.setItem('sb-workspace-fixture-auth-token', JSON.stringify(session));
    if (location.pathname.startsWith('/login')) localStorage.removeItem('sb-workspace-fixture-auth-token');
    if (recovery) sessionStorage.setItem('buod-password-recovery', JSON.stringify({ userId: session.user.id, sessionId: 'synthetic-session', startedAt: Date.now() }));
  }, { language, role, recovery, session });
  await page.route('https://*.supabase.co/**', route => {
    const url = new URL(route.request().url());
    let json = [];
    if (url.pathname.endsWith('/profiles')) {
      const profile = { id: owner, full_name: 'Synthetic Admin', role: role || 'user', user_type: 'general_user' };
      json = url.searchParams.has('id') ? profile : [profile];
    } else if (url.pathname.endsWith('/auth/v1/user')) json = session.user;
    else if (url.pathname.endsWith('/rpc/get_mvp_catalog_page')) json = { products: [], total: 0, facets: {} };
    return route.fulfill({ json, headers: { 'content-range': '0-0/0' } });
  });
}
async function keyboardFocus(page, locator) {
  await locator.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(locator).toBeFocused();
  const indicator = await locator.evaluate(el => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth), color: style.outlineColor };
  });
  expect(indicator.style).not.toBe('none');
  expect(indicator.width).toBeGreaterThan(0);
  expect(indicator.color).not.toBe('rgba(0, 0, 0, 0)');
}

for (const language of ['en', 'ar']) test(`forced colors preserve ${language} signup and recovery keyboard paths`, async ({ page }) => {
  await fixture(page, { language });
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/login?mode=signup');
  await keyboardFocus(page, page.locator('#full-name'));
  const submit = page.locator('form button[type="submit"]');
  await keyboardFocus(page, submit);
  await page.keyboard.press('Enter');
  await expect(page.locator('#full-name')).toBeFocused();
  await expect(page.locator('#full-name')).toHaveAttribute('aria-invalid', 'true');
  await page.goto('/reset-password');
  const newLink = page.locator('a[href="/forgot-password"]');
  await keyboardFocus(page, newLink);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/forgot-password$/);
  await keyboardFocus(page, page.locator('#recovery-email'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/acceptance/forced-colors-${language}-recovery.png`, animations: 'disabled' });
});

test('forced colors preserve Arabic 3D disclosure, keyboard controls and focus return', async ({ page }) => {
  await fixture(page);
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto('/blocks/catalog-basalt-reception-counter');
  const trigger = page.getByRole('button', { name: 'عرض 3D تفاعلي', exact: true }).first();
  await keyboardFocus(page, trigger);
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-renderer="webgl"][data-ready="true"]')).toBeVisible();
  const disclosure = page.getByText('نموذج بُعد تجريبي', { exact: true });
  await expect(disclosure).toBeInViewport();
  await expect(page.getByRole('button', { name: 'استئناف الدوران', exact: true })).toBeVisible();
  await keyboardFocus(page, page.locator('canvas'));
  await page.keyboard.press('ArrowRight');
  await page.screenshot({ path: 'test-results/acceptance/forced-colors-ar-3d.png', animations: 'disabled' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('forced colors preserve Arabic admin editor focus trapping and restoration', async ({ page }) => {
  await fixture(page, { role: 'admin' });
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/admin/products');
  const trigger = page.getByRole('button', { name: 'إنشاء بلوك', exact: true });
  await keyboardFocus(page, trigger);
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'إغلاق المحرر', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await keyboardFocus(page, page.getByLabel('Product name (English)'));
  await page.screenshot({ path: 'test-results/acceptance/forced-colors-ar-admin.png', animations: 'disabled' });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('actual Cairo font loads and Arabic mobile launch transitions remain usable', async ({ page }) => {
  await fixture(page, { role: 'admin', recovery: true });
  for (const path of ['/', '/login?mode=signup', '/reset-password', '/admin/products']) {
    await page.goto(path);
    await expect(page.locator('h1').first()).toBeVisible();
    if (path.startsWith('/login')) await expect(page.locator('#full-name')).toBeVisible();
    const font = await page.evaluate(async () => {
      const loaded = await document.fonts.load('400 16px Cairo', 'العربية');
      await document.fonts.ready;
      return loaded.map(face => ({ family: face.family, status: face.status }));
    });
    expect(font.some(face => face.family === 'Cairo' && face.status === 'loaded')).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (path === '/reset-password') await expect(page.locator('#new-password')).toBeVisible();
    await page.screenshot({ path: `test-results/acceptance/font-loaded-ar-${path.split('?')[0].replaceAll('/', '-') || 'home'}.png`, animations: 'disabled', fullPage: true });
  }
  await page.goto('/blocks/catalog-basalt-reception-counter');
  await page.getByRole('button', { name: 'عرض 3D تفاعلي', exact: true }).first().click();
  await expect(page.locator('[data-renderer="webgl"][data-ready="true"]')).toBeVisible();
  await expect(page.getByText('نموذج بُعد تجريبي', { exact: true })).toBeInViewport();
  await page.screenshot({ path: 'test-results/acceptance/font-loaded-ar-3d.png', animations: 'disabled' });
});
