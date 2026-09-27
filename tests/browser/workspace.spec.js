import { test, expect } from '@playwright/test';
import { loadEnv } from 'vite';
import process from 'node:process';

// This suite mocks HTTP contracts, not database security; SQL tests cover real RLS.
const owner = '11111111-1111-4111-8111-111111111111';
const fixtureUrl = process.env.BUOD_BROWSER_FIXTURES === '1' ? 'https://workspace-fixture.supabase.co'
  : loadEnv('development', process.cwd(), 'VITE_').VITE_SUPABASE_URL;
const authKey = `sb-${new URL(fixtureUrl).hostname.split('.')[0]}-auth-token`;
const item = (id, name = id) => ({ id, name, products: [], createdAt: '2026-09-28T00:00:00Z' });

async function workspace(page, { signedIn = true, initial = null, language = 'en' } = {}) {
  let row = initial;
  let fail = false;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ authKey, owner, signedIn, language }) => {
    localStorage.setItem('buod_language', language);
    if (signedIn) localStorage.setItem(authKey, JSON.stringify({
      access_token: 'fixture-token', refresh_token: 'fixture-refresh-token', token_type: 'bearer',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: owner, email: 'fixture@example.invalid', role: 'authenticated', aud: 'authenticated', user_metadata: {} },
    }));
  }, { authKey, owner, signedIn, language });
  await page.route('https://*.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    const respond = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (url.pathname.endsWith('/profiles')) return respond({ id: owner, full_name: 'Fixture User', role: 'user' });
    if (url.pathname.endsWith('/user_workspaces')) return respond(row ? [row] : []);
    if (url.pathname.endsWith('/rpc/save_my_workspace')) {
      if (fail) return respond({ message: 'Temporary fixture outage' }, 503);
      const body = route.request().postDataJSON();
      if (row?.last_mutation_id === body.p_mutation_id) return respond(row);
      if ((row?.revision || 0) !== body.p_expected_revision) return respond({ code: 'PT409', message: 'Conflict' }, 409);
      row = { owner_id: owner, projects: body.p_projects, revision: (row?.revision || 0) + 1, last_mutation_id: body.p_mutation_id };
      return respond(row);
    }
    return respond([]);
  });
  await page.goto('/projects');
  return { getRow: () => row, setRow: value => { row = value; }, fail: value => { fail = value; }, errors };
}

test('account projects save, survive reload and can be exported', async ({ page }) => {
  const state = await workspace(page);
  await expect(page.getByTestId('workspace-sync-status')).toContainText('synced');
  await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('Enterprise test');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByTestId('workspace-sync-status')).toContainText('synced');
  expect(state.getRow().projects[0].name).toBe('Enterprise test');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Enterprise test', exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export project backup' }).click();
  expect((await download).suggestedFilename()).toBe('buod-projects.json');
  expect(state.errors).toEqual([]);
});

test('failed saves remain visible and retry without losing the draft', async ({ page }) => {
  const state = await workspace(page);
  await expect(page.getByTestId('workspace-sync-status')).toContainText('synced');
  state.fail(true);
  await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('Offline draft');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByTestId('workspace-sync-status')).toContainText('Cloud sync failed');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Offline draft', exact: true })).toBeVisible();
  await expect(page.getByTestId('workspace-sync-status')).toContainText('Cloud sync failed');
  state.fail(false);
  await page.getByRole('button', { name: 'Retry sync' }).click();
  await expect(page.getByTestId('workspace-sync-status')).toContainText('synced');
  expect(state.getRow().projects[0].name).toBe('Offline draft');
});

test('concurrent cloud edits show a conflict and preserve both copies', async ({ page }) => {
  const state = await workspace(page);
  await expect(page.getByTestId('workspace-sync-status')).toContainText('synced');
  state.setRow({ owner_id: owner, revision: 1, last_mutation_id: 'other', projects: [item('remote', 'Other device')] });
  await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('Local edit');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByTestId('workspace-sync-status')).toContainText('Another device');
  await expect(page.getByRole('button', { name: 'Create project', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Keep both copies' }).click();
  await expect(page.getByTestId('workspace-sync-status')).toContainText('synced');
  await expect(page.getByRole('heading', { name: 'Other device', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Local edit (copy)', exact: true })).toBeVisible();
  expect(state.getRow().projects.length).toBe(2);
});

test('guest projects stay local and deleting a project requires confirmation', async ({ page }) => {
  const state = await workspace(page, { signedIn: false });
  await expect(page.getByTestId('workspace-sync-status')).toContainText('browser only');
  await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('Guest project');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Guest project', exact: true })).toBeVisible();
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Delete project', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Guest project', exact: true })).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete project', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Guest project', exact: true })).toHaveCount(0);
  expect(state.getRow()).toBe(null);
});

test('choosing cloud requires confirmation and keeps an exportable conflict backup', async ({ page }) => {
  const state = await workspace(page);
  await expect(page.getByTestId('workspace-sync-status')).toContainText('synced');
  state.setRow({ owner_id: owner, revision: 1, last_mutation_id: 'other', projects: [item('remote', 'Cloud selection')] });
  await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('Draft to preserve');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByTestId('workspace-sync-status')).toContainText('Another device');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Use cloud version' }).click();
  await expect(page.getByRole('heading', { name: 'Draft to preserve', exact: true })).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Use cloud version' }).click();
  await expect(page.getByRole('heading', { name: 'Cloud selection', exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export previous conflict draft' }).click();
  expect((await download).suggestedFilename()).toBe('buod-conflict-backup.json');
  expect(state.getRow().revision).toBe(1);
});

test('Arabic mobile projects have usable controls and no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await workspace(page, { signedIn: false, language: 'ar' });
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.getByRole('textbox', { name: 'اسم المشروع', exact: true }).fill('مشروع تجريبي');
  await page.getByRole('button', { name: 'إنشاء مشروع', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'مشروع تجريبي', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: 'test-results/workspace-mobile-ar.png', fullPage: true });
});
