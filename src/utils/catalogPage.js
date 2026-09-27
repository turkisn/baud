import { filterCatalogProducts } from './catalog.js';

export function catalogFacets(products) {
  const facets = { material: new Set(), color: new Set(), dimension: new Set() };
  for (const product of products) {
    for (const item of product.product_materials || []) {
      facets.material.add(item.material_name_ar); facets.material.add(item.material_name_en);
      facets.color.add(item.color);
    }
    for (const item of product.product_specifications || []) {
      const name = `${item.specification_name_en} ${item.specification_name_ar}`;
      if (/material|ماد/i.test(name)) facets.material.add(item.value);
      if (/color|colour|finish|لون|تشطيب/i.test(name)) facets.color.add(item.value);
      if (/dimension|width|height|depth|length|diameter|الأبعاد|الارتفاع|الطول|العرض/i.test(name)) facets.dimension.add([item.value, item.unit].filter(Boolean).join(' '));
    }
  }
  return Object.fromEntries(Object.entries(facets).map(([key, values]) => [key, [...values].filter(Boolean).sort()]));
}

// Local demonstration products form a stable prefix. Only the remote part of
// the requested page is fetched; filters run before either source is sliced.
export function planCatalogPage(localProducts, { offset = 0, limit = 24, facets = {}, suppliers = [] } = {}) {
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Invalid catalog page.');
  const matching = filterCatalogProducts(localProducts, facets, suppliers);
  const products = matching.slice(offset, offset + limit);
  return { products, localTotal: matching.length, remoteOffset: Math.max(0, offset - matching.length), remoteLimit: limit - products.length };
}

export function mergeCatalogFacets(...sources) {
  return Object.fromEntries(['material', 'color', 'dimension'].map(key => [key,
    [...new Set(sources.flatMap(source => source?.[key] || []).filter(value => typeof value === 'string' && value))].sort(),
  ]));
}
