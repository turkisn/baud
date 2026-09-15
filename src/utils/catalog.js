// The RPC caps each response at 100 rows. Collect pages before ranking or
// applying client-side facets so later products are not silently excluded.
export async function collectPages(fetchPage, pageSize = 100) {
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error('Invalid page size.');
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await fetchPage({ limit: pageSize, offset });
    if (!Array.isArray(page)) throw new Error('Unexpected catalog response.');
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export function filterCatalogProducts(products, { city = '', material = '', color = '', dimension = '' }, suppliers = []) {
  const cities = new Map(suppliers.map((supplier) => [supplier.id, supplier.city]));
  return products.filter((product) => {
    if (city && cities.get(product.supplier_id) !== city) return false;
    const materials = product.product_materials || [];
    const specifications = product.product_specifications || [];
    if (material && ![
      ...materials.flatMap((item) => [item.material_name_ar, item.material_name_en]),
      ...specifications.filter((item) => /material|ماد/i.test(`${item.specification_name_en} ${item.specification_name_ar}`)).map((item) => item.value),
    ].includes(material)) return false;
    if (color && ![
      ...materials.map((item) => item.color),
      ...specifications.filter((item) => /color|colour|finish|لون|تشطيب/i.test(`${item.specification_name_en} ${item.specification_name_ar}`)).map((item) => item.value),
    ].includes(color)) return false;
    if (dimension && !specifications
      .filter((item) => /dimension|width|height|depth|length|diameter|الأبعاد|الارتفاع|الطول|العرض/i.test(`${item.specification_name_en} ${item.specification_name_ar}`))
      .some((item) => [item.value, item.unit].filter(Boolean).join(' ') === dimension)) return false;
    return true;
  });
}
