import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

// Isolated, repeatable design comparison. External font delivery is deliberately
// excluded: both revisions use the same system fallback and synthetic accounts.
const owner = '22222222-2222-4222-8222-222222222222';
const supplier = { id: owner, slug: 'synthetic-supplier', company_name_en: 'Synthetic Supplier', company_name_ar: 'مورد اختبار', is_published: true, verification_status: 'unverified', city: 'Riyadh' };
const routes = ['/', '/blocks', '/blocks/catalog-basalt-reception-counter', '/suppliers', '/suppliers/synthetic-supplier', '/projects', '/compare', '/login', '/forgot-password', '/reset-password', '/terms', '/privacy', ...['dashboard', 'products', 'users', 'suppliers', 'categories', 'settings'].map(name => `/admin/${name}`)];
const session = { access_token: 'eyJ.' + btoa(JSON.stringify({ session_id: 'synthetic-session' })) + '.signature', refresh_token: 'isolated-refresh', token_type: 'bearer', expires_at: 4102444800, user: { id: owner, email: 'isolated@example.invalid', aud: 'authenticated', role: 'authenticated', user_metadata: {} } };
for (const language of ['en', 'ar']) for (const mobile of [false, true]) {
  for (const entry of [...routes, { path: '/blocks/catalog-basalt-reception-counter', interaction: '3d' }, { path: '/admin/products', interaction: 'editor' }]) {
  const { path, interaction } = typeof entry === 'string' ? { path: entry } : entry;
  test(`${language} ${mobile ? 'mobile' : 'desktop'} ${path}${interaction ? ` interaction-${interaction}` : ''}`, async ({ page }, info) => {
    const name = `${language}-${mobile ? 'mobile' : 'desktop'}-${path.replaceAll('/', '_') || 'home'}${interaction ? `-${interaction}` : ''}`;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
    await page.clock.setFixedTime(new Date('2026-10-12T12:00:00Z'));
    await page.addInitScript(({ language, session, admin }) => {
      localStorage.setItem('buod_language', language);
      if (admin) localStorage.setItem('sb-workspace-fixture-auth-token', JSON.stringify(session));
    }, { language, session, admin: path.startsWith('/admin') });
    await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
    await page.route('https://*.supabase.co/**', route => {
      const url = new URL(route.request().url());
      let json = [];
      if (url.pathname.endsWith('/profiles')) {
        const profile = { id: owner, full_name: 'Synthetic Admin', role: 'admin', user_type: 'general_user' };
        json = url.searchParams.has('id') ? profile : [profile];
      } else if (url.pathname.endsWith('/auth/v1/user')) json = session.user;
      else if (url.pathname.endsWith('/rpc/get_mvp_catalog_page')) json = { products: [], total: 0, facets: {} };
      else if (url.pathname.endsWith('/rpc/get_mvp_supplier_window')) json = supplier;
      else if (url.pathname.endsWith('/rpc/search_mvp_supplier_windows')) json = [supplier];
      return route.fulfill({ json, headers: { 'content-range': `0-0/${Array.isArray(json) ? json.length : 1}` } });
    });
    await page.goto(path);
    await expect(page.locator('h1').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    expect(errors).toEqual([]);
    // Native animations are disabled by screenshot; framer's entry animation
    // must also have settled before recording geometry.
    await expect(page.locator('h1').first()).toHaveCSS('opacity', '1');
    if (interaction === '3d') {
      await page.getByRole('button', { name: language === 'ar' ? 'عرض 3D تفاعلي' : 'View interactive 3D', exact: true }).first().click();
      await expect(page.locator('[data-renderer="webgl"][data-ready="true"]')).toBeVisible();
      await expect(page.getByRole('button', { name: language === 'ar' ? 'استئناف الدوران' : 'Resume rotation', exact: true })).toBeVisible();
    }
    if (interaction === 'editor') {
      await page.getByRole('button', { name: language === 'ar' ? 'إنشاء بلوك' : 'Create block', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByLabel('Product name (English)').focus();
    }
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      elements: [...document.querySelectorAll('h1,h2,button,input,select,.btn-primary,.card')].filter(el => el.getBoundingClientRect().width > 0).slice(0, 100).map(el => {
        const s = getComputedStyle(el), r = el.getBoundingClientRect();
        return { tag: el.tagName, text: el.textContent.slice(0, 60), x: r.x, y: r.y, width: r.width, height: r.height, padding: s.padding, margin: s.margin, color: s.color, background: s.backgroundColor, font: s.fontFamily, fontSize: s.fontSize, border: s.border, radius: s.borderRadius, shadow: s.boxShadow };
      }),
    }));
    await fs.writeFile(info.outputPath(`${name}.json`), JSON.stringify(metrics, null, 2));
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: !interaction, animations: 'disabled', maxDiffPixelRatio: 0.002 });
    await page.screenshot({ path: info.outputPath(`${name}-verified.png`), fullPage: !interaction, animations: 'disabled' });
  });
  }
}
