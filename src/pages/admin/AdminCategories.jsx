import { useState, useEffect, useCallback } from 'react';
import {
  Tag, Plus, ChevronDown, ChevronRight, Pencil, Power, PowerOff,
  RefreshCw, AlertCircle, X, Check,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { categoryAdminService } from '../../services/adminService';
import { SUPABASE_CONFIGURED } from '../../lib/supabase';
import AdminLayout, { AdminEmptyState, AdminErrorState } from '../../components/admin/AdminLayout';

// ── Inline editor form ────────────────────────────────────────
function FieldRow({ label, value, onChange, required, mono }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-medium-brown">{label}{required && ' *'}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className={`px-3 py-2 text-sm border border-sand rounded-lg outline-none focus:border-dark-brown bg-white transition-colors ${mono ? 'font-mono uppercase' : ''}`}
      />
    </div>
  );
}

function CategoryForm({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    code: initial.code || '',
    name_en: initial.name_en || '',
    name_ar: initial.name_ar || '',
    icon: initial.icon || '',
    sort_order: initial.sort_order ?? 0,
    description_en: initial.description_en || '',
    description_ar: initial.description_ar || '',
  });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, sort_order: parseInt(form.sort_order) || 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-warm-white rounded-xl border border-sand">
      <FieldRow label="Code (e.g. ARCH)" value={form.code} onChange={set('code')} required mono />
      <FieldRow label="Icon (emoji)" value={form.icon} onChange={set('icon')} />
      <FieldRow label="Name (English)" value={form.name_en} onChange={set('name_en')} required />
      <FieldRow label="Name (Arabic)" value={form.name_ar} onChange={set('name_ar')} required />
      <FieldRow label="Description (EN)" value={form.description_en} onChange={set('description_en')} />
      <FieldRow label="Description (AR)" value={form.description_ar} onChange={set('description_ar')} />
      <FieldRow label="Sort order" value={String(form.sort_order)} onChange={set('sort_order')} />
      <div className="sm:col-span-2 flex gap-2 pt-2">
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={{ background: '#B68D57', color: '#2B1B0E' }}>
          <Check size={14} /> {loading ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium border border-sand text-medium-brown hover:bg-sand transition-all">
          <X size={14} /> Cancel
        </button>
      </div>
    </form>
  );
}

function SubcategoryForm({ categoryId, initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    code: initial.code || '',
    name_en: initial.name_en || '',
    name_ar: initial.name_ar || '',
    sort_order: initial.sort_order ?? 0,
  });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ category_id: categoryId, ...form, sort_order: parseInt(form.sort_order) || 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
      <FieldRow label="Code" value={form.code} onChange={set('code')} required mono />
      <FieldRow label="Sort" value={String(form.sort_order)} onChange={set('sort_order')} />
      <FieldRow label="Name EN" value={form.name_en} onChange={set('name_en')} required />
      <FieldRow label="Name AR" value={form.name_ar} onChange={set('name_ar')} required />
      <div className="col-span-2 sm:col-span-4 flex gap-2">
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          style={{ background: '#B68D57', color: '#2B1B0E' }}>
          <Check size={12} /> {loading ? 'Saving…' : 'Save Subcategory'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs border border-sand text-medium-brown hover:bg-sand transition-all">
          <X size={12} /> Cancel
        </button>
      </div>
    </form>
  );
}

// ── Category row ──────────────────────────────────────────────
function CategoryRow({ cat, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing]   = useState(false);
  const [addSub, setAddSub]     = useState(false);
  const [editSub, setEditSub]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState(null);

  const handleUpdateCategory = async (data) => {
    setSaving(true); setErr(null);
    try {
      const updated = await categoryAdminService.updateCategory(cat.id, data);
      setEditing(false);
      onUpdated({ ...cat, ...updated });
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async () => {
    setSaving(true); setErr(null);
    try {
      const updated = await categoryAdminService.toggleCategoryActive(cat.id, !cat.is_active);
      onUpdated({ ...cat, ...updated });
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const handleAddSubcategory = async (data) => {
    setSaving(true); setErr(null);
    try {
      const sub = await categoryAdminService.createSubcategory(data);
      setAddSub(false);
      onUpdated({ ...cat, subcategories: [...(cat.subcategories || []), sub] });
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const handleUpdateSubcategory = async (subId, data) => {
    setSaving(true); setErr(null);
    try {
      const updated = await categoryAdminService.updateSubcategory(subId, data);
      setEditSub(null);
      onUpdated({
        ...cat,
        subcategories: (cat.subcategories || []).map(s => s.id === subId ? { ...s, ...updated } : s),
      });
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const handleToggleSubActive = async (sub) => {
    setSaving(true); setErr(null);
    try {
      const updated = await categoryAdminService.toggleSubcategoryActive(sub.id, !sub.is_active);
      onUpdated({
        ...cat,
        subcategories: (cat.subcategories || []).map(s => s.id === sub.id ? { ...s, ...updated } : s),
      });
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className={`rounded-2xl border transition-all ${cat.is_active ? 'border-sand bg-white' : 'border-sand bg-warm-white opacity-60'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setExpanded(e => !e)}
          className="text-light-brown hover:text-dark-brown transition-colors flex-shrink-0">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <span className="text-lg">{cat.icon || '📦'}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-dark-brown">{cat.name_en}</span>
            <span className="text-light-brown text-sm">{cat.name_ar}</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-sand text-medium-brown">{cat.code}</span>
            {!cat.is_active && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">Disabled</span>
            )}
          </div>
          <div className="text-xs text-light-brown mt-0.5">
            {(cat.subcategories || []).length} subcategories · sort {cat.sort_order}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => { setEditing(e => !e); setExpanded(true); }} title="Edit"
            className="p-1.5 rounded-lg text-medium-brown hover:bg-sand transition-all">
            <Pencil size={14} />
          </button>
          <button onClick={handleToggleActive} disabled={saving} title={cat.is_active ? 'Disable' : 'Enable'}
            className="p-1.5 rounded-lg transition-all disabled:opacity-40"
            style={{ color: cat.is_active ? '#ef4444' : '#16a34a' }}>
            {cat.is_active ? <PowerOff size={14} /> : <Power size={14} />}
          </button>
        </div>
      </div>

      {err && (
        <div className="mx-4 mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{err}</div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="px-4 pb-4">
          <CategoryForm initial={cat} onSave={handleUpdateCategory} onCancel={() => setEditing(false)} loading={saving} />
        </div>
      )}

      {/* Subcategories */}
      {expanded && !editing && (
        <div className="px-4 pb-4 space-y-2">
          {(cat.subcategories || []).sort((a, b) => a.sort_order - b.sort_order).map(sub => (
            <div key={sub.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${sub.is_active ? 'border-sand bg-warm-white' : 'border-sand opacity-50'}`}>
              {editSub === sub.id ? (
                <div className="flex-1">
                  <SubcategoryForm
                    categoryId={cat.id}
                    initial={sub}
                    onSave={(data) => handleUpdateSubcategory(sub.id, data)}
                    onCancel={() => setEditSub(null)}
                    loading={saving}
                  />
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-dark-brown">{sub.name_en}</span>
                      <span className="text-light-brown">{sub.name_ar}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sand text-medium-brown">{sub.code}</span>
                      {!sub.is_active && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600">Disabled</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditSub(sub.id)}
                      className="p-1.5 rounded-lg text-medium-brown hover:bg-sand transition-all"><Pencil size={12} /></button>
                    <button onClick={() => handleToggleSubActive(sub)} disabled={saving}
                      className="p-1.5 rounded-lg transition-all disabled:opacity-40"
                      style={{ color: sub.is_active ? '#ef4444' : '#16a34a' }}>
                      {sub.is_active ? <PowerOff size={12} /> : <Power size={12} />}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add subcategory */}
          {addSub ? (
            <SubcategoryForm
              categoryId={cat.id}
              onSave={handleAddSubcategory}
              onCancel={() => setAddSub(false)}
              loading={saving}
            />
          ) : (
            <button onClick={() => setAddSub(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-medium-brown border border-dashed border-sand hover:bg-sand transition-all">
              <Plus size={13} /> Add Subcategory
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminCategories() {
  const { t }              = useLanguage();
  const { user: me }       = useAuth();
  const [cats, setCats]    = useState([]);
  const [loading, setL]    = useState(true);
  const [error, setErr]    = useState(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) { setL(false); return; }
    setL(true); setErr(null);
    try {
      const data = await categoryAdminService.listAll();
      setCats(data);
    } catch (e) { setErr(e.message); }
    finally { setL(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    setSaving(true); setErr(null);
    try {
      const cat = await categoryAdminService.createCategory(data);
      setCats(prev => [...prev, { ...cat, subcategories: [] }]);
      setAdding(false);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const handleUpdated = (updatedCat) => {
    setCats(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
  };

  if (!['admin', 'super_admin'].includes(me?.role)) {
    return (
      <AdminLayout title="Access Denied">
        <p className="text-light-brown">{t('Admin access required.', 'مطلوب صلاحية مدير.')}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={t('Categories', 'الفئات')}
      subtitle={`${cats.length} ${t('categories', 'فئة')}`}
    >
      {/* Header actions */}
      <div className="flex items-center justify-between mb-5">
        <div />
        <div className="flex gap-2">
          <button onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-medium-brown border border-sand hover:bg-sand transition-all">
            <RefreshCw size={14} /> {t('Refresh', 'تحديث')}
          </button>
          <button onClick={() => setAdding(a => !a)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: '#B68D57', color: '#2B1B0E' }}>
            <Plus size={16} /> {t('Add Category', 'إضافة فئة')}
          </button>
        </div>
      </div>

      {!SUPABASE_CONFIGURED && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm mb-4">
          <AlertCircle size={18} className="flex-shrink-0" />
          {t('Supabase not configured.', 'Supabase غير متصل.')}
        </div>
      )}

      {/* Add category form */}
      {adding && (
        <div className="mb-5">
          <h3 className="text-sm font-bold text-dark-brown mb-3">{t('New Category', 'فئة جديدة')}</h3>
          <CategoryForm onSave={handleCreate} onCancel={() => setAdding(false)} loading={saving} />
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error && !adding ? (
        <AdminErrorState message={error} onRetry={load} />
      ) : cats.length === 0 ? (
        <AdminEmptyState icon={Tag} message={t('No categories found.', 'لا توجد فئات.')} />
      ) : (
        <div className="space-y-3">
          {cats.sort((a, b) => a.sort_order - b.sort_order).map(cat => (
            <CategoryRow key={cat.id} cat={cat} onUpdated={handleUpdated} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
