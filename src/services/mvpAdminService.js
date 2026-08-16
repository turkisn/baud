import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

export const ADMIN_PAGE_SIZE = 20;
export const PRODUCT_FILE_FORMATS = Object.freeze([
  'RFA', 'RVT', 'MAX', 'FBX', 'OBJ', 'SKP', 'DWG', 'IFC', 'ZIP', '3DS', 'OTHER',
]);

const PRODUCT_FIELDS = [
  'id', 'product_name_ar', 'product_name_en', 'slug', 'category_id', 'subcategory_id',
  'supplier_id', 'brand_name', 'model_number', 'country_of_origin', 'unit',
  'short_description_ar', 'short_description_en', 'full_description_ar',
  'full_description_en', 'price', 'currency', 'supplier_product_url', 'source_url',
  'price_updated_at', 'is_featured', 'sort_order', 'rights_confirmed',
  'publication_state', 'buod_reference', 'created_at', 'updated_at',
].join(',');

const PRODUCT_LIST_FIELDS = [
  'id', 'product_name_ar', 'product_name_en', 'slug', 'category_id', 'supplier_id',
  'brand_name', 'model_number', 'publication_state', 'rights_confirmed', 'is_featured',
  'buod_reference', 'updated_at', 'created_at',
].join(',');

const SPECIFICATION_FIELDS = [
  'id', 'product_id', 'specification_name_ar', 'specification_name_en',
  'specification_code', 'value', 'unit', 'data_type', 'sort_order',
].join(',');

const IMAGE_FIELDS = [
  'id', 'product_id', 'image_path', 'image_type', 'alt_text_ar', 'alt_text_en',
  'sort_order', 'is_primary', 'created_at',
].join(',');

const FILE_FIELDS = [
  'id', 'product_id', 'file_type', 'software_name', 'software_version', 'file_format',
  'original_file_name', 'stored_file_name', 'file_path', 'file_size', 'mime_type',
  'is_primary', 'storage_bucket', 'is_available', 'created_at',
].join(',');

const SUPPLIER_FIELDS = [
  'id', 'company_name_ar', 'company_name_en', 'slug', 'commercial_name',
  'description_ar', 'description_en', 'website', 'country', 'city', 'logo_path',
  'cover_image_path', 'sort_order', 'is_published', 'verification_status',
  'created_at', 'updated_at',
].join(',');

const PRODUCT_PAYLOAD_FIELDS = new Set([
  'product_name_ar', 'product_name_en', 'slug', 'category_id', 'subcategory_id',
  'supplier_id', 'brand_name', 'model_number', 'country_of_origin', 'unit',
  'short_description_ar', 'short_description_en', 'full_description_ar',
  'full_description_en', 'price', 'currency', 'supplier_product_url', 'source_url',
  'is_featured', 'sort_order', 'rights_confirmed', 'publication_state',
]);

const SUPPLIER_PAYLOAD_FIELDS = new Set([
  'company_name_ar', 'company_name_en', 'slug', 'commercial_name', 'description_ar',
  'description_en', 'website', 'country', 'city', 'logo_path', 'cover_image_path',
  'sort_order', 'is_published', 'verification_status',
]);

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_DATASHEET_BYTES = 20 * 1024 * 1024;
const SIGNED_ASSET_TTL = 60 * 5;

function assertConfigured() {
  if (!SUPABASE_CONFIGURED) throw new Error('Supabase is not configured in this environment.');
}

function cleanSearch(value) {
  return String(value || '').trim().replace(/[,%().:]/g, ' ').replace(/\s+/g, ' ').slice(0, 120);
}

function pickAllowed(payload, allowed) {
  return Object.fromEntries(Object.entries(payload || {}).filter(([key, value]) => allowed.has(key) && value !== undefined));
}

function normalizeRpcRecord(data, key) {
  const value = Array.isArray(data) ? data[0] : data?.[key] || data?.data || data;
  if (typeof value === 'string') return { id: value };
  if (!value || typeof value !== 'object') return null;
  const id = value.id || value[`${key}_id`];
  return id ? { ...value, id } : value;
}

function extensionOf(filename) {
  const parts = String(filename || '').toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

export function sanitizeFilename(filename) {
  const original = String(filename || 'file').split(/[\\/]/).pop();
  const extension = extensionOf(original).replace(/[^a-z0-9]/g, '').slice(0, 10);
  const stem = original.slice(0, extension ? -(extension.length + 1) : undefined)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'file';
  return extension ? `${stem}.${extension}` : stem;
}

function objectPath(entityId, filename) {
  if (!entityId) throw new Error('Save this record as a draft before uploading assets.');
  if (!globalThis.crypto?.randomUUID) throw new Error('Secure upload identifiers are unavailable in this browser.');
  const storedFileName = `${globalThis.crypto.randomUUID()}-${sanitizeFilename(filename)}`;
  return { storedFileName, path: `${entityId}/${storedFileName}` };
}

function validateImage(file) {
  if (!file || file.size <= 0) throw new Error('Choose a non-empty image file.');
  const extension = extensionOf(file.name);
  if (!IMAGE_EXTENSIONS.has(extension) || !IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error('Images must be JPG, JPEG, PNG, or WEBP.');
  }
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Images must be 20 MB or smaller.');
}

async function uploadObject(bucket, path, file) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
}

async function removeObject(bucket, path) {
  if (!bucket || !path) return;
  await supabase.storage.from(bucket).remove([path]).catch(() => {});
}

async function signedAsset(bucket, path) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_ASSET_TTL);
  return error ? null : data?.signedUrl || null;
}

export const mvpAdminService = {
  async listProducts({ search = '', publicationState = '', categoryId = '', supplierId = '', page = 0 } = {}) {
    assertConfigured();
    let query = supabase.from('products').select(PRODUCT_LIST_FIELDS, { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(page * ADMIN_PAGE_SIZE, (page + 1) * ADMIN_PAGE_SIZE - 1);
    const safeSearch = cleanSearch(search);
    if (safeSearch) query = query.or(`product_name_en.ilike.%${safeSearch}%,product_name_ar.ilike.%${safeSearch}%,slug.ilike.%${safeSearch}%,buod_reference.ilike.%${safeSearch}%`);
    if (publicationState) query = query.eq('publication_state', publicationState);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (supplierId) query = query.eq('supplier_id', supplierId);
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  async getProduct(productId) {
    assertConfigured();
    const [productResult, specificationsResult, imagesResult, filesResult] = await Promise.all([
      supabase.from('products').select(PRODUCT_FIELDS).eq('id', productId).single(),
      supabase.from('product_specifications').select(SPECIFICATION_FIELDS).eq('product_id', productId).order('sort_order'),
      supabase.from('product_images').select(IMAGE_FIELDS).eq('product_id', productId).order('sort_order'),
      supabase.from('product_files').select(FILE_FIELDS).eq('product_id', productId).order('created_at', { ascending: false }),
    ]);
    if (productResult.error) throw productResult.error;
    if (specificationsResult.error) throw specificationsResult.error;
    if (imagesResult.error) throw imagesResult.error;
    if (filesResult.error) throw filesResult.error;

    const images = await Promise.all((imagesResult.data || []).map(async (image) => ({
      ...image,
      signed_url: await signedAsset('product-images', image.image_path),
    })));
    return {
      ...productResult.data,
      specifications: specificationsResult.data || [],
      images,
      files: filesResult.data || [],
    };
  },

  async saveProduct(productId, payload) {
    assertConfigured();
    const { data, error } = await supabase.rpc('admin_save_mvp_product', {
      p_product_id: productId || null,
      p_payload: pickAllowed(payload, PRODUCT_PAYLOAD_FIELDS),
    });
    if (error) throw error;
    return normalizeRpcRecord(data, 'product');
  },

  async replaceSpecifications(productId, items) {
    assertConfigured();
    if (!productId) throw new Error('Save the product draft before editing specifications.');
    const cleanItems = (items || []).map((item, index) => ({
      specification_name_ar: item.specification_name_ar || null,
      specification_name_en: item.specification_name_en || null,
      specification_code: item.specification_code || null,
      value: item.value || null,
      unit: item.unit || null,
      data_type: item.data_type || 'text',
      sort_order: index,
    }));
    const { data, error } = await supabase.rpc('admin_replace_mvp_product_specifications', {
      p_product_id: productId,
      p_items: cleanItems,
    });
    if (error) throw error;
    return data;
  },

  async uploadProductImage(productId, file, metadata = {}) {
    assertConfigured();
    validateImage(file);
    const { path } = objectPath(productId, file.name);
    await uploadObject('product-images', path, file);
    try {
      const { data, error } = await supabase.rpc('admin_register_mvp_product_image', {
        p_product_id: productId,
        p_payload: {
          image_path: path,
          image_type: metadata.image_type || 'render',
          alt_text_ar: metadata.alt_text_ar || null,
          alt_text_en: metadata.alt_text_en || null,
          sort_order: Number(metadata.sort_order) || 0,
          is_primary: Boolean(metadata.is_primary),
        },
      });
      if (error) throw error;
      return normalizeRpcRecord(data, 'image');
    } catch (error) {
      await removeObject('product-images', path);
      throw error;
    }
  },

  async uploadProductFile(productId, file, metadata = {}) {
    assertConfigured();
    if (!file || file.size <= 0) throw new Error('Choose a non-empty file.');
    const fileType = metadata.file_type === 'datasheet' ? 'datasheet' : 'block';
    const extension = extensionOf(file.name);
    let fileFormat;
    let bucket;

    if (fileType === 'datasheet') {
      if (extension !== 'pdf' || file.type !== 'application/pdf') throw new Error('Datasheets must be PDF files.');
      if (file.size > MAX_DATASHEET_BYTES) throw new Error('Datasheets must be 20 MB or smaller.');
      fileFormat = 'PDF';
      bucket = 'product-datasheets';
    } else {
      fileFormat = metadata.file_format === 'OTHER' ? 'OTHER' : extension.toUpperCase();
      if (!PRODUCT_FILE_FORMATS.includes(fileFormat)) {
        throw new Error(`Unsupported BIM/3D format. Allowed: ${PRODUCT_FILE_FORMATS.join(', ')}.`);
      }
      if (metadata.file_format && metadata.file_format !== fileFormat) {
        throw new Error('The selected format does not match the file extension.');
      }
      bucket = 'product-files';
    }

    const { path, storedFileName } = objectPath(productId, file.name);
    await uploadObject(bucket, path, file);
    try {
      const { data, error } = await supabase.rpc('admin_register_mvp_product_file', {
        p_product_id: productId,
        p_payload: {
          file_type: fileType,
          software_name: fileType === 'block' ? metadata.software_name || null : null,
          software_version: fileType === 'block' ? metadata.software_version || null : null,
          file_format: fileFormat,
          original_file_name: file.name,
          stored_file_name: storedFileName,
          file_path: path,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          is_primary: Boolean(metadata.is_primary),
          storage_bucket: bucket,
        },
      });
      if (error) throw error;
      return normalizeRpcRecord(data, 'file');
    } catch (error) {
      await removeObject(bucket, path);
      throw error;
    }
  },

  async listSuppliers({ search = '', verificationStatus = '', publication = '', page = 0 } = {}) {
    assertConfigured();
    let query = supabase.from('suppliers').select(SUPPLIER_FIELDS, { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(page * ADMIN_PAGE_SIZE, (page + 1) * ADMIN_PAGE_SIZE - 1);
    const safeSearch = cleanSearch(search);
    if (safeSearch) query = query.or(`company_name_en.ilike.%${safeSearch}%,company_name_ar.ilike.%${safeSearch}%,slug.ilike.%${safeSearch}%`);
    if (verificationStatus) query = query.eq('verification_status', verificationStatus);
    if (publication === 'published') query = query.eq('is_published', true);
    if (publication === 'unpublished') query = query.eq('is_published', false);
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  async getSupplier(supplierId) {
    assertConfigured();
    const { data, error } = await supabase.from('suppliers').select(SUPPLIER_FIELDS).eq('id', supplierId).single();
    if (error) throw error;
    return {
      ...data,
      signed_logo_url: await signedAsset('supplier-assets', data.logo_path),
      signed_cover_url: await signedAsset('supplier-assets', data.cover_image_path),
    };
  },

  async saveSupplier(supplierId, payload) {
    assertConfigured();
    const { data, error } = await supabase.rpc('admin_save_mvp_supplier', {
      p_supplier_id: supplierId || null,
      p_payload: pickAllowed(payload, SUPPLIER_PAYLOAD_FIELDS),
    });
    if (error) throw error;
    return normalizeRpcRecord(data, 'supplier');
  },

  async uploadSupplierAsset(supplierId, file) {
    assertConfigured();
    validateImage(file);
    const { path } = objectPath(supplierId, file.name);
    await uploadObject('supplier-assets', path, file);
    return { bucket: 'supplier-assets', path };
  },

  async removeUploadedObject(bucket, path) {
    assertConfigured();
    await removeObject(bucket, path);
  },

  async listCategories() {
    assertConfigured();
    const { data, error } = await supabase.from('categories')
      .select('id,code,name_ar,name_en,is_active,sort_order')
      .order('sort_order');
    if (error) throw error;
    return data || [];
  },

  async listSubcategories(categoryId) {
    assertConfigured();
    if (!categoryId) return [];
    const { data, error } = await supabase.from('subcategories')
      .select('id,category_id,code,name_ar,name_en,is_active,sort_order')
      .eq('category_id', categoryId).order('sort_order');
    if (error) throw error;
    return data || [];
  },

  async searchSupplierOptions(search = '') {
    assertConfigured();
    let query = supabase.from('suppliers')
      .select('id,company_name_ar,company_name_en,slug,is_published,verification_status')
      .order('company_name_en').limit(50);
    const safeSearch = cleanSearch(search);
    if (safeSearch) query = query.or(`company_name_en.ilike.%${safeSearch}%,company_name_ar.ilike.%${safeSearch}%,slug.ilike.%${safeSearch}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getSupplierLabels(ids) {
    assertConfigured();
    const uniqueIds = [...new Set((ids || []).filter(Boolean))];
    if (!uniqueIds.length) return [];
    const { data, error } = await supabase.from('suppliers')
      .select('id,company_name_ar,company_name_en,slug,is_published,verification_status')
      .in('id', uniqueIds);
    if (error) throw error;
    return data || [];
  },
};
