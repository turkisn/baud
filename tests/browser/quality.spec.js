import { test, expect } from '@playwright/test';
import { BUNDLED_CATALOG_PRODUCTS } from '../../src/data/bundledCatalog.js';

const remote = Array.from({length:64}, (_,i) => ({ id:`fixture-${i}`, slug:`fixture-${i}`,
  product_name_en:`Fixture product ${i}`,product_name_ar:`منتج تجريبي ${i}`,available_formats:[] }));
const total = remote.length + BUNDLED_CATALOG_PRODUCTS.length;
const cards = page => page.locator('a[aria-label^="Open "]');
test.beforeEach(async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('buod_language','en'));
  await page.route('https://*.supabase.co/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/rpc/get_mvp_catalog_page')) {
      const q = route.request().postDataJSON();
      const items = remote.filter(p => !q.p_query || p.product_name_en.toLowerCase().includes(q.p_query.toLowerCase()));
      return route.fulfill({json:{products:items.slice(q.p_offset,q.p_offset+q.p_limit),total:items.length,facets:{}}});
    }
    return route.fulfill({json:[]});
  });
});
test('home shows the actual combined total and only eight featured cards', async ({page}) => {
  await page.goto('/');
  await expect(cards(page)).toHaveCount(8);
  await expect(page.locator('.data-ribbon-metric').filter({hasText:'Product records'}).locator('.data-ribbon-value')).toHaveText(String(total));
});
test('catalog pagination, unique rows, search, reload and return context', async ({page}) => {
  await page.goto('/blocks');
  await expect(cards(page)).toHaveCount(24);
  for(let count=48;count<total+24;count+=24) {
    await page.getByRole('button',{name:'Load more blocks',exact:true}).click();
    await expect(cards(page)).toHaveCount(Math.min(total,count));
  }
  expect(new Set(await cards(page).evaluateAll(items=>items.map(i=>i.href))).size).toBe(total);
  await page.getByRole('textbox',{name:'Search blocks'}).fill('basalt');
  await expect(page).toHaveURL(/q=basalt/);
  const expected = BUNDLED_CATALOG_PRODUCTS.filter(p=>JSON.stringify(p).toLowerCase().includes('basalt')).length;
  await expect(cards(page)).toHaveCount(expected);
  await page.reload();
  await expect(cards(page)).toHaveCount(expected);
  await cards(page).first().click();
  await expect(page.getByRole('note')).toContainText('Demonstration record');
  await page.getByRole('link',{name:'Back to blocks'}).click();
  await expect(page).toHaveURL(/q=basalt/);
  await expect(cards(page)).toHaveCount(expected);
});
test('catalog outage and retry recover', async ({page}) => {
  let fail=true;
  await page.route('**/rpc/get_mvp_catalog_page',route => fail ? route.fulfill({status:503,json:{message:'fixture outage'}}) : route.fallback());
  await page.goto('/blocks');
  await expect(page.getByRole('button',{name:'Try again',exact:true})).toBeVisible();
  fail=false;
  await page.getByRole('button',{name:'Try again',exact:true}).click();
  await expect(cards(page)).toHaveCount(24);
});
