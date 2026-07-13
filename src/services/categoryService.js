import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';
import { CATEGORIES, SUBCATEGORIES } from '../data/categoriesData';

export const categoryService = {
  async getAllCategories() {
    if (!SUPABASE_CONFIGURED) {
      return CATEGORIES.map(c => ({
        id: c.id || c.code,
        code: c.code,
        name_ar: c.nameAr,
        name_en: c.nameEn,
        icon: c.icon,
        sort_order: c.sortOrder || 0,
      }));
    }
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data;
  },

  async getSubcategories(categoryId) {
    if (!SUPABASE_CONFIGURED) {
      // Fall back to local data — find by code match
      const cat = CATEGORIES.find(c => c.id === categoryId || c.code === categoryId);
      if (!cat) return [];
      const subs = SUBCATEGORIES[cat.code] || [];
      return subs.map(s => ({
        id: s.id || s.code,
        category_id: categoryId,
        code: s.code,
        name_ar: s.nameAr,
        name_en: s.nameEn,
        sort_order: s.sortOrder || 0,
      }));
    }
    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data;
  },

  async getCategoryByCode(code) {
    if (!SUPABASE_CONFIGURED) {
      const cat = CATEGORIES.find(c => c.code === code);
      if (!cat) return null;
      return { id: cat.id || cat.code, code: cat.code, name_ar: cat.nameAr, name_en: cat.nameEn };
    }
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('code', code)
      .single();
    if (error) throw error;
    return data;
  },

  async getAllWithSubcategories() {
    if (!SUPABASE_CONFIGURED) {
      return CATEGORIES.map(cat => ({
        id: cat.id || cat.code,
        code: cat.code,
        name_ar: cat.nameAr,
        name_en: cat.nameEn,
        icon: cat.icon,
        subcategories: (SUBCATEGORIES[cat.code] || []).map(s => ({
          id: s.id || s.code,
          code: s.code,
          name_ar: s.nameAr,
          name_en: s.nameEn,
        })),
      }));
    }
    const { data, error } = await supabase
      .from('categories')
      .select('*, subcategories(*)')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data;
  },
};
