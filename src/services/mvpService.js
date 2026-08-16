import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

const PRIVATE_BUCKETS = Object.freeze({
  PRODUCT_IMAGES: 'product-images',
  PRODUCT_FILES: 'product-files',
  PRODUCT_DATASHEETS: 'product-datasheets',
  SUPPLIER_ASSETS: 'supplier-assets',
});

const PUBLIC_PRODUCT_IMAGE_FIELDS = [
  'id', 'product_id', 'image_path', 'image_type', 'alt_text_ar', 'alt_text_en',
  'sort_order', 'is_primary', 'created_at',
].join(',');

const PUBLIC_SPECIFICATION_FIELDS = [
  'id', 'product_id', 'specification_name_ar', 'specification_name_en',
  'specification_code', 'value', 'unit', 'data_type', 'sort_order',
].join(',');

export const PUBLIC_PRODUCT_FILE_FIELDS = [
  'id', 'product_id', 'file_type', 'software_name', 'software_version',
  'file_format', 'original_file_name', 'file_size', 'mime_type', 'is_primary',
  'is_available', 'created_at',
].join(',');

const PRIVATE_DOWNLOAD_FIELDS = 'id,product_id,file_type,file_path,storage_bucket,is_available';
const READ_TTL_SECONDS = 60 * 5;
const ANALYTICS_SESSION_KEY = 'buod_mvp_session_id';
const RESERVED_ANALYTICS_KEYS = new Set([
  'email', 'user_id', 'userid', 'user_type', 'usertype', 'role', 'token', 'tokens',
  'access_token', 'refresh_token', 'authorization', 'file_path', 'filepath', 'filepaths',
  'path', 'storage_bucket', 'storagebucket', 'signed_url', 'signedurl', 'signed_urls', 'signedurls',
]);

let lastAnalyticsEvent = '';

const first = (value, keys, fallback = null) => {
  for (const key of keys) {
    if (value?.[key] !== undefined && value?.[key] !== null) return value[key];
  }
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
  if (!Object.values(PRIVATE_BUCKETS).includes(bucket) || !isValidStoragePath(path)) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, READ_TTL_SECONDS);
  if (error) return null;
  return data?.signedUrl || null;
}

async function hydrateProduct(row, includeFiles = false) {
  if (!row) return null;
  const id = row.id || row.product_id;
  if (!id) {
    return { ...row, slug: slugFor(row), product_images: [], product_specifications: [], product_files: [] };
  }

  const [imagesResult, specificationsResult, filesResult] = await Promise.all([
    supabase.from('product_images').select(PUBLIC_PRODUCT_IMAGE_FIELDS).eq('product_id', id).order('sort_order'),
    supabase.from('product_specifications').select(PUBLIC_SPECIFICATION_FIELDS).eq('product_id', id).order('sort_order'),
    includeFiles
      ? supabase.from('product_files').select(PUBLIC_PRODUCT_FILE_FIELDS).eq('product_id', id)
        .eq('is_available', true).order('is_primary', { ascending: false }).order('created_at', { ascending: false })
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
    signed_cover_url: await signedPrivateUrl(PRIVATE_BUCKETS.SUPPLIER_ASSETS, first(row, ['cover_image_path', 'cover_path', 'cover'])),
  };
}

function getAnalyticsSessionId() {
  if (typeof window === 'undefined' || !window.crypto?.randomUUID) return null;
  try {
    let sessionId = window.sessionStorage.getItem(ANALYTICS_SESSION_KEY);
    if (!sessionId) {
      sessionId = window.crypto.randomUUID();
      window.sessionStorage.setItem(ANALYTICS_SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return null;
  }
}

function safeAnalyticsMetadata(metadata) {
  return Object.fromEntries(Object.entries(metadata || {}).filter(([key, value]) => {
    const normalizedKey = key.replace(/[^a-z\d_]/gi, '').toLowerCase();
    return !RESERVED_ANALYTICS_KEYS.has(normalizedKey)
      && key !== 'product_id'
      && key !== 'supplier_id'
      && value !== undefined;
  }));
}

export const mvpService = {
  async getCategories() {
    if (!SUPABASE_CONFIGURED) return [];
    const { data, error } = await supabase.from('categories')
      .select('id,code,name_ar,name_en,icon,sort_order,is_active')
      .eq('is_active', true).order('sort_order');
    if (error) throw error;
    return data || [];
  },

  async searchProducts({ query = '', categoryId = null, supplierId = null, limit = 24, offset = 0 } = {}) {
    if (!SUPABASE_CONFIGURED) return [];
    const { data, error } = await supabase.rpc('search_mvp_products', {
      p_query: query.trim() || null,
      p_category_id: categoryId || null,
      p_supplier_id: supplierId || null,
      p_limit: limit,
      p_offset: offset,
    });
    if (error) throw error;
    return Promise.all(normalizeListResult(data).map((row) => hydrateProduct(row)));
  },

  async getLatestProducts(limit = 8) {
    return this.searchProducts({ limit, offset: 0 });
  },

  async getProduct(slug) {
    if (!SUPABASE_CONFIGURED) return null;
    const { data, error } = await supabase.rpc('get_mvp_product', { p_lookup: slug });
    if (error) throw error;
    return hydrateProduct(normalizeSingleResult(data), true);
  },

  async getSuppliers({ query = '', limit = 24, offset = 0 } = {}) {
    if (!SUPABASE_CONFIGURED) return [];
    const { data, error } = await supabase.rpc('search_mvp_supplier_windows', {
      p_query: query.trim() || null,
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
    return hydrateSupplier(normalizeSingleResult(data));
  },

  async createDownloadUrl(file) {
    if (!SUPABASE_CONFIGURED || !file?.id || !file?.product_id || file.is_available === false) return null;
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data: privateFile, error: fileError } = await supabase.from('product_files')
      .select(PRIVATE_DOWNLOAD_FIELDS).eq('id', file.id).maybeSingle();
    if (fileError || !privateFile || privateFile.is_available === false) return null;
    if (String(privateFile.product_id) !== String(file.product_id)) return null;

    const expectedBucket = privateFile.file_type === 'block'
      ? PRIVATE_BUCKETS.PRODUCT_FILES
      : privateFile.file_type === 'datasheet'
        ? PRIVATE_BUCKETS.PRODUCT_DATASHEETS
        : null;
    if (!expectedBucket || privateFile.storage_bucket !== expectedBucket) return null;
    return signedPrivateUrl(expectedBucket, privateFile.file_path);
  },

  async recordEvent(eventName, metadata = {}) {
    if (!SUPABASE_CONFIGURED || typeof eventName !== 'string' || !eventName.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const productId = metadata?.product_id || null;
      const supplierId = metadata?.supplier_id || null;
      const safeMetadata = safeAnalyticsMetadata(metadata);
      const eventKey = JSON.stringify([eventName, productId, supplierId, safeMetadata]);
      if (eventKey === lastAnalyticsEvent) return;
      lastAnalyticsEvent = eventKey;

      await supabase.rpc('record_usage_event', {
        p_event_name: eventName,
        p_product_id: productId,
        p_supplier_id: supplierId,
        p_session_id: getAnalyticsSessionId(),
        p_metadata: safeMetadata,
      });
    } catch {
      // Analytics must never interrupt browsing or secure downloads.
    }
  },
};
