import { test, expect } from '@playwright/test';
import process from 'node:process';

// Filmstrip capture calls ReadPixels on every frame and can stall a CPU-only
// CI renderer. Keep DOM/network/source traces, with explicit screenshots below.
test.use({ trace: process.env.BUOD_PREVIEW_ACCESS_URL ? 'off' : {
  mode: 'retain-on-failure', screenshots: false, snapshots: true, sources: true,
} });

// Exercise real Three.js and bundled models with an isolated data boundary.
// No staging credentials or external service availability are needed in CI.
test.beforeEach(async ({ page }) => {
  // CI verifies rendering correctness, not hardware throughput. The mobile test
  // overrides this; local/deployed checks retain the full desktop viewport.
  if (process.env.CI) await page.setViewportSize({ width: 800, height: 600 });
  await page.route('https://*.supabase.co/**', route => {
    const path = new URL(route.request().url()).pathname;
    const body = path.endsWith('/rpc/get_mvp_catalog_page')
      ? { products: [], total: 0, facets: {} } : [];
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  if (process.env.BUOD_PREVIEW_ACCESS_URL) {
    try {
      await page.goto(process.env.BUOD_PREVIEW_ACCESS_URL);
      if (new URL(page.url()).origin !== 'https://baud-git-staging-baud1.vercel.app') throw new Error('Preview access not established');
    } catch {
      // Authentication redirects can embed the share URL in their DOM. Do not
      // retain those links in Playwright failure snapshots or error messages.
      await page.goto('about:blank').catch(() => {});
      throw new Error('Preview authorization unavailable; request fresh temporary access');
    }
  }
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
  await page.getByRole('button', { name: 'Pause rotation' }).click();
  const canvas = page.locator('canvas');
  const before = await canvas.evaluate(element => element.toDataURL());
  await canvas.focus(); await canvas.press('ArrowRight'); await canvas.press('+');
  expect(await canvas.evaluate(element => element.toDataURL())).not.toBe(before);
  await canvas.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('compatibility render failure stops retries and leaves the dialog closable', async ({ page }) => {
  await page.addInitScript(() => {
    window.__buodFailedDraws = 0;
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.closest?.('.product-3d-stage')) {
        window.__buodFailedDraws++;
        throw new Error('Synthetic renderer failure');
      }
      return clear.apply(this, args);
    };
  });
  await page.goto('/blocks');
  await page.getByRole('button', { name: 'View Copper Waterfall Bath Spout in 3D', exact: true }).click();
  await expect(page.locator('[data-renderer="webgl"][data-ready="true"]')).toBeVisible();
  await page.locator('canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.getByRole('alert')).toContainText('could not start');
  const before = await page.evaluate(() => window.__buodFailedDraws);
  const after = await page.evaluate(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return window.__buodFailedDraws;
  });
  expect(after).toBe(before);
  await page.getByRole('button', { name: 'Close 3D view' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('3D rotation respects its frame budget and stops after pause and close', async ({ page }) => {
  await page.addInitScript(() => {
    window.__buodFrames = new Set();
    let activeFrame = null;
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = callback => raf.call(window, time => {
      activeFrame = time;
      try { callback(time); } finally { activeFrame = null; }
    });
    const original = WebGL2RenderingContext.prototype.clear;
    WebGL2RenderingContext.prototype.clear = function (...args) {
      if (activeFrame !== null && this.canvas.closest?.('[data-renderer="webgl"][data-ready="true"]')) window.__buodFrames.add(activeFrame);
      return original.apply(this, args);
    };
  });
  await page.goto('/blocks');
  await page.getByRole('button', { name: 'View Copper Waterfall Bath Spout in 3D', exact: true }).click();
  await expect(page.locator('[data-renderer="webgl"][data-ready="true"]')).toBeVisible();
  const sample = () => page.evaluate(async () => {
    const before = window.__buodFrames.size;
    const start = performance.now();
    await new Promise(resolve => setTimeout(resolve, 1200));
    return { draws: window.__buodFrames.size - before, ms: performance.now() - start };
  });
  const rotating = await sample();
  expect(rotating.draws).toBeGreaterThan(0);
  expect(rotating.draws / (rotating.ms / 1000)).toBeLessThanOrEqual(32);
  await page.getByRole('button', { name: 'Pause rotation', exact: true }).click();
  // Damping may render a final frame; then there must be no idle GPU work.
  await sample();
  expect((await sample()).draws).toBe(0);
  await page.getByRole('button', { name: 'Resume rotation', exact: true }).click();
  expect((await sample()).draws).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Close 3D view', exact: true }).click();
  expect((await sample()).draws).toBe(0);
  console.log('3D frame budget', JSON.stringify(rotating));
});
