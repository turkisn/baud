import test from 'node:test';
import assert from 'node:assert/strict';
import { collectPages, filterCatalogProducts } from '../src/utils/catalog.js';

for (const count of [0, 24, 100, 200, 205]) {
  test(`collects all ${count} catalog records across RPC pages`, async () => {
    const records = Array.from({ length: count }, (_, id) => ({ id }));
    const calls = [];
    const actual = await collectPages(async ({ limit, offset }) => {
      calls.push(offset);
      return records.slice(offset, offset + limit);
    });
    assert.deepEqual(actual, records);
    assert.equal(calls.length, Math.floor(count / 100) + 1);
  });
}

test('does not return partial results when a later page fails', async () => {
  await assert.rejects(collectPages(async ({ offset }) => {
    if (offset) throw new Error('Request failed');
    return Array(100).fill({ id: 1 });
  }), /Request failed/);
});

test('rejects malformed catalog responses and page sizes', async () => {
  await assert.rejects(collectPages(async () => null), /Unexpected/);
  await assert.rejects(collectPages(async () => [], 0), /Invalid/);
});

test('facets find matching products beyond the first visible page', () => {
  const products = Array.from({ length: 30 }, (_, id) => ({
    id,
    supplier_id: id === 29 ? 'late-supplier' : 'early-supplier',
    product_materials: [{ material_name_en: id === 29 ? 'Stone' : 'Wood', color: 'Black' }],
    product_specifications: [{ specification_name_en: 'Width', value: '60', unit: 'cm' }],
  }));
  const suppliers = [{ id: 'late-supplier', city: 'Riyadh' }];
  const result = filterCatalogProducts(products, { city: 'Riyadh', material: 'Stone', color: 'Black', dimension: '60 cm' }, suppliers).slice(0, 24);
  assert.deepEqual(result.map(({ id }) => id), [29]);
});

test('facets do not match unrelated specification values', () => {
  const products = [{ id: 'one', product_specifications: [{ specification_name_en: 'Reference', value: 'Wood' }] }];
  assert.deepEqual(filterCatalogProducts(products, { material: 'Wood' }), []);
  assert.deepEqual(filterCatalogProducts(products, { color: 'Wood' }), []);
  assert.deepEqual(filterCatalogProducts(products, { dimension: 'Wood' }), []);
});

test('empty facets preserve products without optional details', () => {
  const products = [{ id: 'one' }];
  assert.deepEqual(filterCatalogProducts(products, {}), products);
});
