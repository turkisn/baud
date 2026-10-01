import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Box3, Vector3 } from 'three';
import { getProduct3DAsset, WALL_M_PREVIEW } from '../src/data/product3dAssets.js';
import { loadProductPreview } from '../src/utils/loadProductPreview.js';
import { disposeProductScene } from '../src/utils/productScene.js';

const glb = await readFile(new URL('../public/open-bim/skylark250/WALL-M.glb', import.meta.url));

test('real preview is bound to the reviewed product ID and slug, never arbitrary URLs', async () => {
  assert.equal(getProduct3DAsset({ id: WALL_M_PREVIEW.productId, slug: WALL_M_PREVIEW.slug }), WALL_M_PREVIEW);
  assert.equal(getProduct3DAsset({ slug: WALL_M_PREVIEW.slug }), null);
  assert.equal(getProduct3DAsset({ id: WALL_M_PREVIEW.productId, slug: 'another-product' }), null);
  assert.equal(getProduct3DAsset(null), null);
  await assert.rejects(loadProductPreview({ ...WALL_M_PREVIEW }), /Unreviewed/);
});

test('verified IFC-derived GLB preserves dimensions, triangles and floor placement', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, WALL_M_PREVIEW.url);
    assert.equal(options.credentials, 'same-origin');
    return new Response(glb);
  });
  const product = await loadProductPreview(WALL_M_PREVIEW);
  try {
    const bounds = new Box3().setFromObject(product);
    const dimensions = bounds.getSize(new Vector3());
    assert.ok(Math.abs(dimensions.x - .6) < 1e-5);
    assert.ok(Math.abs(dimensions.y - 2.4) < 1e-5);
    assert.ok(Math.abs(dimensions.z - .318) < 1e-5);
    assert.ok(Math.abs(bounds.min.y) < 1e-6);
    let triangles = 0;
    product.traverse(object => {
      if (!object.isMesh) return;
      assert.ok(object.geometry.attributes.position.array.every(Number.isFinite));
      triangles += object.geometry.index.count / 3;
    });
    assert.equal(triangles, 22455);
  } finally { disposeProductScene(product); }
});

for (const [name, body, status, message] of [
  ['HTTP failure', '', 404, /download failed/],
  ['truncated data', glb.subarray(0, 64), 200, /Incomplete/],
  ['oversized data', new Uint8Array(WALL_M_PREVIEW.bytes + 1), 200, /Oversized/],
  ['tampered data', new Uint8Array(WALL_M_PREVIEW.bytes), 200, /integrity/],
]) {
  test(`preview rejects ${name}`, async t => {
    t.mock.method(globalThis, 'fetch', async () => new Response(body, { status }));
    await assert.rejects(loadProductPreview(WALL_M_PREVIEW), message);
  });
}

test('closing the viewer aborts its pending asset request', async t => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (_, { signal }) => {
    controller.abort();
    assert.equal(signal.aborted, true);
    signal.throwIfAborted();
  });
  await assert.rejects(loadProductPreview(WALL_M_PREVIEW, controller.signal), { name: 'AbortError' });
});

test('the distributed preview is self-contained and accompanied by rights notices', async () => {
  const document = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
  assert.ok(document.buffers.every(buffer => !buffer.uri));
  assert.ok(!document.images?.length);
  for (const name of ['ATTRIBUTION.txt', 'LICENSE-CC-BY-SA-4.0.txt', 'NOTICES.upstream.md']) {
    assert.ok((await readFile(new URL(`../public/open-bim/skylark250/${name}`, import.meta.url), 'utf8')).length > 100);
  }
});

test('public materials query sorts only by a publicly readable column', async () => {
  const service = await readFile(new URL('../src/services/mvpService.js', import.meta.url), 'utf8');
  assert.match(service, /from\('product_materials'\)\.select\(PUBLIC_MATERIAL_FIELDS\)\s*\.eq\('product_id', id\)\.order\('id'\)/);
});
