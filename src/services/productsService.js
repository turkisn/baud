// Products service — localStorage backend
// When Supabase is connected, swap this layer with Supabase queries.
// All functions return Promises to mirror async API behavior.

import { CATEGORIES, SUBCATEGORIES } from '../data/categoriesData';

const KEY = 'buad_products';
const CTR = 'buad_ref_counters';

// ─── Helpers ──────────────────────────────────────────────────

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}
function nextRef(catId, subId) {
  const catCode = catId || 'GEN';
  const subCode = subId || 'GEN';
  const key = `${catCode}-${subCode}`;
  let counters = {};
  try { counters = JSON.parse(localStorage.getItem(CTR) || '{}'); } catch {}
  const n = (counters[key] || 0) + 1;
  counters[key] = n;
  localStorage.setItem(CTR, JSON.stringify(counters));
  return `BUOD-${catCode}-${subCode}-${String(n).padStart(6, '0')}`;
}
function uid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Seed 8 demo products ─────────────────────────────────────

export function seedDemoProducts(userId = 'u-supplier') {
  if (localStorage.getItem('buad_seeded')) return;

  const demos = [
    {
      id: uid(), buod_reference: 'BUOD-FUR-SOF-000001',
      product_name_ar: 'كنبة ريكلاينر ثلاثية المقاعد',
      product_name_en: 'Three-Seat Recliner Sofa',
      short_description_ar: 'كنبة فاخرة بثلاثة مقاعد قابلة للإمالة، مناسبة للمجالس العصرية.',
      short_description_en: 'Luxury three-seat recliner sofa suitable for modern living rooms.',
      category_id: 'FUR', subcategory_id: 'SOF', product_type: 'Seating',
      brand_name: 'Al-Raaha Furniture', model_number: 'RC-3001', country_of_origin: 'Saudi Arabia',
      status: 'approved', verification_status: 'verified', visibility: 'public',
      is_free: true, unit: 'PC', featured_image: null,
      materials: [
        { material_name_en: 'Fabric', quantity_per_product: 6, unit: 'M2', waste_percentage: 10 },
        { material_name_en: 'Foam', quantity_per_product: 0.8, unit: 'M3', waste_percentage: 5 },
        { material_name_en: 'Timber Frame', quantity_per_product: 0.12, unit: 'M3', waste_percentage: 8 },
      ],
      specifications: [
        { specification_name_en: 'Width', value: '220', unit: 'cm' },
        { specification_name_en: 'Depth', value: '95', unit: 'cm' },
        { specification_name_en: 'Height', value: '100', unit: 'cm' },
        { specification_name_en: 'Color', value: 'Beige' },
        { specification_name_en: 'Material', value: 'Velvet Fabric' },
      ],
      files: [{ software_name: 'Autodesk Revit', file_format: 'RFA', file_name_original: 'recliner_sofa_3seat.rfa', file_size: 2400000, is_primary: true }],
      created_by: userId, created_at: '2025-01-10', view_count: 1240, download_count: 87,
    },
    {
      id: uid(), buod_reference: 'BUOD-OFF-OCH-000001',
      product_name_ar: 'كرسي مكتبي إرجونومي',
      product_name_en: 'Ergonomic Office Chair',
      short_description_ar: 'كرسي مكتبي بتصميم إرجونومي مع دعم قطني قابل للتعديل.',
      short_description_en: 'Ergonomic office chair with adjustable lumbar support.',
      category_id: 'OFF', subcategory_id: 'OCH', product_type: 'Seating',
      brand_name: 'ErgoWork', model_number: 'EW-500', country_of_origin: 'China',
      status: 'approved', verification_status: 'verified', visibility: 'public',
      is_free: true, unit: 'PC', featured_image: null,
      materials: [
        { material_name_en: 'Mesh Fabric', quantity_per_product: 1.2, unit: 'M2', waste_percentage: 5 },
        { material_name_en: 'Steel Frame', quantity_per_product: 4.5, unit: 'KG', waste_percentage: 2 },
        { material_name_en: 'Nylon Base', quantity_per_product: 0.8, unit: 'KG', waste_percentage: 0 },
      ],
      specifications: [
        { specification_name_en: 'Seat Width', value: '52', unit: 'cm' },
        { specification_name_en: 'Seat Depth', value: '48', unit: 'cm' },
        { specification_name_en: 'Max Height', value: '120', unit: 'cm' },
        { specification_name_en: 'Weight Capacity', value: '150', unit: 'kg' },
        { specification_name_en: 'Color', value: 'Black' },
      ],
      files: [{ software_name: 'Autodesk Revit', file_format: 'RFA', file_name_original: 'office_chair_ergo.rfa', file_size: 1800000, is_primary: true }],
      created_by: userId, created_at: '2025-01-15', view_count: 980, download_count: 64,
    },
    {
      id: uid(), buod_reference: 'BUOD-FUR-TBL-000001',
      product_name_ar: 'طاولة اجتماعات بيضاوية',
      product_name_en: 'Oval Meeting Table',
      short_description_ar: 'طاولة اجتماعات بيضاوية بسطح MDF وأرجل معدنية، تتسع لـ 10 أشخاص.',
      short_description_en: 'Oval meeting table with MDF top and metal legs, seats 10 persons.',
      category_id: 'FUR', subcategory_id: 'TBL', product_type: 'Tables',
      brand_name: 'Office Prime', model_number: 'OP-OVL-10', country_of_origin: 'UAE',
      status: 'approved', verification_status: 'manufacturer_verified', visibility: 'public',
      is_free: false, price: 4500, currency: 'SAR', unit: 'PC', featured_image: null,
      materials: [
        { material_name_en: 'MDF Board', quantity_per_product: 0.4, unit: 'M3', waste_percentage: 10 },
        { material_name_en: 'Steel Legs', quantity_per_product: 18, unit: 'KG', waste_percentage: 3 },
        { material_name_en: 'PVC Edge Band', quantity_per_product: 8, unit: 'M', waste_percentage: 5 },
      ],
      components: [
        { component_name_en: 'Table Top', quantity: 1, unit: 'PC' },
        { component_name_en: 'Metal Leg (set)', quantity: 4, unit: 'PC' },
        { component_name_en: 'Cable Management Box', quantity: 2, unit: 'PC' },
      ],
      specifications: [
        { specification_name_en: 'Length', value: '340', unit: 'cm' },
        { specification_name_en: 'Width', value: '130', unit: 'cm' },
        { specification_name_en: 'Height', value: '75', unit: 'cm' },
        { specification_name_en: 'Finish', value: 'Walnut Veneer' },
      ],
      files: [
        { software_name: 'Autodesk Revit', file_format: 'RFA', file_name_original: 'meeting_table_oval.rfa', file_size: 3200000, is_primary: true },
        { software_name: 'SketchUp', file_format: 'SKP', file_name_original: 'meeting_table_oval.skp', file_size: 2100000, is_primary: false },
      ],
      created_by: userId, created_at: '2025-02-01', view_count: 756, download_count: 42,
    },
    {
      id: uid(), buod_reference: 'BUOD-LGT-PEN-000001',
      product_name_ar: 'ثريا معلقة عصرية',
      product_name_en: 'Modern Pendant Light',
      short_description_ar: 'ثريا معلقة بتصميم عصري مع إضاءة LED دافئة، مناسبة للصالات وغرف الطعام.',
      short_description_en: 'Modern pendant light with warm LED, ideal for living and dining rooms.',
      category_id: 'LGT', subcategory_id: 'PEN', product_type: 'Pendant',
      brand_name: 'Lumina KSA', model_number: 'LM-P240', country_of_origin: 'Saudi Arabia',
      status: 'approved', verification_status: 'verified', visibility: 'public',
      is_free: true, unit: 'PC', featured_image: null,
      specifications: [
        { specification_name_en: 'Wattage', value: '24', unit: 'W' },
        { specification_name_en: 'Color Temperature', value: '3000', unit: 'K' },
        { specification_name_en: 'Lumens', value: '2400', unit: 'lm' },
        { specification_name_en: 'Diameter', value: '40', unit: 'cm' },
        { specification_name_en: 'IP Rating', value: 'IP20' },
      ],
      files: [{ software_name: 'Autodesk Revit', file_format: 'RFA', file_name_original: 'pendant_modern.rfa', file_size: 980000, is_primary: true }],
      created_by: userId, created_at: '2025-02-10', view_count: 1450, download_count: 110,
    },
    {
      id: uid(), buod_reference: 'BUOD-DOR-WOD-000001',
      product_name_ar: 'باب خشبي داخلي مع تأطير',
      product_name_en: 'Interior Wooden Door with Frame',
      short_description_ar: 'باب داخلي بإطار خشبي كامل، تشطيب خشب الجوز، مع إكسسوارات معدنية.',
      short_description_en: 'Interior door with full wood frame, walnut finish, metal hardware.',
      category_id: 'DOR', subcategory_id: 'WOD', product_type: 'Interior Door',
      brand_name: 'Al-Bab Doors', model_number: 'AB-W-210', country_of_origin: 'Saudi Arabia',
      status: 'approved', verification_status: 'supplier_verified', visibility: 'public',
      is_free: false, price: 2800, currency: 'SAR', unit: 'PC', featured_image: null,
      specifications: [
        { specification_name_en: 'Width', value: '90', unit: 'cm' },
        { specification_name_en: 'Height', value: '210', unit: 'cm' },
        { specification_name_en: 'Thickness', value: '4.5', unit: 'cm' },
        { specification_name_en: 'Material', value: 'Solid Walnut' },
        { specification_name_en: 'Acoustic Rating', value: '32', unit: 'dB' },
      ],
      files: [
        { software_name: 'Autodesk Revit', file_format: 'RFA', file_name_original: 'door_wood_interior.rfa', file_size: 2800000, is_primary: true },
        { software_name: 'AutoCAD', file_format: 'DWG', file_name_original: 'door_wood_interior.dwg', file_size: 450000, is_primary: false },
      ],
      created_by: userId, created_at: '2025-02-20', view_count: 620, download_count: 35,
    },
    {
      id: uid(), buod_reference: 'BUOD-FLR-TIL-000001',
      product_name_ar: 'بورسلان تقليد رخام كريمي',
      product_name_en: 'Cream Marble-Effect Porcelain Tile',
      short_description_ar: 'بلاطة بورسلان 120×60 بتأثير رخام كريمي، مناسبة للأرضيات والجدران.',
      short_description_en: '120×60 cm cream marble-effect porcelain tile, suitable for floors and walls.',
      category_id: 'FLR', subcategory_id: 'TIL', product_type: 'Porcelain',
      brand_name: 'SahraTiles', model_number: 'ST-CRM-1260', country_of_origin: 'Spain',
      status: 'approved', verification_status: 'verified', visibility: 'public',
      is_free: true, unit: 'M2', featured_image: null,
      specifications: [
        { specification_name_en: 'Length', value: '120', unit: 'cm' },
        { specification_name_en: 'Width', value: '60', unit: 'cm' },
        { specification_name_en: 'Thickness', value: '0.9', unit: 'cm' },
        { specification_name_en: 'Finish', value: 'Polished' },
        { specification_name_en: 'Slip Resistance', value: 'R10' },
        { specification_name_en: 'Water Absorption', value: '< 0.5%' },
      ],
      files: [{ software_name: 'Autodesk Revit', file_format: 'RFA', file_name_original: 'tile_cream_marble.rfa', file_size: 1200000, is_primary: true }],
      created_by: userId, created_at: '2025-03-01', view_count: 890, download_count: 56,
    },
    {
      id: uid(), buod_reference: 'BUOD-BTH-BSN-000001',
      product_name_ar: 'حوض غسل مزروع في الكاونتر',
      product_name_en: 'Under-Counter Wash Basin',
      short_description_ar: 'حوض سيراميك أبيض يثبت تحت الكاونتر، أبعاد 50×35 سم.',
      short_description_en: 'White ceramic under-counter basin, 50×35 cm.',
      category_id: 'BTH', subcategory_id: 'SAN', product_type: 'Basin',
      brand_name: 'AquaKSA', model_number: 'AQ-UC-50', country_of_origin: 'Saudi Arabia',
      status: 'pending_review', verification_status: 'unverified', visibility: 'private',
      is_free: true, unit: 'PC', featured_image: null,
      specifications: [
        { specification_name_en: 'Width', value: '50', unit: 'cm' },
        { specification_name_en: 'Depth', value: '35', unit: 'cm' },
        { specification_name_en: 'Material', value: 'Ceramic' },
        { specification_name_en: 'Color', value: 'White' },
      ],
      files: [{ software_name: 'Autodesk Revit', file_format: 'RFA', file_name_original: 'basin_undercounter.rfa', file_size: 780000, is_primary: true }],
      created_by: userId, created_at: '2025-03-10', view_count: 0, download_count: 0,
    },
    {
      id: uid(), buod_reference: 'BUOD-OFF-WRK-000001',
      product_name_ar: 'محطة عمل مكتبية لأربعة أشخاص',
      product_name_en: 'Four-Person Office Workstation',
      short_description_ar: 'نظام محطات عمل مكتبية بأربعة مقاعد مع حواجز عازلة وتخزين علوي.',
      short_description_en: 'Four-person office workstation system with privacy screens and overhead storage.',
      category_id: 'OFF', subcategory_id: 'WRK', product_type: 'Workstation',
      brand_name: 'ModSpace', model_number: 'MS-4WS', country_of_origin: 'UAE',
      status: 'draft', verification_status: 'unverified', visibility: 'private',
      is_free: false, price: 12000, currency: 'SAR', unit: 'SET', featured_image: null,
      materials: [
        { material_name_en: 'Steel Frame', quantity_per_product: 45, unit: 'KG', waste_percentage: 3 },
        { material_name_en: 'MDF Panels', quantity_per_product: 1.2, unit: 'M3', waste_percentage: 10 },
        { material_name_en: 'Fabric Screen', quantity_per_product: 8, unit: 'M2', waste_percentage: 5 },
      ],
      components: [
        { component_name_en: 'Work Surface', quantity: 4, unit: 'PC' },
        { component_name_en: 'Privacy Screen', quantity: 8, unit: 'PC' },
        { component_name_en: 'Overhead Storage', quantity: 4, unit: 'PC' },
        { component_name_en: 'Cable Tray', quantity: 4, unit: 'PC' },
      ],
      specifications: [
        { specification_name_en: 'Total Width', value: '280', unit: 'cm' },
        { specification_name_en: 'Total Depth', value: '140', unit: 'cm' },
        { specification_name_en: 'Height', value: '130', unit: 'cm' },
        { specification_name_en: 'Color', value: 'White / Grey' },
      ],
      files: [
        { software_name: 'Autodesk Revit', file_format: 'RFA', file_name_original: 'workstation_4person.rfa', file_size: 4100000, is_primary: true },
        { software_name: '3ds Max', file_format: 'MAX', file_name_original: 'workstation_4person.max', file_size: 8500000, is_primary: false },
      ],
      created_by: userId, created_at: '2025-03-15', view_count: 0, download_count: 0,
    },
  ];

  save(demos);
  localStorage.setItem('buad_seeded', '1');
}

// ─── CRUD ─────────────────────────────────────────────────────

export function getAllProducts() {
  return Promise.resolve(load());
}

export function getProductById(id) {
  const p = load().find(p => p.id === id);
  return Promise.resolve(p || null);
}

export function getMyProducts(userId) {
  return Promise.resolve(load().filter(p => p.created_by === userId));
}

export function getPublicProducts() {
  return Promise.resolve(load().filter(p => p.status === 'approved' && p.visibility === 'public'));
}

export function getPendingProducts() {
  return Promise.resolve(load().filter(p => p.status === 'pending_review'));
}

export function createProduct(data, userId) {
  const list = load();
  const id   = uid();
  const buod_reference = data.status === 'draft' ? null
    : nextRef(data.category_id, data.subcategory_id);

  const product = {
    id,
    buod_reference,
    ...data,
    created_by:     userId,
    created_at:     new Date().toISOString().split('T')[0],
    updated_at:     new Date().toISOString().split('T')[0],
    view_count:     0,
    download_count: 0,
    version_number: 1,
    materials:   data.materials   || [],
    components:  data.components  || [],
    specifications: data.specifications || [],
    files:       data.files       || [],
    images:      data.images      || [],
  };

  list.unshift(product);
  save(list);
  return Promise.resolve(product);
}

export function updateProduct(id, updates, userId) {
  const list = load();
  const idx  = list.findIndex(p => p.id === id);
  if (idx === -1) return Promise.reject(new Error('Product not found'));
  if (list[idx].created_by !== userId) return Promise.reject(new Error('Unauthorized'));

  // Generate BUOD ref when submitting for review for the first time
  if (updates.status === 'pending_review' && !list[idx].buod_reference) {
    updates.buod_reference = nextRef(
      updates.category_id || list[idx].category_id,
      updates.subcategory_id || list[idx].subcategory_id
    );
  }

  list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString().split('T')[0] };
  save(list);
  return Promise.resolve(list[idx]);
}

export function adminUpdateProduct(id, updates) {
  const list = load();
  const idx  = list.findIndex(p => p.id === id);
  if (idx === -1) return Promise.reject(new Error('Product not found'));
  list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString().split('T')[0] };
  save(list);
  return Promise.resolve(list[idx]);
}

export function deleteProduct(id, userId) {
  let list = load();
  const p  = list.find(p => p.id === id);
  if (!p) return Promise.reject(new Error('Product not found'));
  if (p.created_by !== userId) return Promise.reject(new Error('Unauthorized'));
  list = list.filter(p => p.id !== id);
  save(list);
  return Promise.resolve(true);
}

export function saveDraft(id, partialData, userId) {
  const list = load();
  const idx  = list.findIndex(p => p.id === id);
  if (idx === -1) {
    return createProduct({ ...partialData, status: 'draft', visibility: 'private' }, userId);
  }
  return updateProduct(id, { ...partialData, status: 'draft' }, userId);
}

export function submitForReview(id, userId) {
  return updateProduct(id, { status: 'pending_review' }, userId);
}

export function approveProduct(id) {
  return adminUpdateProduct(id, {
    status: 'approved',
    visibility: 'public',
    approved_at: new Date().toISOString(),
  });
}

export function rejectProduct(id, reason) {
  return adminUpdateProduct(id, {
    status: 'rejected',
    rejection_reason: reason,
  });
}

export function incrementView(id) {
  const list = load();
  const idx  = list.findIndex(p => p.id === id);
  if (idx !== -1) {
    list[idx].view_count = (list[idx].view_count || 0) + 1;
    save(list);
  }
  return Promise.resolve();
}
