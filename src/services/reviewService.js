import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';
import * as mock from './productsService';

export const reviewService = {
  async getPendingProducts() {
    if (!SUPABASE_CONFIGURED) return mock.getPendingProducts();
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(code, name_ar, name_en),
        subcategories(code, name_ar, name_en),
        product_images(image_path, is_primary),
        product_files(file_format, software_name, file_size)
      `)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getAllForReview({ status } = {}) {
    if (!SUPABASE_CONFIGURED) return mock.getAllProducts();
    let q = supabase
      .from('products')
      .select(`
        *,
        categories(code, name_ar, name_en),
        subcategories(code, name_ar, name_en),
        product_images(image_path, is_primary)
      `)
      .order('updated_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  async approveProduct(productId, adminId, notes = '') {
    if (!SUPABASE_CONFIGURED) return mock.approveProduct(productId);
    const { data, error } = await supabase
      .from('products')
      .update({
        status: 'approved',
        visibility: 'public',
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        admin_notes: notes,
      })
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;

    await supabase.from('product_review_actions').insert({
      product_id: productId,
      reviewer_id: adminId,
      action: 'approved',
      notes,
    });

    return data;
  },

  async rejectProduct(productId, adminId, reason) {
    if (!SUPABASE_CONFIGURED) return mock.rejectProduct(productId, reason);
    const { data, error } = await supabase
      .from('products')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        admin_notes: reason,
      })
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;

    await supabase.from('product_review_actions').insert({
      product_id: productId,
      reviewer_id: adminId,
      action: 'rejected',
      notes: reason,
    });

    return data;
  },

  async requestRevision(productId, adminId, notes) {
    if (!SUPABASE_CONFIGURED) return;
    const { data, error } = await supabase
      .from('products')
      .update({ status: 'revision_required', rejection_reason: notes, admin_notes: notes })
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;

    await supabase.from('product_review_actions').insert({
      product_id: productId,
      reviewer_id: adminId,
      action: 'revision_requested',
      notes,
    });

    return data;
  },

  async getReviewHistory(productId) {
    if (!SUPABASE_CONFIGURED) return [];
    const { data, error } = await supabase
      .from('product_review_actions')
      .select('*, profiles(full_name, avatar_url)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getReviewStats() {
    if (!SUPABASE_CONFIGURED) {
      const all = mock.getAllProducts();
      return {
        pending: all.filter(p => p.status === 'pending_review').length,
        approved: all.filter(p => p.status === 'approved').length,
        rejected: all.filter(p => p.status === 'rejected').length,
        draft: all.filter(p => p.status === 'draft').length,
      };
    }
    const { data, error } = await supabase
      .from('products')
      .select('status');
    if (error) throw error;
    return data.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, { pending_review: 0, approved: 0, rejected: 0, draft: 0 });
  },
};
