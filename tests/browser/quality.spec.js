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


test('catalog failure is visible and retry recovers', async ({ page }) => {
  await page.route('**/rpc/get_mvp_catalog_page', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Temporary test failure"}' }));
  await page.goto('/blocks');
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  await page.unroute('**/rpc/get_mvp_catalog_page');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(cards(page)).toHaveCount(24);
});
