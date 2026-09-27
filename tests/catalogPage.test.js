import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogFacets, mergeCatalogFacets, planCatalogPage } from '../src/utils/catalogPage.js';

const products = Array.from({ length: 40 }, (_, id) => ({ id, supplier_id: id % 2 ? 'a' : 'b' }));
test('catalog pages cross local and remote boundaries without repeats or gaps', () => {
  const first = planCatalogPage(products);
  assert.equal(first.products.length, 24); assert.equal(first.remoteLimit, 0);
  const second = planCatalogPage(products, { offset: 24 });
  assert.deepEqual(second.products.map(p => p.id), Array.from({ length: 16 }, (_, i) => i + 24));
  assert.equal(second.remoteLimit, 8); assert.equal(second.remoteOffset, 0);
  const third = planCatalogPage(products, { offset: 48 });
  assert.equal(third.products.length, 0); assert.equal(third.remoteOffset, 8); assert.equal(third.remoteLimit, 24);
});
test('local city filtering happens before computing the remote offset', () => {
  const page = planCatalogPage(products, { offset: 24, facets: { city: 'Riyadh' }, suppliers: [{ id: 'a', city: 'Riyadh' }] });
  assert.equal(page.localTotal, 20); assert.equal(page.remoteOffset, 4);
});
test('empty catalogs and invalid pages are handled explicitly', () => {
  assert.equal(planCatalogPage([]).remoteLimit, 24);
  for (const options of [{ offset: -1 }, { limit: Infinity }, { limit: 101 }, { offset: .5 }]) assert.throws(() => planCatalogPage([], options));
});
test('facet options retain both languages, exclude unrelated specifications, and deduplicate', () => {
  const facets = catalogFacets([{ product_materials: [{ material_name_en: 'Copper', material_name_ar: 'نحاس', color: 'Gold' }], product_specifications: [
    { specification_name_en: 'Power', value: '3000' },
    { specification_name_en: 'Dimensions', value: '20 × 30', unit: 'mm' },
  ] }]);
  assert.deepEqual(facets.color, ['Gold']);
  assert.deepEqual(facets.dimension, ['20 × 30 mm']);
  assert.equal(mergeCatalogFacets(facets, { material: ['Copper', 'Stone'] }).material.length, 3);
});
