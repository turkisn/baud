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

const PUBLIC_PRODUCT_ENRICHMENT_FIELDS = [
  'id', 'product_type', 'manufacturer_id', 'verification_status', 'is_free',
  'lead_time', 'min_order_qty', 'in_stock', 'license_type', 'license_commercial',
  'license_download', 'license_modify', 'license_redistribute', 'rights_confirmed',
  'version_number',
].join(',');

const PUBLIC_MATERIAL_FIELDS = [
  'id', 'product_id', 'material_name_ar', 'material_name_en', 'material_code',
  'material_type', 'finish', 'color', 'quantity_per_product', 'unit',
].join(',');

export const PUBLIC_PRODUCT_FILE_FIELDS = [
  'id', 'product_id', 'file_type', 'software_name', 'software_version',
  'file_format', 'original_file_name', 'file_size', 'mime_type', 'is_primary',
  'is_available', 'created_at',
].join(',');

const PRIVATE_DOWNLOAD_FIELDS = 'id,product_id,file_type,file_path,storage_bucket,is_available';
const READ_TTL_SECONDS = 60 * 5;
const ANALYTICS_SESSION_KEY = 'buod_mvp_session_id';
const ANALYTICS_DEDUP_WINDOW_MS = 5_000;
const MAX_ANALYTICS_DEDUP_ENTRIES = 100;
const SAFE_ANALYTICS_METADATA_KEYS = new Set(['page', 'category_id', 'supplier_id', 'file_id']);
const STORAGE_PATH_FIELDS = [
  'featured_image_path', 'image_path', 'logo_path', 'logo', 'cover_image_path',
  'cover_path', 'cover', 'file_path', 'storage_bucket',
];

const recentAnalyticsEvents = new Map();

const first = (value, keys, fallback = null) => {
  for (const key of keys) {
    if (value?.[key] !== undefined && value?.[key] !== null) return value[key];
  }
  return fallback;
};

const slugFor = (row) => first(row, ['slug', 'public_slug', 'id', 'buod_reference']);

function assertConfigured() {
  if (!SUPABASE_CONFIGURED) throw new Error('MVP data service is unavailable.');
}

function isValidStoragePath(path) {
  if (typeof path !== 'string' || !path || path !== path.trim() || path.length > 1024) return false;
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|\/)/i.test(path)) return false;
  if (path.includes('\\') || [...path].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  })) return false;
  return !path.split('/').some((segment) => segment === '..' || segment === '.');
}

function withoutStoragePaths(row) {
  const safeRow = { ...row };
  for (const field of STORAGE_PATH_FIELDS) delete safeRow[field];
  return safeRow;
}

async function signedPrivateUrl(bucket, path) {
  if (!Object.values(PRIVATE_BUCKETS).includes(bucket) || !isValidStoragePath(path)) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, READ_TTL_SECONDS);
  if (error) return null;
  return data?.signedUrl || null;
}

async function batchSignedUrls(bucket, requestedPaths) {
  const paths = [...new Set((requestedPaths || []).filter(isValidStoragePath))];
  const urls = new Map();
  const failedPaths = new Set();
  if (!paths.length) return { urls, failedPaths };

  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, READ_TTL_SECONDS);
    if (error || !Array.isArray(data)) {
      paths.forEach((path) => failedPaths.add(path));
      return { urls, failedPaths };
    }

    const requested = new Set(paths);
    for (const result of data) {
      if (!result?.path || !requested.has(result.path)) continue;
      if (result.error || !result.signedUrl) failedPaths.add(result.path);
      else urls.set(result.path, result.signedUrl);
    }
    paths.forEach((path) => { if (!urls.has(path)) failedPaths.add(path); });
  } catch {
    paths.forEach((path) => failedPaths.add(path));
  }

  return { urls, failedPaths };
}

function normalizeListResult(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.suppliers)) return data.suppliers;
  if (Array.isArray(data?.windows)) return data.windows;
  if (Array.isArray(data?.items)) return data.items;
  throw new Error('Unexpected MVP list response.');
}

function normalizeSingleResult(data) {
  const result = Array.isArray(data)
    ? data[0]
    : data?.product || data?.supplier || data?.window || data;
  return result && typeof result === 'object' && Object.keys(result).length > 0 ? result : null;
}

async function settleQuery(query) {
  try {
    return await query;
  } catch {
    return { data: null, error: true };
  }
}

async function hydrateProductSummaries(rows) {
  const summaries = rows.map((row) => {
    const rawImagePath = first(row, ['featured_image_path', 'image_path']);
    return {
      row,
      rawImagePath,
      imagePath: isValidStoragePath(rawImagePath) ? rawImagePath : null,
    };
  });
  const productIds = summaries.map(({ row }) => row.id || row.product_id).filter(Boolean);
  const [signed, filesResult] = await Promise.all([
    batchSignedUrls(
      PRIVATE_BUCKETS.PRODUCT_IMAGES,
      summaries.map(({ imagePath }) => imagePath)
    ),
    productIds.length
      ? settleQuery(supabase.from('product_files').select(PUBLIC_PRODUCT_FILE_FIELDS)
        .in('product_id', productIds).eq('is_available', true))
      : Promise.resolve({ data: [], error: null }),
  ]);

  const filesByProduct = new Map();
  if (!filesResult.error && Array.isArray(filesResult.data)) {
    for (const file of filesResult.data) {
      const current = filesByProduct.get(file.product_id) || [];
      current.push(file);
      filesByProduct.set(file.product_id, current);
    }
  }

  return summaries.map(({ row, rawImagePath, imagePath }) => {
    const files = filesByProduct.get(row.id || row.product_id) || [];
    return {
      ...withoutStoragePaths(row),
      slug: slugFor(row),
      signed_image_url: imagePath ? signed.urls.get(imagePath) || null : null,
      image_error: Boolean(rawImagePath && (!imagePath || signed.failedPaths.has(imagePath))),
      available_formats: [...new Set(files.map((file) => file.file_format).filter(Boolean))],
      available_software: [...new Set(files.map((file) => file.software_name).filter(Boolean))],
      available_file_count: files.length,
      file_metadata_error: Boolean(filesResult.error),
    };
  });
}

async function hydrateProductDetail(row) {
  const id = row?.id || row?.product_id;
  if (!id) throw new Error('Product detail response is incomplete.');

  const [imagesResult, specificationsResult, filesResult, enrichmentResult, materialsResult] = await Promise.all([
    settleQuery(supabase.from('product_images').select(PUBLIC_PRODUCT_IMAGE_FIELDS)
      .eq('product_id', id).order('sort_order')),
    settleQuery(supabase.from('product_specifications').select(PUBLIC_SPECIFICATION_FIELDS)
      .eq('product_id', id).order('sort_order')),
    settleQuery(supabase.from('product_files').select(PUBLIC_PRODUCT_FILE_FIELDS)
      .eq('product_id', id).eq('is_available', true)
      .order('is_primary', { ascending: false }).order('created_at', { ascending: false })),
    settleQuery(supabase.from('products').select(PUBLIC_PRODUCT_ENRICHMENT_FIELDS)
      .eq('id', id).maybeSingle()),
    settleQuery(supabase.from('product_materials').select(PUBLIC_MATERIAL_FIELDS)
      .eq('product_id', id).order('created_at')),
  ]);

  const imagesSucceeded = !imagesResult.error && Array.isArray(imagesResult.data);
  const specificationsSucceeded = !specificationsResult.error && Array.isArray(specificationsResult.data);
  const filesSucceeded = !filesResult.error && Array.isArray(filesResult.data);
  const enrichmentSucceeded = !enrichmentResult.error && enrichmentResult.data;
  const materialsSucceeded = !materialsResult.error && Array.isArray(materialsResult.data);
  const imageRows = imagesSucceeded ? imagesResult.data : [];
  const featuredPath = first(row, ['featured_image_path', 'image_path']);
  const validFeaturedPath = isValidStoragePath(featuredPath) ? featuredPath : null;
  const rawImagePaths = imageRows.map((image) => image.image_path).filter(Boolean);
  const validImagePaths = rawImagePaths.filter(isValidStoragePath);
  const signed = await batchSignedUrls(
    PRIVATE_BUCKETS.PRODUCT_IMAGES,
    [...validImagePaths, validFeaturedPath]
  );

  const images = imageRows.map((image) => ({
    ...withoutStoragePaths(image),
    signed_url: signed.urls.get(image.image_path) || null,
  })).filter((image) => image.signed_url);
  const imagePathsInvalid = rawImagePaths.some((path) => !isValidStoragePath(path))
    || Boolean(featuredPath && !validFeaturedPath);
  const imageSigningFailed = [...validImagePaths, validFeaturedPath]
    .filter(Boolean).some((path) => signed.failedPaths.has(path));

  return {
    ...withoutStoragePaths(row),
    ...(enrichmentSucceeded ? withoutStoragePaths(enrichmentResult.data) : {}),
    slug: slugFor(row),
    signed_image_url: images.find((image) => image.is_primary)?.signed_url
      || images[0]?.signed_url
      || (validFeaturedPath ? signed.urls.get(validFeaturedPath) || null : null),
    product_images: images,
    product_specifications: specificationsSucceeded ? specificationsResult.data : [],
    product_files: filesSucceeded ? filesResult.data : [],
    product_materials: materialsSucceeded ? materialsResult.data : [],
    detail_errors: {
      images: !imagesSucceeded || imagePathsInvalid || imageSigningFailed,
      specifications: !specificationsSucceeded,
      files: !filesSucceeded,
      product_data: !enrichmentSucceeded,
      materials: !materialsSucceeded,
    },
  };
}

function supplierAssetPaths(row) {
  const rawLogoPath = first(row, ['logo_path', 'logo']);
  const rawCoverPath = first(row, ['cover_image_path', 'cover_path', 'cover']);
  return {
    rawLogoPath,
    rawCoverPath,
    logoPath: isValidStoragePath(rawLogoPath) ? rawLogoPath : null,
    coverPath: isValidStoragePath(rawCoverPath) ? rawCoverPath : null,
  };
}

async function hydrateSupplierRows(rows) {
  const suppliers = rows.map((row) => ({ row, ...supplierAssetPaths(row) }));
  const signed = await batchSignedUrls(
    PRIVATE_BUCKETS.SUPPLIER_ASSETS,
    suppliers.flatMap(({ logoPath, coverPath }) => [logoPath, coverPath])
  );

  return suppliers.map(({ row, rawLogoPath, rawCoverPath, logoPath, coverPath }) => ({
    ...withoutStoragePaths(row),
    slug: slugFor(row),
    signed_logo_url: logoPath ? signed.urls.get(logoPath) || null : null,
    signed_cover_url: coverPath ? signed.urls.get(coverPath) || null : null,
    asset_errors: {
      logo: Boolean(rawLogoPath && (!logoPath || signed.failedPaths.has(logoPath))),
      cover: Boolean(rawCoverPath && (!coverPath || signed.failedPaths.has(coverPath))),
    },
  }));
}

async function hydrateSupplier(row) {
  if (!row) return null;
  const [supplier] = await hydrateSupplierRows([row]);
  return supplier;
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

function safeAnalyticsId(value) {
  const candidate = String(value || '');
  return /^[a-f\d-]{1,64}$/i.test(candidate) ? candidate : null;
}

function safeAnalyticsMetadata(metadata) {
  const safeMetadata = {};
  for (const [key, value] of Object.entries(metadata || {})) {
    if (!SAFE_ANALYTICS_METADATA_KEYS.has(key)) continue;
    if (key === 'page' && typeof value === 'string' && /^[a-z\d_-]{1,64}$/i.test(value)) {
      safeMetadata.page = value;
    } else if (key !== 'page') {
      const safeValue = safeAnalyticsId(value);
      if (safeValue) safeMetadata[key] = safeValue;
    }
  }
  return safeMetadata;
}

function shouldSuppressAnalytics(eventKey) {
  const now = Date.now();
  const cutoff = now - ANALYTICS_DEDUP_WINDOW_MS;
  for (const [key, timestamp] of recentAnalyticsEvents) {
    if (timestamp <= cutoff) recentAnalyticsEvents.delete(key);
  }

  const previous = recentAnalyticsEvents.get(eventKey);
  if (previous && previous > cutoff) return true;
  recentAnalyticsEvents.set(eventKey, now);
  while (recentAnalyticsEvents.size > MAX_ANALYTICS_DEDUP_ENTRIES) {
    recentAnalyticsEvents.delete(recentAnalyticsEvents.keys().next().value);
  }
  return false;
}

export const mvpService = {
  async getCategories() {
    assertConfigured();
    const { data, error } = await supabase.from('categories')
      .select('id,code,name_ar,name_en,icon,sort_order,is_active')
      .eq('is_active', true).order('sort_order');
    if (error || !Array.isArray(data)) throw error || new Error('Unexpected category response.');
    return data;
  },

  async searchProducts({ query = '', categoryId = null, supplierId = null, limit = 24, offset = 0 } = {}) {
    assertConfigured();
    const { data, error } = await supabase.rpc('search_mvp_products', {
      p_query: query.trim() || null,
      p_category_id: categoryId || null,
      p_supplier_id: supplierId || null,
      p_limit: limit,
      p_offset: offset,
    });
    if (error) throw error;
    return hydrateProductSummaries(normalizeListResult(data));
  },

  async getLatestProducts(limit = 8) {
    return this.searchProducts({ limit, offset: 0 });
  },

  async getProduct(slug) {
    assertConfigured();
    const { data, error } = await supabase.rpc('get_mvp_product', { p_lookup: slug });
    if (error) throw error;
    const product = normalizeSingleResult(data);
    return product ? hydrateProductDetail(product) : null;
  },

  async getSuppliers({ query = '', limit = 24, offset = 0 } = {}) {
    assertConfigured();
    const { data, error } = await supabase.rpc('search_mvp_supplier_windows', {
      p_query: query.trim() || null,
      p_limit: limit,
      p_offset: offset,
    });
    if (error) throw error;
    return hydrateSupplierRows(normalizeListResult(data));
  },

  async getSupplier(slug) {
    assertConfigured();
    const { data, error } = await supabase.rpc('get_mvp_supplier_window', { p_slug: slug });
    if (error) throw error;
    return hydrateSupplier(normalizeSingleResult(data));
  },

  async createDownloadUrl(file) {
    if (!SUPABASE_CONFIGURED || !file?.id || !file?.product_id || file.is_available === false) return null;
    if (!['block', 'datasheet'].includes(file.file_type)) return null;
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data: privateFile, error: fileError } = await supabase.from('product_files')
      .select(PRIVATE_DOWNLOAD_FIELDS).eq('id', file.id).maybeSingle();
    if (fileError || !privateFile || privateFile.is_available === false) return null;
    if (String(privateFile.product_id) !== String(file.product_id)) return null;
    if (privateFile.file_type !== file.file_type) return null;

    const expectedBucket = privateFile.file_type === 'block'
      ? PRIVATE_BUCKETS.PRODUCT_FILES
      : privateFile.file_type === 'datasheet'
        ? PRIVATE_BUCKETS.PRODUCT_DATASHEETS
        : null;
    if (!expectedBucket || privateFile.storage_bucket !== expectedBucket) return null;
    return signedPrivateUrl(expectedBucket, privateFile.file_path);
  },

  async recordEvent(eventName, metadata = {}) {
    if (!SUPABASE_CONFIGURED || typeof eventName !== 'string') return;
    const safeEventName = eventName.trim();
    if (!/^[a-z\d_]{1,64}$/i.test(safeEventName)) return;

    try {
      const productId = safeAnalyticsId(metadata?.product_id);
      const supplierId = safeAnalyticsId(metadata?.supplier_id);
      const safeMetadata = safeAnalyticsMetadata(metadata);
      const eventKey = JSON.stringify([safeEventName, productId, supplierId, safeMetadata]);
      if (shouldSuppressAnalytics(eventKey)) return;

      await supabase.rpc('record_usage_event', {
        p_event_name: safeEventName,
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
