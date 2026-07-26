import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';
import * as mock from './productsService';

// Valid values for the product_files.file_format CHECK constraint.
const VALID_FILE_FORMATS = new Set([
  'RFA','RVT','MAX','FBX','OBJ','SKP','DWG','IFC','PDF','ZIP','3DS','OTHER',
]);

// ── helpers ───────────────────────────────────────────────────────
function buildFileRows(productId, files) {
  return files.map(f => {
    const ext = (f.name?.split('.').pop() || '').toUpperCase();
    return {
      product_id:         productId,
      file_path:          f.path,
      original_file_name: f.name,
      file_size:          f.size,
      file_format:        VALID_FILE_FORMATS.has(ext) ? ext : 'OTHER',
      software_name:      f.software,
      software_version:   f.softwareVersion,
      file_type:          f.fileType || 'block',
    };
  });
}

function buildImageRows(productId, images) {
  return images.map((img, i) => ({
    product_id: productId,
    image_path: img.path || img.url,
    image_type: img.type || 'render',
    sort_order: i,
    is_primary: i === 0,
  }));
}

// ── public API ────────────────────────────────────────────────────
export const productService = {

  // ── createDraft ───────────────────────────────────────────────
  // Creates a product in draft state and links uploaded files/images.
  // The enforce_product_column_acl BEFORE INSERT trigger forces
  // status='draft' regardless of what is passed, so the status field
  // in draftData is intentionally ignored here.
  // Returns the newly created product row.
  async createDraft(userId, draftData) {
    if (!SUPABASE_CONFIGURED) return mock.createProduct(userId, draftData);

    const {
      images = [], files = [], specifications = [], materials = [], components = [],
      status: _ignored,   // always becomes 'draft' via DB trigger
      ...core
    } = draftData;

    const { data: product, error } = await supabase
      .from('products')
      .insert({ ...core, created_by: userId })
      .select()
      .single();
    if (error) throw error;

    if (images.length > 0) {
      const { error: e } = await supabase
        .from('product_images')
        .insert(buildImageRows(product.id, images));
      if (e) throw e;
    }

    if (files.length > 0) {
      const { error: e } = await supabase
        .from('product_files')
        .insert(buildFileRows(product.id, files));
      if (e) throw e;
    }

    if (specifications.length > 0) {
      const { error: e } = await supabase.from('product_specifications').insert(
        specifications.map((s, i) => ({
          product_id:              product.id,
          specification_name_ar:   s.nameAr,
          specification_name_en:   s.nameEn,
          specification_code:      s.code,
          value:                   s.value,
          unit:                    s.unit,
          sort_order:              i,
        }))
      );
      if (e) throw e;
    }

    if (materials.length > 0) {
      const { error: e } = await supabase.from('product_materials').insert(
        materials.map(m => ({
          product_id:          product.id,
          material_name_ar:    m.nameAr,
          material_name_en:    m.nameEn,
          material_type:       m.type,
          finish:              m.finish,
          color:               m.color,
          quantity_per_product: m.quantity,
          unit:                m.unit,
        }))
      );
      if (e) throw e;
    }

    if (components.length > 0) {
      const { error: e } = await supabase.from('product_components').insert(
        components.map(c => ({
          product_id:         product.id,
          component_name_ar:  c.nameAr,
          component_name_en:  c.nameEn,
          quantity:           c.quantity,
          unit:               c.unit,
        }))
      );
      if (e) throw e;
    }

    return product;
  },

  // ── submitProduct ─────────────────────────────────────────────
  // Transitions a draft product to pending_review via the
  // submit_product_for_review() SECURITY DEFINER RPC.
  //
  // The RPC (migration 011) verifies ownership, state, and category
  // server-side, then executes the UPDATE that fires:
  //   - enforce_product_column_acl: preserves admin-only columns
  //   - trg_auto_buod_reference: generates the BUOD reference
  //
  // Returns { id, status, buod_reference, category_id } on success.
  // Throws with a user-readable message on any failure.
  async submitProduct(productId) {
    if (!SUPABASE_CONFIGURED) return mock.submitForReview(productId);

    const { data, error } = await supabase
      .rpc('submit_product_for_review', { p_product_id: productId });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('PRODUCT_NOT_FOUND'))   throw new Error('Product not found.');
      if (msg.includes('NOT_OWNER'))            throw new Error('You do not own this product.');
      if (msg.includes('INVALID_STATE'))        throw new Error('Product is not in a submittable state.');
      if (msg.includes('CATEGORY_REQUIRED'))    throw new Error('A category must be selected before submitting for review.');
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error('Submission returned no data from the database.');
    return row;
  },

  // ── getMyProducts ─────────────────────────────────────────────
  async getMyProducts(userId) {
    if (!SUPABASE_CONFIGURED) return mock.getMyProducts(userId);
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(code, name_ar, name_en),
        subcategories(code, name_ar, name_en),
        product_images(image_path, is_primary, sort_order),
        product_files(id, file_format, original_file_name, is_primary)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // ── updateProduct ─────────────────────────────────────────────
  // Used by the admin panel to approve / reject / set revision_required.
  async updateProduct(productId, updates) {
    if (!SUPABASE_CONFIGURED) return mock.updateProduct(productId, updates);
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ── deleteProduct ─────────────────────────────────────────────
  async deleteProduct(productId) {
    if (!SUPABASE_CONFIGURED) return mock.deleteProduct(productId);
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    if (error) throw error;
  },

  // ── getPublicProducts ─────────────────────────────────────────
  async getPublicProducts({ categoryId, search, page = 0, pageSize = 20 } = {}) {
    if (!SUPABASE_CONFIGURED) return mock.getAllProducts();
    let q = supabase
      .from('products')
      .select(`
        id, buod_reference, product_name_ar, product_name_en,
        short_description_ar, short_description_en,
        featured_image_path, is_free, price, currency,
        view_count, download_count, created_at,
        verification_status,
        categories(code, name_ar, name_en),
        subcategories(code, name_ar, name_en),
        product_files(file_format)
      `)
      .eq('status', 'approved')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (categoryId) q = q.eq('category_id', categoryId);
    if (search) q = q.or(
      `product_name_ar.ilike.%${search}%,product_name_en.ilike.%${search}%,buod_reference.ilike.%${search}%`
    );

    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  // ── getProductById ────────────────────────────────────────────
  async getProductById(productId) {
    if (!SUPABASE_CONFIGURED) {
      return mock.getAllProducts().find(p => p.id === productId) ?? null;
    }
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(*),
        subcategories(*),
        product_images(*),
        product_files(*),
        product_specifications(*),
        product_materials(*),
        product_components(*)
      `)
      .eq('id', productId)
      .single();
    if (error) throw error;
    return data;
  },

  // ── incrementViewCount ────────────────────────────────────────
  async incrementViewCount(productId) {
    if (!SUPABASE_CONFIGURED) return;
    await supabase
      .rpc('increment_view_count', { product_id: productId })
      .catch(() => { /* non-critical */ });
  },
};
