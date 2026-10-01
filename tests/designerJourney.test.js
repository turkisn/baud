import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setImmediate } from 'node:timers';
import { safeDownloadName } from '../src/utils/download.js';
import { productImage } from '../src/utils/productImage.js';
import { WALL_M_PREVIEW } from '../src/data/product3dAssets.js';
import { createProductResolver } from '../src/utils/productResolver.js';

test('download names preserve original names without paths or control characters', () => {
  assert.equal(safeDownloadName('../folder/مخطط.pdf'), 'مخطط.pdf');
  assert.equal(safeDownloadName('C:\\files\\wall.ifc'), 'wall.ifc');
  assert.equal(safeDownloadName('wall\n\r.ifc'), 'wall.ifc');
  assert.equal(safeDownloadName(null), 'buod-product-file');
  assert.equal(safeDownloadName('..'), 'buod-product-file');
});

test('real render is bound to both reviewed product identity fields', async () => {
  const product = { id: WALL_M_PREVIEW.productId, slug: WALL_M_PREVIEW.slug, signed_image_url: 'old.png' };
  assert.equal(productImage(product), WALL_M_PREVIEW.imageUrl);
  assert.equal(productImage({ ...product, id: 'another-id' }), 'old.png');
  assert.equal(productImage(null), null);
  const jpeg = await readFile(new URL(`../public${WALL_M_PREVIEW.imageUrl}`, import.meta.url));
  assert.equal(jpeg.subarray(0, 3).toString('hex'), 'ffd8ff');
  assert.ok(jpeg.length > 10_000);
});

test('saved products deduplicate requests and refresh after cache expiry', async () => {
  let calls = 0, time = 0;
  const resolve = createProductResolver(async slug => ({ id: 'p', slug, version: ++calls }), { ttl: 100, now: () => time });
  const p = { id: 'p', slug: 'wall' };
  const [a, b] = await Promise.all([resolve(p), resolve(p)]);
  assert.equal(a, b);
  assert.equal(calls, 1);
  assert.equal((await resolve(p)).version, 1);
  time = 101;
  assert.equal((await resolve(p)).version, 2);
});

test('saved product loader caps concurrent requests and rejects identity changes', async () => {
  let active = 0, max = 0;
  const resolve = createProductResolver(async slug => {
    max = Math.max(max, ++active);
    await new Promise(done => setImmediate(done));
    active--;
    return { id: slug, slug };
  }, { concurrency: 2 });
  await Promise.all(Array.from({ length: 10 }, (_, i) => resolve({ id: String(i), slug: String(i) })));
  assert.equal(max, 2);
  assert.equal(await resolve({ id: 'old-owner', slug: 'reassigned' }), null);
});

test('failed saved product fetches can be retried', async () => {
  let calls = 0;
  const resolve = createProductResolver(async () => { if (++calls === 1) throw new Error('Offline'); return { id: 'p' }; });
  const p = { id: 'p', slug: 'wall' };
  await assert.rejects(resolve(p), /Offline/);
  await new Promise(done => setImmediate(done));
  assert.equal((await resolve(p)).id, 'p');
});
