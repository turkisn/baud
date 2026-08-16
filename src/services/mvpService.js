import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

const PRIVATE_BUCKETS = Object.freeze({
  PRODUCT_IMAGES: 'product-images',
  PRODUCT_FILES: 'product-files',
  PRODUCT_DATASHEETS: 'product-datasheets',
  SUPPLIER_ASSETS: 'supplier-assets',
});
const APPROVED_PRIVATE_BUCKETS = new Set(Object.values(PRIVATE_BUCKETS));
const READ_TTL = 60 * 10;

const first = (value, keys, fallback = null) => {
  for (const key of keys) if (value?.[key] !== undefined && value?.[key] !== null) return value[key];
  return fallback;
};

const slugFor = (row) => first(row, ['slug', 'public_slug', 'id', 'buod_reference']);

function isValidStoragePath(path) {
  if (typeof path !== 'string' || !path || path !== path.trim() || path.length > 1024) return false;
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|\/)/i.test(path)) return false;
  if (path.includes('\\') || [...path].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  })) return false;
  return !path.split('/').some((segment) => segment === '..' || segment === '.');
}

async function signedPrivateUrl(bucket, path) {
  if (!APPROVED_PRIVATE_BUCKETS.has(bucket) || !isValidStoragePath(path)) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, READ_TTL);
  if (error) return null;
  return data?.signedUrl || null;
}

async function hydrateProduct(row, includeFiles = false) {
  if (!row) return null;
  const id = row.id || row.product_id;
  const [imagesResult, specificationsResult, filesResult] = await Promise.all([
    supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
    supabase.from('product_specifications').select('*').eq('product_id', id).order('sort_order'),
    includeFiles
      ? supabase.from('product_files').select('*').eq('product_id', id).eq('is_available', true)
      : Promise.resolve({ data: [] }),
  ]);
  const imageRows = imagesResult.error ? [] : imagesResult.data || [];
  const specificationRows = specificationsResult.error ? [] : specificationsResult.data || [];
  const fileRows = filesResult.error ? [] : filesResult.data || [];
  const images = (await Promise.all(imageRows.map(async (image) => ({
    ...image,
    signed_url: await signedPrivateUrl(PRIVATE_BUCKETS.PRODUCT_IMAGES, image.image_path),
  })))).filter((image) => image.signed_url);
  const featuredPath = first(row, ['featured_image_path', 'image_path']);
  return {
    ...row,
    slug: slugFor(row),
    signed_image_url: images.find((image) => image.is_primary)?.signed_url
      || images[0]?.signed_url
      || await signedPrivateUrl(PRIVATE_BUCKETS.PRODUCT_IMAGES, featuredPath),
    product_images: images,
    product_specifications: specificationRows,
    product_files: fileRows,
  };
}

function normalizeListResult(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.suppliers)) return data.suppliers;
  if (Array.isArray(data?.windows)) return data.windows;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function normalizeSingleResult(data) {
  const result = Array.isArray(data)
    ? data[0]
    : data?.product || data?.supplier || data?.window || data;
  return result && typeof result === 'object' && Object.keys(result).length > 0 ? result : null;
}

async function hydrateSupplier(row) {
  if (!row) return null;
  return {
    ...row,
    slug: slugFor(row),
    signed_logo_url: await signedPrivateUrl(PRIVATE_BUCKETS.SUPPLIER_ASSETS, first(row, ['logo_path', 'logo'])),
    signed_cover_url: await signedPrivateUrl(PRIVATE_BUCKETS.SUPPLIER_ASSETS, first(row, ['cover_path', 'cover_image_path', 'cover'])),
  };
}

export const mvpService = {
  async getCategories() {
    if (!SUPABASE_CONFIGURED) return [];
    const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');
    if (error) throw error;
    return data || [];
  },

  async searchProducts({ query = '', categoryId = null, supplierId = null, limit = 24, offset = 0 } = {}) {
    if (!SUPABASE_CONFIGURED) return [];
    const { data, error } = await supabase.rpc('search_mvp_products', {
      p_query: query || null,
      p_category_id: categoryId || null,
      p_supplier_id: supplierId || null,
      p_limit: limit,
      p_offset: offset,
    });
    if (error) throw error;
    return Promise.all(normalizeListResult(data).map((row) => hydrateProduct(row)));
  },

  async getLatestProducts(limit = 8) {
    if (!SUPABASE_CONFIGURED) return [];
    const { data, error } = await supabase
      .from('mvp_public_products').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return Promise.all((data || []).map((row) => hydrateProduct(row)));
  },

  async getProduct(slug) {
    if (!SUPABASE_CONFIGURED) return null;
    const { data, error } = await supabase.rpc('get_mvp_product', { p_lookup: slug });
    if (error) throw error;
    return hydrateProduct(normalizeSingleResult(data), true);
  },

  async getSuppliers({ query = '', limit = 50, offset = 0 } = {}) {
    if (!SUPABASE_CONFIGURED) return [];
    const { data, error } = await supabase.rpc('search_mvp_supplier_windows', {
      p_query: query || null,
      p_limit: limit,
      p_offset: offset,
    });
    if (error) throw error;
    return Promise.all(normalizeListResult(data).map(hydrateSupplier));
  },

  async getSupplier(slug) {
    if (!SUPABASE_CONFIGURED) return null;
    const { data, error } = await supabase.rpc('get_mvp_supplier_window', { p_slug: slug });
    if (error) throw error;
    const supplier = await hydrateSupplier(normalizeSingleResult(data));
    if (!supplier) return null;
    const supplierId = supplier.id || supplier.supplier_id;
    const products = supplierId ? await this.searchProducts({ supplierId, limit: 100 }) : [];
    return { ...supplier, products };
  },

  async createDownloadUrl(file) {
    if (!SUPABASE_CONFIGURED || !file?.file_path || file.is_available === false) return null;
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const fallbackBucket = file.file_type === 'datasheet'
      ? PRIVATE_BUCKETS.PRODUCT_DATASHEETS
      : file.file_type === 'block'
        ? PRIVATE_BUCKETS.PRODUCT_FILES
        : null;
    const bucket = APPROVED_PRIVATE_BUCKETS.has(file.storage_bucket)
      ? file.storage_bucket
      : fallbackBucket;
    return bucket ? signedPrivateUrl(bucket, file.file_path) : null;
  },

  async recordEvent(eventName, metadata = {}) {
    if (!SUPABASE_CONFIGURED || typeof eventName !== 'string' || !eventName.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const productId = metadata?.product_id || null;
      const supplierId = metadata?.supplier_id || null;
      const excludedKeys = new Set(['product_id', 'supplier_id', 'user_id', 'user_type', 'userid', 'usertype']);
      const safeMetadata = Object.fromEntries(
        Object.entries(metadata || {}).filter(([key, value]) => {
          const normalizedKey = key.replace(/[^a-z\d_]/gi, '').toLowerCase();
          return !excludedKeys.has(normalizedKey) && value !== undefined;
        })
      );
      await supabase.rpc('record_usage_event', {
        p_event_name: eventName,
        p_product_id: productId,
        p_supplier_id: supplierId,
        p_session_id: null,
        p_metadata: safeMetadata,
      });
    } catch {
      // Analytics must never interrupt browsing or secure downloads.
    }
  },
};
