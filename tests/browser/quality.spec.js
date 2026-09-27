import { test, expect } from '@playwright/test';

const cards = page => page.locator('a[aria-label^="Open "]');
test('home loads only featured cards while showing the complete catalog total', async ({ page }) => {
  const pageRequests = [];
  page.on('request', request => {
    if (request.url().endsWith('/rpc/get_mvp_catalog_page')) pageRequests.push(request.postDataJSON());
  });
  await page.goto('/');
  await expect(cards(page)).toHaveCount(8);
  await expect(page.locator('.data-ribbon-metric').filter({ hasText: 'Product records' }).locator('.data-ribbon-value')).toHaveText('100');
  expect(pageRequests.length).toBeGreaterThan(0);
  // All eight featured cards are bundled; fetch totals but no remote card data.
  expect(pageRequests.every(request => request.p_limit === 0)).toBe(true);
});

test('catalog paging, server facets, URL persistence, and search', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let releaseSuppliers;
  const suppliersGate = new Promise(resolve => { releaseSuppliers = resolve; });
  await page.route('**/rpc/search_mvp_supplier_windows', async route => {
    await suppliersGate;
    await route.continue();
  });
  try {
    await page.goto('/blocks');
    await expect(cards(page)).toHaveCount(24);
    await page.getByRole('button', { name: 'Load more blocks', exact: true }).click();
    await expect(cards(page)).toHaveCount(48);
  } finally { releaseSuppliers(); }
  await expect.poll(() => page.getByRole('combobox', { name: /^Supplier/ }).locator('option').count()).toBeGreaterThan(1);
  await expect(cards(page)).toHaveCount(48);
  const names = await cards(page).evaluateAll(items => items.map(item => item.href));
  expect(new Set(names).size).toBe(48);
  for (const count of [72, 96, 100]) {
    await page.getByRole('button', { name: 'Load more blocks', exact: true }).click();
    await expect(cards(page)).toHaveCount(count);
  }
  const complete = await cards(page).evaluateAll(items => items.map(item => item.href));
  expect(new Set(complete).size).toBe(100);
  await page.getByRole('combobox', { name: /^Filter by material/ }).selectOption('Italian travertine');
  await expect(cards(page)).toHaveCount(1);
  await expect(page).toHaveURL(/material=Italian/);
  await page.reload();
  await expect(cards(page)).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear all filters' }).click();
  await page.getByRole('textbox', { name: 'Search blocks' }).fill('basalt');
  await expect(cards(page)).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('WebGL studio renders, responds to controls, and releases modal state', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'warning' && message.text().includes('THREE.')) errors.push(message.text()); });
  await page.goto('/blocks');
  const trigger = page.getByRole('button', { name: 'View Copper Waterfall Bath Spout in 3D', exact: true });
  await trigger.click();
  const stage = page.locator('[data-renderer="webgl"][data-ready="true"]');
  await expect(stage).toBeVisible();
  await expect(stage.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Pause rotation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume rotation' })).toBeVisible();
  await page.getByRole('button', { name: 'Front', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Front', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByRole('button', { name: 'Switch studio lighting' }).click();
  await expect(page.getByRole('button', { name: 'Switch studio lighting' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Reset 3D view' }).click();
  await page.screenshot({ path: 'test-results/3d-desktop.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'Close 3D view' }).click();
  await expect(trigger).toBeFocused();
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  expect(await page.locator('body').evaluate(element => element.style.overflow)).not.toBe('hidden');
  // Opening a second model catches resource/context errors after disposal.
  await page.getByRole('button', { name: 'View Basalt Monolith Reception Counter in 3D', exact: true }).click();
  await expect(stage).toBeVisible();
  await page.screenshot({ path: 'test-results/3d-basalt.png', animations: 'disabled' });
  expect(errors).toEqual([]);
});

test('mobile 3D fits and supports keyboard controls and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/blocks');
  await page.getByRole('button', { name: 'View Copper Waterfall Bath Spout in 3D', exact: true }).click();
  await expect(page.locator('[data-renderer="webgl"][data-ready="true"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resume rotation' })).toBeVisible();
  const canvas = page.locator('canvas');
  await canvas.focus(); await canvas.press('ArrowRight'); await canvas.press('+');
  const dimensions = await canvas.evaluate(element => ({ pixels: element.width * element.height, width: element.getBoundingClientRect().width }));
  expect(dimensions.pixels).toBeLessThanOrEqual(1_152_000);
  expect(dimensions.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await page.screenshot({ path: 'test-results/3d-mobile.png', animations: 'disabled' });
  await canvas.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('WebGL context loss switches to a working compatibility view', async ({ page }) => {
  await page.goto('/blocks');
  await page.getByRole('button', { name: 'View Copper Waterfall Bath Spout in 3D', exact: true }).click();
  await expect(page.locator('[data-renderer="webgl"][data-ready="true"]')).toBeVisible();
  await page.locator('canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.getByText('Compatibility view', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause rotation' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('catalog failure is visible and retry recovers', async ({ page }) => {
  await page.route('**/rpc/get_mvp_catalog_page', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Temporary test failure"}' }));
  await page.goto('/blocks');
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  await page.unroute('**/rpc/get_mvp_catalog_page');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(cards(page)).toHaveCount(24);
});
