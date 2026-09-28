// Explicitly invoked by live-staging-accounts.js; disposable identities only.
import assert from 'node:assert/strict';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { createInterface } from 'node:readline/promises';
import { chromium, expect } from '@playwright/test';

const base = 'https://baud-git-staging-baud1.vercel.app';
const ref = 'uhcvfwajowdszxteanlx';
async function checkpoint(message) {
  const input = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await input.question(`${message}\nType continue after scoped setup: `, { signal: AbortSignal.timeout(300000) });
    assert.equal(answer.trim(), 'continue');
  } finally { input.close(); }
}

export async function runBrowserAcceptance({ a, b, admin, client, fixture, ok, step, run }) {
  const secretInput = createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  let accessUrl;
  try { accessUrl = await secretInput.question('Temporary preview URL (kept in memory): '); } finally { secretInput.close(); }
  assert.equal(new URL(accessUrl).origin, base);
  const browser = await chromium.launch(process.platform === 'darwin' ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' } : {});
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('buod_language', 'en'));
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.name));
  const objects = [];
  let manager;
  let product;
  let supplier;
  async function login(targetPage, user) {
    await targetPage.goto(`${base}/login`);
    await targetPage.locator('#email').fill(user.email);
    await targetPage.locator('#password').fill(user.password);
    await targetPage.locator('form').getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(targetPage.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible({ timeout: 30000 });
  }
  try {
    await step('deployed browser renders and authenticates against staging', async () => {
      const response = await page.goto(accessUrl);
      assert.equal(response.status(), 200);
      assert.equal(new URL(page.url()).origin, base, 'Preview access was not established');
      await expect(page.locator('main')).toBeVisible();
      assert.ok((await page.locator('body').innerText()).length > 100);
      await page.screenshot({ path: 'test-results/live-staging-home.png', fullPage: true });
      const [authResponse] = await Promise.all([
        page.waitForResponse(response => response.url().startsWith(`https://${ref}.supabase.co/auth/v1/token`)),
        login(page, a),
      ]);
      assert.equal(authResponse.status(), 200);
    });
    await step('browser cloud save survives reload and isolated account switch', async () => {
      await page.goto(`${base}/projects`);
      await expect(page.getByRole('heading', { name: 'QA API workspace', exact: true })).toBeVisible();
      await page.getByRole('textbox', { name: 'Project name', exact: true }).fill('QA browser workspace');
      await page.getByRole('button', { name: 'Create project', exact: true }).click();
      await expect(page.getByTestId('workspace-sync-status')).toContainText('synced');
      assert.equal(ok(await a.client.from('user_workspaces').select('projects').eq('owner_id', a.id).single()).projects.length, 2);
      await page.reload();
      await expect(page.getByRole('heading', { name: 'QA browser workspace', exact: true })).toBeVisible();
      await page.screenshot({ path: 'test-results/live-staging-workspace.png', fullPage: true });
      await page.getByRole('button', { name: 'Sign out', exact: true }).click();
      await expect(page).toHaveURL(`${base}/`);
      await page.goto(`${base}/projects`);
      await expect(page.getByTestId('workspace-sync-status')).toContainText('browser only');
      await login(page, b);
      await page.goto(`${base}/projects`);
      await expect(page.getByTestId('workspace-sync-status')).toContainText('synced');
      await expect(page.getByRole('heading', { name: 'QA browser workspace', exact: true })).toHaveCount(0);
      await page.getByRole('button', { name: 'Sign out', exact: true }).click();
      await login(page, a);
      await page.goto(`${base}/projects`);
      await expect(page.getByRole('heading', { name: 'QA browser workspace', exact: true })).toBeVisible();
      await page.goto(`${base}/admin/products`);
      await expect(page).toHaveURL(`${base}/`);
    });
    await step('real disposable recovery link reaches the password form', async () => {
      const recovery = ok(await admin.auth.admin.generateLink({ type: 'recovery', email: b.email, options: { redirectTo: `${base}/reset-password` } }));
      const isolated = await browser.newContext();
      await isolated.addInitScript(() => localStorage.setItem('buod_language', 'en'));
      const recoveryPage = await isolated.newPage();
      await recoveryPage.goto(accessUrl);
      // Never print or persist the one-use link, access tokens or new password.
      await recoveryPage.goto(recovery.properties.action_link);
      await expect(recoveryPage.locator('#new-password')).toBeVisible({ timeout: 30000 });
      await expect(recoveryPage.getByRole('button', { name: 'Update password', exact: true })).toBeVisible();
      // Final credential entry/submission is a user handoff, not automated UI work.
      await recoveryPage.screenshot({ path: 'test-results/live-staging-recovery.png', fullPage: true });
      await isolated.close();
    });
    await step('provision isolated manager without changing grants or real accounts', async () => {
      manager = await fixture('manager');
      await checkpoint(`MANAGER_SETUP ${manager.id} ${manager.email}`);
      ok(await manager.client.auth.signInWithPassword({ email: manager.email, password: manager.password }));
      assert.equal(ok(await manager.client.from('profiles').select('role').eq('id', manager.id).single()).role, 'admin');
    });
    const body = Buffer.from('# Synthetic QA triangle\no QA\nv 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n');
    let filePath;
    let managerPage;
    await step('manager uploads a private OBJ using the actual admin UI', async () => {
      supplier = ok(await manager.client.rpc('admin_save_mvp_supplier', { p_supplier_id: null, p_payload: { company_name_en: `QA ${run}`, company_name_ar: 'مورد اختبار مؤقت', slug: `qa-${run}`, is_published: true } }));
      console.log(`FIXTURE supplier ${supplier.id}`);
      const category = ok(await manager.client.from('categories').select('id').eq('is_active', true).limit(1).single());
      product = ok(await manager.client.rpc('admin_save_mvp_product', { p_product_id: null, p_payload: { product_name_en: `QA ${run}`, product_name_ar: 'منتج اختبار مؤقت', slug: `qa-${run}`, supplier_id: supplier.id, category_id: category.id, publication_state: 'draft', rights_confirmed: true } }));
      console.log(`FIXTURE product ${product.id}`);
      const managerContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      await managerContext.addInitScript(() => localStorage.setItem('buod_language', 'en'));
      managerPage = await managerContext.newPage();
      await managerPage.goto(accessUrl);
      managerPage.setDefaultTimeout(20000);
      await login(managerPage, manager);
      await managerPage.goto(`${base}/admin/products`);
      await managerPage.getByRole('textbox', { name: 'Search blocks', exact: true }).fill(`qa-${run}`);
      await managerPage.getByRole('row').filter({ hasText: `QA ${run}` }).getByRole('button', { name: /Edit/ }).click();
      const form = managerPage.getByRole('form', { name: 'Upload a product file', exact: true });
      await form.getByLabel('Choose a product file', { exact: true }).setInputFiles({ name: 'qa.obj', mimeType: 'application/octet-stream', buffer: body });
      const [uploaded] = await Promise.all([
        managerPage.waitForResponse(r => r.url().includes('/storage/v1/object/product-files/') && r.request().method() === 'POST'),
        form.getByRole('button', { name: 'Upload file', exact: true }).click(),
      ]);
      const uploadPath = decodeURIComponent(new URL(uploaded.url()).pathname.split('/object/product-files/')[1]);
      objects.push({ bucket: 'product-files', path: uploadPath });
      assert.equal(uploaded.status(), 200);
      await expect(managerPage.getByText('File uploaded and registered.', { exact: true })).toBeVisible();
      const file = ok(await manager.client.from('product_files').select('file_path,file_size').eq('product_id', product.id).single());
      filePath = file.file_path;
      assert.equal(file.file_size, body.length);
      await managerPage.screenshot({ path: 'test-results/live-staging-admin-upload.png', fullPage: true });
    });
    await step('private draft and unsigned access are denied', async () => {
      assert.ok((await a.client.storage.from('product-files').createSignedUrl(filePath, 60)).error);
      assert.ok((await client().storage.from('product-files').createSignedUrl(filePath, 60)).error);
      assert.equal(ok(await client().from('products').select('id').eq('id', product.id)).length, 0);
      const denied = await b.client.storage.from('product-files').upload(`${product.id}/unauthorized.obj`, body, { contentType: 'application/octet-stream' });
      if (!denied.error) objects.push({ bucket: 'product-files', path: `${product.id}/unauthorized.obj` });
      assert.ok(denied.error);
    });
    await step('UI publish and authorized browser download preserve exact bytes', async () => {
      await managerPage.getByRole('button', { name: 'Publish', exact: true }).click();
      await expect.poll(async () => ok(await client().from('products').select('id').eq('id', product.id)).length).toBe(1);
      await page.goto(`${base}/blocks/${product.slug}`);
      await expect(page.getByRole('heading', { name: `QA ${run}`, exact: true })).toBeVisible();
      const [downloaded] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Download', exact: true }).click(),
      ]);
      const stream = await downloaded.createReadStream();
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      assert.deepEqual(Buffer.concat(chunks), body);
      assert.ok((await client().storage.from('product-files').createSignedUrl(filePath, 60)).error);
    });
    await step('archiving stops new links and ordinary users cannot publish', async () => {
      await managerPage.getByRole('button', { name: 'Archive', exact: true }).click();
      await expect.poll(async () => ok(await client().from('products').select('id').eq('id', product.id)).length).toBe(0);
      assert.ok((await a.client.storage.from('product-files').createSignedUrl(filePath, 60)).error);
      assert.ok((await a.client.rpc('admin_save_mvp_product', { p_product_id: product.id, p_payload: { publication_state: 'published' } })).error);
      assert.deepEqual(errors, []);
    });
  } catch (error) {
    await page.screenshot({ path: 'test-results/live-staging-failure.png', fullPage: true }).catch(() => {});
    let detail = String(error.message || error.name);
    for (const user of [a, b, manager].filter(Boolean)) detail = detail.replaceAll(user.password, '[redacted]').replaceAll(user.email, '[test account]');
    detail = detail.replace(/https?:\/\/\S+/g, '[URL]');
    console.log(JSON.stringify({ browserFailure: detail.slice(0, 1100) }));
    throw error;
  } finally {
    // Remove only this run's generated assets while the fixture manager is still signed in.
    const failures = [];
    for (const object of objects) {
      try { ok(await manager.client.storage.from(object.bucket).remove([object.path])); } catch { failures.push(`object ${object.path}`); }
    }
    if (product) { try { ok(await manager.client.from('products').delete().eq('id', product.id)); } catch { failures.push(`product ${product.id}`); } }
    if (supplier) { try { ok(await manager.client.from('suppliers').delete().eq('id', supplier.id)); } catch { failures.push(`supplier ${supplier.id}`); } }
    await browser.close();
    console.log(JSON.stringify({ resourceCleanup: failures.length ? 'INCOMPLETE' : 'complete', failures }));
    if (failures.length) process.exitCode = 1;
  }
}
