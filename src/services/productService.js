import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';
import * as mock from './productsService';

// ── helpers ───────────────────────────────────────────────────
function mapMockToDb(p) { return p; } // mock already matches display shape

// ── public ────────────────────────────────────────────────────
export const productService = {
  // ── My Products ──────────────────────────────────────────────
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

  // ── Create product (draft or pending_review) ─────────────────
  async createProduct(userId, productData) {
    if (!SUPABASE_CONFIGURED) return mock.createProduct(userId, productData);
    const { images = [], files = [], specifications = [], materials = [], components = [], ...core } = productData;
    const { data: product, error } = await supabase
      .from('products')
      .insert({ ...core, created_by: userId })
      .select()
      .single();
    if (error) throw error;

    if (images.length > 0) {
      await supabase.from('product_images').insert(
        images.map((img, i) => ({
          product_id: product.id,
          image_path: img.path || img.url,
          image_type: img.type || 'render',
          sort_order: i,
          is_primary: i === 0,
        }))
      );
    }

    if (files.length > 0) {
      await supabase.from('product_files').insert(
        files.map(f => ({
          product_id: product.id,
          file_path: f.path,
          original_file_name: f.name,
          file_size: f.size,
          file_format: (f.name?.split('.').pop() || 'OTHER').toUpperCase(),
          software_name: f.software,
          software_version: f.softwareVersion,
          file_type: f.fileType || 'block',
        }))
      );
    }

    if (specifications.length > 0) {
      await supabase.from('product_specifications').insert(
        specifications.map((s, i) => ({
          product_id: product.id,
          specification_name_ar: s.nameAr,
          specification_name_en: s.nameEn,
          specification_code: s.code,
          value: s.value,
          unit: s.unit,
          sort_order: i,
        }))
      );
    }

    if (materials.length > 0) {
      await supabase.from('product_materials').insert(
        materials.map(m => ({
          product_id: product.id,
          material_name_ar: m.nameAr,
          material_name_en: m.nameEn,
          material_type: m.type,
          finish: m.finish,
          color: m.color,
          quantity_per_product: m.quantity,
          unit: m.unit,
        }))
      );
    }

    if (components.length > 0) {
      await supabase.from('product_components').insert(
        components.map(c => ({
          product_id: product.id,
          component_name_ar: c.nameAr,
          component_name_en: c.nameEn,
          quantity: c.quantity,
          unit: c.unit,
        }))
      );
    }

    return product;
  },

  // ── Update product ────────────────────────────────────────────
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

  // ── Submit for review (changes status → triggers BUOD ref) ───
  async submitForReview(productId) {
    if (!SUPABASE_CONFIGURED) return mock.submitForReview(productId);
    const { data, error } = await supabase
      .from('products')
      .update({ status: 'pending_review' })
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ── Delete product ────────────────────────────────────────────
  async deleteProduct(productId) {
    if (!SUPABASE_CONFIGURED) return mock.deleteProduct(productId);
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
  },

  // ── Public library (approved + public) ───────────────────────
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

  // ── Get single product by id ──────────────────────────────────
  async getProductById(productId) {
    if (!SUPABASE_CONFIGURED) {
      const all = mock.getAllProducts();
      return all.find(p => p.id === productId) || null;
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

  // ── Increment view count ──────────────────────────────────────
  async incrementViewCount(productId) {
    if (!SUPABASE_CONFIGURED) return;
    await supabase.rpc('increment_view_count', { product_id: productId }).catch(() => {
      // non-critical — ignore errors
    });
  },
};
