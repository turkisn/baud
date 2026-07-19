import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

// ── Constants ─────────────────────────────────────────────────
const PAGE_SIZE = 25;

// ── Users ─────────────────────────────────────────────────────
export const userAdminService = {
  async list({ role = null, search = '', page = 0 } = {}) {
    if (!SUPABASE_CONFIGURED) return { data: [], count: 0 };
    let q = supabase
      .from('profiles')
      .select('id, full_name, email, role, company_name, phone, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (role) q = q.eq('role', role);
    if (search) {
      q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    const { data, error, count } = await q;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  },

  async setRole(targetUserId, newRole) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { error } = await supabase.rpc('admin_set_user_role', {
      target_user_id: targetUserId,
      new_role: newRole,
    });
    if (error) throw error;
    await logAction('user.role_change', 'user', targetUserId, { new_role: newRole });
  },

  async getById(userId) {
    if (!SUPABASE_CONFIGURED) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },
};

// ── Suppliers ─────────────────────────────────────────────────
export const supplierAdminService = {
  async list({ search = '', verificationStatus = null, page = 0 } = {}) {
    if (!SUPABASE_CONFIGURED) return { data: [], count: 0 };
    let q = supabase
      .from('suppliers')
      .select(
        'id, company_name_en, company_name_ar, email, phone, city, country, website, verification_status, created_at, owner_id',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (verificationStatus) q = q.eq('verification_status', verificationStatus);
    if (search) {
      q = q.or(`company_name_en.ilike.%${search}%,company_name_ar.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await q;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  },

  async verify(supplierId, newStatus, notes = null) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { error } = await supabase.rpc('admin_verify_entity', {
      p_entity_type: 'supplier',
      p_entity_id:   supplierId,
      p_new_status:  newStatus,
      p_notes:       notes,
    });
    if (error) throw error;
  },

  async getProductCount(supplierId) {
    if (!SUPABASE_CONFIGURED) return 0;
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', supplierId);
    if (error) return 0;
    return count ?? 0;
  },
};

// ── Manufacturers ─────────────────────────────────────────────
export const manufacturerAdminService = {
  async list({ search = '', verificationStatus = null, page = 0 } = {}) {
    if (!SUPABASE_CONFIGURED) return { data: [], count: 0 };
    let q = supabase
      .from('manufacturers')
      .select(
        'id, company_name_en, company_name_ar, email, phone, city, country, website, verification_status, created_at, owner_id',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (verificationStatus) q = q.eq('verification_status', verificationStatus);
    if (search) {
      q = q.or(`company_name_en.ilike.%${search}%,company_name_ar.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await q;
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  },

  async verify(manufacturerId, newStatus, notes = null) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { error } = await supabase.rpc('admin_verify_entity', {
      p_entity_type: 'manufacturer',
      p_entity_id:   manufacturerId,
      p_new_status:  newStatus,
      p_notes:       notes,
    });
    if (error) throw error;
  },

  async getProductCount(manufacturerId) {
    if (!SUPABASE_CONFIGURED) return 0;
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('manufacturer_id', manufacturerId);
    if (error) return 0;
    return count ?? 0;
  },
};

// ── Categories (admin CRUD) ────────────────────────────────────
export const categoryAdminService = {
  async listAll() {
    if (!SUPABASE_CONFIGURED) return [];
    const { data, error } = await supabase
      .from('categories')
      .select('*, subcategories(id, code, name_ar, name_en, sort_order, is_active)')
      .order('sort_order');
    if (error) throw error;
    return data ?? [];
  },

  async createCategory({ code, name_ar, name_en, description_ar, description_en, icon, sort_order }) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('categories')
      .insert({ code: code.toUpperCase(), name_ar, name_en, description_ar, description_en, icon, sort_order: sort_order ?? 0, is_active: true })
      .select()
      .single();
    if (error) throw error;
    await logAction('category.create', 'category', data.id, { code, name_en });
    return data;
  },

  async updateCategory(categoryId, updates) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();
    if (error) throw error;
    await logAction('category.update', 'category', categoryId, updates);
    return data;
  },

  async toggleCategoryActive(categoryId, isActive) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('categories')
      .update({ is_active: isActive })
      .eq('id', categoryId)
      .select()
      .single();
    if (error) throw error;
    await logAction(isActive ? 'category.enable' : 'category.disable', 'category', categoryId);
    return data;
  },

  async createSubcategory({ category_id, code, name_ar, name_en, sort_order }) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('subcategories')
      .insert({ category_id, code: code.toUpperCase(), name_ar, name_en, sort_order: sort_order ?? 0, is_active: true })
      .select()
      .single();
    if (error) throw error;
    await logAction('subcategory.create', 'subcategory', data.id, { code, name_en, category_id });
    return data;
  },

  async updateSubcategory(subcategoryId, updates) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('subcategories')
      .update(updates)
      .eq('id', subcategoryId)
      .select()
      .single();
    if (error) throw error;
    await logAction('subcategory.update', 'subcategory', subcategoryId, updates);
    return data;
  },

  async toggleSubcategoryActive(subcategoryId, isActive) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('subcategories')
      .update({ is_active: isActive })
      .eq('id', subcategoryId)
      .select()
      .single();
    if (error) throw error;
    await logAction(isActive ? 'subcategory.enable' : 'subcategory.disable', 'subcategory', subcategoryId);
    return data;
  },
};

// ── Stats ─────────────────────────────────────────────────────
export const adminStatsService = {
  async getOverviewStats() {
    if (!SUPABASE_CONFIGURED) {
      return { users: 0, products: 0, pending: 0, approved: 0, rejected: 0, revision: 0, suppliers: 0, manufacturers: 0, designers: 0 };
    }

    const [users, productStats, suppliers, manufacturers, designers] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('status'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'supplier'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'manufacturer'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'designer'),
    ]);

    const pStats = (productStats.data ?? []).reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    return {
      users:         users.count         ?? 0,
      products:      (productStats.data ?? []).length,
      pending:       pStats.pending_review ?? 0,
      approved:      pStats.approved       ?? 0,
      rejected:      pStats.rejected       ?? 0,
      revision:      pStats.revision_required ?? 0,
      draft:         pStats.draft          ?? 0,
      suppliers:     suppliers.count      ?? 0,
      manufacturers: manufacturers.count  ?? 0,
      designers:     designers.count      ?? 0,
    };
  },
};

// ── Audit Log ─────────────────────────────────────────────────
export const auditLogService = {
  async list({ page = 0 } = {}) {
    if (!SUPABASE_CONFIGURED) return { data: [], count: 0 };
    const { data, error, count } = await supabase
      .from('admin_audit_log')
      .select('*, actor:profiles!actor_user_id(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  },
};

// ── Internal: non-blocking audit log helper ───────────────────
async function logAction(action, targetType, targetId, metadata = {}) {
  if (!SUPABASE_CONFIGURED) return;
  await supabase
    .rpc('admin_log_action', {
      p_action:      action,
      p_target_type: targetType,
      p_target_id:   targetId,
      p_metadata:    metadata,
    })
    .catch(() => {
      // Non-blocking — a logging failure must never block the admin action
    });
}
