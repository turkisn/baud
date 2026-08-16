import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

const IMAGE_BUCKET = 'product-images';
const FILE_BUCKET = 'product-files';
const SUPPLIER_BUCKET = 'supplier-assets';
const READ_TTL = 60 * 10;

const first = (value, keys, fallback = null) => {
  for (const key of keys) if (value?.[key] !== undefined && value?.[key] !== null) return value[key];
  return fallback;
};

const slugFor = (row) => first(row, ['slug', 'public_slug', 'id', 'buod_reference']);

async function signedUrl(bucket, path) {
  if (!path || /^https?:\/\//i.test(path)) return path || null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, READ_TTL);
  if (error) return null;
  return data?.signedUrl || null;
}

async function hydrateProduct(row, includeFiles = false) {
  if (!row) return null;
  const id = row.id || row.product_id;
  const [imagesResult, specsResult, filesResult] = await Promise.all([
    supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
    supabase.from('product_specifications').select('*').eq('product_id', id).order('sort_order'),
    includeFiles
      ? supabase.from('product_files').select('*').eq('product_id', id).eq('is_available', true)
      : Promise.resolve({ data: [] }),
  ]);
  const images = await Promise.all((imagesResult.data || []).map(async (image) => ({
    ...image,
    signed_url: await signedUrl(IMAGE_BUCKET, image.image_path),
  })));
  const featuredPath = first(row, ['featured_image_path', 'image_path']);
  return {
    ...row,
    slug: slugFor(row),
    signed_image_url: images.find((image) => image.is_primary)?.signed_url
      || images[0]?.signed_url
      || await signedUrl(IMAGE_BUCKET, featuredPath),
    product_images: images,
    product_specifications: specsResult.data || [],
    product_files: filesResult.data || [],
  };
}

function normalizeListResult(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.items)) return data.items;
  return [];
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
    let result = await supabase.from('mvp_public_products').select('*').eq('slug', slug).maybeSingle();
    if (result.error?.code === '42703' || (!result.data && !result.error)) {
      result = await supabase.from('mvp_public_products').select('*').or(`id.eq.${slug},buod_reference.eq.${slug}`).maybeSingle();
    }
    if (result.error) throw result.error;
    return hydrateProduct(result.data, true);
  },

  async getSuppliers({ query = '', limit = 50 } = {}) {
    if (!SUPABASE_CONFIGURED) return [];
    let request = supabase.from('mvp_public_supplier_windows').select('*').limit(limit);
    if (query) request = request.or(`company_name_en.ilike.%${query}%,company_name_ar.ilike.%${query}%`);
    const { data, error } = await request;
    if (error) throw error;
    return Promise.all((data || []).map(async (row) => ({
      ...row,
      slug: slugFor(row),
      signed_logo_url: await signedUrl(SUPPLIER_BUCKET, first(row, ['logo_path', 'logo'])),
      signed_cover_url: await signedUrl(SUPPLIER_BUCKET, first(row, ['cover_path', 'cover_image_path', 'cover'])),
    })));
  },

  async getSupplier(slug) {
    const suppliers = await this.getSuppliers({ limit: 100 });
    const supplier = suppliers.find((row) => String(row.slug) === String(slug));
    if (!supplier) return null;
    const products = await this.searchProducts({ supplierId: supplier.id || supplier.supplier_id, limit: 100 });
    return { ...supplier, products };
  },

  async createDownloadUrl(file) {
    if (!SUPABASE_CONFIGURED || !file?.file_path || file.is_available === false) return null;
    return signedUrl(FILE_BUCKET, file.file_path);
  },

  async recordEvent(eventName, metadata = {}) {
    if (!SUPABASE_CONFIGURED) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.rpc('record_usage_event', { p_event_name: eventName, p_metadata: metadata });
    } catch {
      // Analytics must never interrupt browsing or secure downloads.
    }
  },
};
