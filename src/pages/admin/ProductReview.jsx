import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, MessageSquare, Eye, BadgeCheck,
  Home, Search, ChevronDown, Package, Shield, X, ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { reviewService } from '../../services/reviewService';
import { productService } from '../../services/productService';
import { seedDemoProducts } from '../../services/productsService';
import { SUPABASE_CONFIGURED } from '../../lib/supabase';
import { CATEGORIES } from '../../data/categoriesData';
import { fadeInUp, viewport } from '../../utils/animations';

const STATUS_TABS = [
  { id: 'all',            labelEn: 'All',              labelAr: 'الكل',              color: '#374151' },
  { id: 'pending_review', labelEn: 'Pending Review',   labelAr: 'قيد المراجعة',      color: '#d97706' },
  { id: 'approved',       labelEn: 'Approved',         labelAr: 'معتمد',              color: '#16a34a' },
  { id: 'rejected',       labelEn: 'Rejected',         labelAr: 'مرفوض',              color: '#ef4444' },
  { id: 'draft',          labelEn: 'Drafts',           labelAr: 'مسودات',             color: '#6B7280' },
];

const STATUS_CONFIG = {
  draft:          { bg: '#F3F4F6', color: '#374151' },
  pending_review: { bg: '#FEF3C7', color: '#92400E' },
  approved:       { bg: '#D1FAE5', color: '#065F46' },
  rejected:       { bg: '#FEE2E2', color: '#991B1B' },
  archived:       { bg: '#F3F4F6', color: '#6B7280' },
};

const GOLD = '#B68D57';
const DARK = '#2B1B0E';
const IVORY = '#F7F4EF';
const SAND = '#D6C2A1';
const BEIGE = '#EBDFD1';

function RejectModal({ product, onConfirm, onClose, lang }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl p-6 border"
        style={{ background: '#2B1B0E', borderColor: '#ef444430' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">{lang === 'ar' ? 'رفض المنتج' : 'Reject Product'}</h3>
          <button onClick={onClose} style={{ color: '#6A5A48' }}><X size={18} /></button>
        </div>
        <p className="text-sm mb-3" style={{ color: '#C4A882' }}>
          {product.product_name_en}
        </p>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder={lang === 'ar' ? 'سبب الرفض (مطلوب)…' : 'Rejection reason (required)…'}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border text-sm resize-none outline-none mb-4"
          style={{ background: '#1A1008', borderColor: '#3A2A18', color: 'white', fontFamily: 'Cairo, sans-serif' }} />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
            style={{ borderColor: '#3A2A18', color: '#8A7A68' }}>
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={() => reason.trim() && onConfirm(reason)} disabled={!reason.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: '#ef4444', color: 'white' }}>
            {lang === 'ar' ? 'تأكيد الرفض' : 'Confirm Reject'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ProductDetailPanel({ product, onClose, onApprove, onReject, lang }) {
  if (!product) return null;
  const cat = CATEGORIES.find(c => c.id === product.category_id);
  const sc = STATUS_CONFIG[product.status] || STATUS_CONFIG.draft;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30 }}
        className="w-full max-w-lg h-full overflow-y-auto border-l"
        style={{ background: IVORY, borderColor: SAND }}>
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b"
          style={{ background: IVORY, borderColor: SAND }}>
          <div>
            <h2 className="font-bold text-base" style={{ color: DARK, fontFamily: 'Cairo, sans-serif' }}>
              {product.product_name_en}
            </h2>
            <p className="text-xs mt-0.5 font-mono font-bold" style={{ color: GOLD }}>
              {product.buod_reference || '—'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:opacity-70"
            style={{ background: BEIGE, color: DARK }}><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: sc.bg, color: sc.color }}>
              {product.status.replace('_', ' ').toUpperCase()}
            </span>
            {product.verification_status !== 'unverified' && (
              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: GOLD }}>
                <BadgeCheck size={13} /> {product.verification_status.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Rejection reason */}
          {product.status === 'rejected' && product.rejection_reason && (
            <div className="p-4 rounded-xl border" style={{ background: '#fee2e2', borderColor: '#fca5a5' }}>
              <p className="text-xs font-bold text-red-700 mb-1">Rejection Reason:</p>
              <p className="text-sm text-red-800">{product.rejection_reason}</p>
            </div>
          )}

          {/* Info rows */}
          {[
            { label: 'Category',      value: cat ? `${cat.icon} ${cat.nameEn}` : '—' },
            { label: 'Brand',         value: product.brand_name || '—' },
            { label: 'Model No.',     value: product.model_number || '—' },
            { label: 'Origin',        value: product.country_of_origin || '—' },
            { label: 'Unit',          value: product.unit || '—' },
            { label: 'Pricing',       value: product.is_free ? 'Free' : `${product.price} ${product.currency}` },
            { label: 'License',       value: product.license_type || '—' },
            { label: 'Rights OK',     value: product.rights_confirmed ? '✓ Yes' : '✗ No' },
            { label: 'Created',       value: product.created_at },
            { label: 'Downloads',     value: product.download_count || 0 },
            { label: 'Views',         value: product.view_count || 0 },
          ].map((r, i) => (
            <div key={i} className="flex justify-between py-2 border-b text-sm" style={{ borderColor: SAND }}>
              <span style={{ color: '#6E5847' }}>{r.label}</span>
              <span className="font-semibold" style={{ color: DARK }}>{r.value}</span>
            </div>
          ))}

          {/* Short description */}
          {product.short_description_en && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6E5847' }}>Description</p>
              <p className="text-sm leading-relaxed" style={{ color: DARK }}>{product.short_description_en}</p>
            </div>
          )}

          {/* Materials */}
          {product.materials?.filter(m => m.material_name_en).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6E5847' }}>Materials</p>
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: SAND }}>
                {product.materials.filter(m => m.material_name_en).map((m, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b text-sm last:border-0"
                    style={{ borderColor: SAND, background: i % 2 === 0 ? 'white' : IVORY }}>
                    <span style={{ color: DARK }}>{m.material_name_en}</span>
                    <span style={{ color: '#6E5847' }}>{m.quantity_per_product} {m.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {product.files?.filter(f => f.file_name_original).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6E5847' }}>Files</p>
              {product.files.filter(f => f.file_name_original).map((f, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: SAND }}>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono" style={{ background: GOLD + '20', color: DARK }}>.{f.file_format?.toLowerCase()}</span>
                  <span className="text-xs flex-1 truncate" style={{ color: DARK }}>{f.file_name_original}</span>
                  <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{f.software_name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Specs */}
          {product.specifications?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6E5847' }}>Specifications</p>
              <div className="grid grid-cols-2 gap-2">
                {product.specifications.map((s, i) => (
                  <div key={i} className="p-2 rounded-lg border" style={{ background: 'white', borderColor: SAND }}>
                    <div className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#9CA3AF' }}>{s.specification_name_en}</div>
                    <div className="text-sm font-bold" style={{ color: DARK }}>{s.value} {s.unit}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {product.status === 'pending_review' && (
            <div className="flex gap-3 pt-2">
              <button onClick={() => onReject(product)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                style={{ background: '#fee2e2', color: '#991B1B' }}>
                <XCircle size={16} />
                Reject
              </button>
              <button onClick={() => onApprove(product.id)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                style={{ background: '#d1fae5', color: '#065F46' }}>
                <CheckCircle size={16} />
                Approve
              </button>
            </div>
          )}

          {/* Verify controls */}
          {product.status === 'approved' && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6E5847' }}>Verification Status</p>
              <div className="flex flex-wrap gap-2">
                {['unverified','verified','manufacturer_verified','supplier_verified'].map(v => (
                  <button key={v} onClick={() => productService.updateProduct(product.id, { verification_status: v })}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
                    style={{
                      background: product.verification_status === v ? GOLD + '20' : 'white',
                      borderColor: product.verification_status === v ? GOLD : SAND,
                      color: product.verification_status === v ? DARK : '#6E5847',
                    }}>
                    {v.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Visibility toggle */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6E5847' }}>Visibility</p>
            <div className="flex gap-2">
              {['private','public','unlisted'].map(v => (
                <button key={v} onClick={() => productService.updateProduct(product.id, { visibility: v })}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
                  style={{
                    background: product.visibility === v ? GOLD + '20' : 'white',
                    borderColor: product.visibility === v ? GOLD : SAND,
                    color: DARK,
                  }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────
export default function ProductReview() {
  const { t, lang }  = useLanguage();
  const { isAdmin }  = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('pending_review');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [rejectTarget, setRejT] = useState(null);

  const reload = () => {
    if (!SUPABASE_CONFIGURED) seedDemoProducts();
    reviewService.getAllForReview().then(ps => { setProducts(ps); setLoading(false); });
  };
  useEffect(reload, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (tab !== 'all') list = list.filter(p => p.status === tab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.product_name_en?.toLowerCase().includes(q) ||
        p.product_name_ar?.includes(q) ||
        p.buod_reference?.includes(q)
      );
    }
    return list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }, [products, tab, search]);

  const counts = useMemo(() => {
    const c = {};
    STATUS_TABS.forEach(t => { c[t.id] = t.id === 'all' ? products.length : products.filter(p => p.status === t.id).length; });
    return c;
  }, [products]);

  const handleApprove = async (id) => {
    await reviewService.approveProduct(id, user?.id);
    reload();
    setSelected(null);
  };

  const handleRejectConfirm = async (reason) => {
    await reviewService.rejectProduct(rejectTarget.id, user?.id, reason);
    setRejT(null);
    setSelected(null);
    reload();
  };

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A1008' }}>
        <div className="text-center">
          <Shield size={48} style={{ color: '#B68D57', margin: '0 auto 16px' }} />
          <p className="text-white font-bold text-xl">Admin Access Required</p>
          <p className="text-sm mt-2 mb-5" style={{ color: '#8A7A68' }}>
            You need admin role to access this page.
          </p>
          <Link to="/" className="text-sm font-semibold hover:underline" style={{ color: '#B68D57' }}>← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#1A1008' }}>
      {/* Top bar */}
      <div className="border-b" style={{ borderColor: '#3A2A18', background: '#2B1B0E' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold hover:opacity-80"
              style={{ color: GOLD }}><Home size={15} /> BUAD</Link>
            <span style={{ color: '#4A3A28' }}>/</span>
            <span className="text-white font-bold">Product Review Admin</span>
          </div>
          <Link to="/my-products" className="text-xs px-4 py-2 rounded-lg font-semibold border hover:opacity-80"
            style={{ borderColor: '#3A2A18', color: GOLD }}>My Products</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {STATUS_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="rounded-xl p-4 border text-left transition-all hover:opacity-90"
              style={{
                background: tab === t.id ? GOLD + '18' : '#2B1B0E',
                borderColor: tab === t.id ? GOLD + '50' : '#3A2A18',
              }}>
              <div className="text-2xl font-black" style={{ color: t.color }}>{counts[t.id] || 0}</div>
              <div className="text-[10px] uppercase tracking-widest mt-1" style={{ color: '#6A5A48' }}>
                {lang === 'ar' ? t.labelAr : t.labelEn}
              </div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 left-3" style={{ color: '#6A5A48' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or BUAD ref…"
            className="w-full max-w-md pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ background: '#2B1B0E', borderColor: '#3A2A18', color: 'white', fontFamily: 'Cairo, sans-serif' }} />
        </div>

        {/* Table */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#3A2A18' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#2B1B0E' }}>
                  {['Product','BUAD Ref','Category','Status','Verify','Files','Created','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold"
                      style={{ color: '#6A5A48' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-12" style={{ color: GOLD }}>Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <Package size={36} style={{ color: '#3A2A18', margin: '0 auto 12px' }} />
                      <p style={{ color: '#6A5A48' }}>No products in this view</p>
                    </td>
                  </tr>
                ) : filtered.map((p, i) => {
                  const cat = CATEGORIES.find(c => c.id === p.category_id);
                  const sc  = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft;
                  return (
                    <motion.tr key={p.id} variants={fadeInUp} initial="hidden" whileInView="visible"
                      viewport={viewport}
                      className="border-t transition-colors cursor-pointer hover:opacity-80"
                      style={{ borderColor: '#3A2A18', background: i % 2 === 0 ? '#1A1008' : '#211408' }}
                      onClick={() => setSelected(p)}>
                      <td className="px-4 py-3 max-w-[180px]">
                        <div className="font-bold text-white text-sm truncate">{p.product_name_en}</div>
                        <div className="text-[11px] truncate mt-0.5" style={{ color: '#8A7A68', fontFamily: 'Cairo, sans-serif' }}>{p.product_name_ar}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold" style={{ color: GOLD }}>
                          {p.buod_reference || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#C4A882' }}>
                        {cat ? `${cat.icon} ${cat.nameEn}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: sc.bg, color: sc.color }}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: p.verification_status !== 'unverified' ? GOLD : '#4A3A28' }}>
                          {p.verification_status?.replace(/_/g, ' ') || 'unverified'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold" style={{ color: '#C4A882' }}>
                        {p.files?.filter(f => f.file_name_original).length || 0}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#6A5A48' }}>{p.created_at}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setSelected(p)}
                            className="p-1.5 rounded-lg hover:opacity-80" style={{ background: '#2B1B0E', color: GOLD }}>
                            <Eye size={13} />
                          </button>
                          {p.status === 'pending_review' && (
                            <>
                              <button onClick={() => handleApprove(p.id)}
                                className="p-1.5 rounded-lg hover:opacity-80" style={{ background: '#dcfce7', color: '#16a34a' }}>
                                <CheckCircle size={13} />
                              </button>
                              <button onClick={() => setRejT(p)}
                                className="p-1.5 rounded-lg hover:opacity-80" style={{ background: '#fee2e2', color: '#ef4444' }}>
                                <XCircle size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <ProductDetailPanel
          product={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={(p) => { setRejT(p); }}
          lang={lang}
        />
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          product={rejectTarget}
          onConfirm={handleRejectConfirm}
          onClose={() => setRejT(null)}
          lang={lang}
        />
      )}
    </div>
  );
}
