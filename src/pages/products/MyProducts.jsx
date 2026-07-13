import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Search, Filter, Eye, Pencil, Send, Archive,
  BadgeCheck, Copy, Check, ChevronDown, Package,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { seedDemoProducts } from '../../services/productsService';
import { CATEGORIES } from '../../data/categoriesData';
import { fadeInUp, viewport } from '../../utils/animations';

const GOLD  = '#B68D57';
const DARK  = '#2B1B0E';
const IVORY = '#F7F4EF';
const SAND  = '#D6C2A1';
const BEIGE = '#EBDFD1';

const STATUS_CONFIG = {
  draft:          { labelEn: 'Draft',            labelAr: 'مسودة',          bg: '#F3F4F6', color: '#374151' },
  pending_review: { labelEn: 'Pending Review',   labelAr: 'قيد المراجعة',   bg: '#FEF3C7', color: '#92400E' },
  approved:       { labelEn: 'Approved',         labelAr: 'معتمد',           bg: '#D1FAE5', color: '#065F46' },
  rejected:       { labelEn: 'Rejected',         labelAr: 'مرفوض',           bg: '#FEE2E2', color: '#991B1B' },
  archived:       { labelEn: 'Archived',         labelAr: 'مؤرشف',           bg: '#F3F4F6', color: '#6B7280' },
};

const VERIFY_CONFIG = {
  unverified:           { labelEn: 'Unverified',           labelAr: 'غير موثق',           color: '#9CA3AF' },
  verified:             { labelEn: 'Verified',             labelAr: 'موثق',                color: GOLD },
  manufacturer_verified:{ labelEn: 'Manufacturer Verified',labelAr: 'موثق من المصنع',      color: '#0696D7' },
  supplier_verified:    { labelEn: 'Supplier Verified',    labelAr: 'موثق من المورد',       color: '#5A8A2A' },
};

function StatusBadge({ status, lang }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {lang === 'ar' ? cfg.labelAr : cfg.labelEn}
    </span>
  );
}

function RefBadge({ buodRef }) {
  const [copied, setCopied] = useState(false);
  if (!buodRef) return <span className="text-xs text-gray-400">—</span>;
  const copy = () => {
    navigator.clipboard.writeText(buodRef).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 font-mono text-xs font-bold hover:opacity-70 transition-all"
      style={{ color: DARK }}>
      {buodRef}
      {copied ? <Check size={11} style={{ color: '#16a34a' }} /> : <Copy size={11} style={{ color: GOLD }} />}
    </button>
  );
}

export default function MyProducts() {
  const { t, lang }  = useLanguage();
  const { user }     = useAuth();
  const navigate     = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusF, setStatusF]   = useState('all');
  const [catF, setCatF]         = useState('all');
  const [sort, setSort]         = useState('created_at');
  const [submitting, setSub]    = useState(null);

  useEffect(() => {
    seedDemoProducts(user?.id || 'u-supplier');
    productService.getMyProducts(user?.id || 'u-supplier').then(ps => {
      setProducts(ps);
      setLoading(false);
    });
  }, [user]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (statusF !== 'all') list = list.filter(p => p.status === statusF);
    if (catF !== 'all')    list = list.filter(p => p.category_id === catF);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.product_name_en?.toLowerCase().includes(q) ||
        p.product_name_ar?.includes(q) ||
        p.buod_reference?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sort === 'created_at') return (b.created_at || '').localeCompare(a.created_at || '');
      if (sort === 'name')       return (a.product_name_en || '').localeCompare(b.product_name_en || '');
      if (sort === 'views')      return (b.view_count || 0) - (a.view_count || 0);
      return 0;
    });
    return list;
  }, [products, statusF, catF, search, sort]);

  const stats = useMemo(() => ({
    total:    products.length,
    approved: products.filter(p => p.status === 'approved').length,
    pending:  products.filter(p => p.status === 'pending_review').length,
    draft:    products.filter(p => p.status === 'draft').length,
  }), [products]);

  const handleSubmit = async (id) => {
    setSub(id);
    await productService.submitForReview(id);
    const updated = await productService.getMyProducts(user?.id || 'u-supplier');
    setProducts(updated);
    setSub(null);
  };

  const usedCats = [...new Set(products.map(p => p.category_id).filter(Boolean))];

  return (
    <div className="min-h-screen" style={{ background: BEIGE }}>
      {/* Header */}
      <div className="border-b" style={{ background: DARK, borderColor: '#3A2A18' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="font-black text-white text-2xl" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {t('My Products', 'منتجاتي')}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#B68D57' }}>
              {t('Manage your product catalog', 'إدارة كتالوج منتجاتك')}
            </p>
          </div>
          <Link to="/products/add"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
            style={{ background: GOLD, color: DARK }}>
            <Plus size={16} />
            {t('Add Product', 'إضافة منتج')}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: t('Total', 'الكل'),        value: stats.total,    color: DARK },
            { label: t('Approved', 'معتمد'),     value: stats.approved, color: '#16a34a' },
            { label: t('Pending', 'قيد المراجعة'),value: stats.pending, color: '#d97706' },
            { label: t('Drafts', 'مسودات'),      value: stats.draft,    color: '#6B7280' },
          ].map((s, i) => (
            <motion.div key={i} variants={fadeInUp} initial="hidden" animate="visible"
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-4 border" style={{ background: 'white', borderColor: SAND }}>
              <div className="text-3xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: '#6E5847' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute top-1/2 -translate-y-1/2 left-3" style={{ color: '#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('Search by name or BUOD ref…', 'ابحث بالاسم أو الرقم المرجعي…')}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ background: 'white', borderColor: SAND, fontFamily: 'Cairo, sans-serif' }} />
          </div>
          <div className="relative">
            <select value={statusF} onChange={e => setStatusF(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2.5 rounded-xl border text-sm outline-none cursor-pointer"
              style={{ background: 'white', borderColor: SAND }}>
              <option value="all">{t('All Statuses', 'كل الحالات')}</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{lang === 'ar' ? v.labelAr : v.labelEn}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute top-1/2 -translate-y-1/2 right-2.5 pointer-events-none" style={{ color: '#9CA3AF' }} />
          </div>
          <div className="relative">
            <select value={catF} onChange={e => setCatF(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2.5 rounded-xl border text-sm outline-none cursor-pointer"
              style={{ background: 'white', borderColor: SAND }}>
              <option value="all">{t('All Categories', 'كل التصنيفات')}</option>
              {usedCats.map(id => {
                const c = CATEGORIES.find(c => c.id === id);
                return c ? <option key={id} value={id}>{c.icon} {lang === 'ar' ? c.nameAr : c.nameEn}</option> : null;
              })}
            </select>
            <ChevronDown size={12} className="absolute top-1/2 -translate-y-1/2 right-2.5 pointer-events-none" style={{ color: '#9CA3AF' }} />
          </div>
          <div className="relative">
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2.5 rounded-xl border text-sm outline-none cursor-pointer"
              style={{ background: 'white', borderColor: SAND }}>
              <option value="created_at">{t('Newest First', 'الأحدث أولاً')}</option>
              <option value="name">{t('Name A–Z', 'الاسم أ–ي')}</option>
              <option value="views">{t('Most Viewed', 'الأكثر مشاهدة')}</option>
            </select>
            <ChevronDown size={12} className="absolute top-1/2 -translate-y-1/2 right-2.5 pointer-events-none" style={{ color: '#9CA3AF' }} />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20"><p style={{ color: GOLD }}>Loading…</p></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border" style={{ background: 'white', borderColor: SAND }}>
            <Package size={40} style={{ color: SAND, margin: '0 auto 12px' }} />
            <p className="font-semibold" style={{ color: DARK }}>{t('No products found', 'لا توجد منتجات')}</p>
            <p className="text-sm mt-2 mb-5" style={{ color: '#6E5847' }}>
              {t('Add your first product to get started', 'أضف أول منتج للبدء')}
            </p>
            <Link to="/products/add"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: GOLD, color: DARK }}>
              <Plus size={15} /> {t('Add Product', 'إضافة منتج')}
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: SAND }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: DARK }}>
                    {[
                      t('Product', 'المنتج'), t('BUAD Ref', 'الرقم المرجعي'),
                      t('Category', 'التصنيف'), t('Status', 'الحالة'),
                      t('Verification', 'التحقق'), t('Files', 'الملفات'),
                      t('Views', 'المشاهدات'), t('Date', 'التاريخ'), t('Actions', 'الإجراءات'),
                    ].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold"
                        style={{ color: '#8A7A68' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const cat = CATEGORIES.find(c => c.id === p.category_id);
                    const vc  = VERIFY_CONFIG[p.verification_status] || VERIFY_CONFIG.unverified;
                    return (
                      <motion.tr key={p.id} variants={fadeInUp} initial="hidden" whileInView="visible"
                        viewport={viewport}
                        className="border-t hover:opacity-90 transition-all"
                        style={{ borderColor: SAND, background: i % 2 === 0 ? 'white' : IVORY }}>
                        <td className="px-4 py-3 max-w-[200px]">
                          <div className="font-bold text-sm truncate" style={{ color: DARK }}>{p.product_name_en}</div>
                          <div className="text-xs truncate mt-0.5" style={{ color: '#6E5847', fontFamily: 'Cairo, sans-serif' }}>{p.product_name_ar}</div>
                        </td>
                        <td className="px-4 py-3"><RefBadge buodRef={p.buod_reference} /></td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#6E5847' }}>
                          {cat ? `${cat.icon} ${lang === 'ar' ? cat.nameAr : cat.nameEn}` : '—'}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={p.status} lang={lang} /></td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: vc.color }}>
                            <BadgeCheck size={12} /> {lang === 'ar' ? vc.labelAr : vc.labelEn}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold" style={{ color: DARK }}>
                          {p.files?.filter(f => f.file_name_original).length || 0}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#6E5847' }}>
                          {(p.view_count || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{p.created_at}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Link to={`/library/${p.id}`}
                              className="p-1.5 rounded-lg hover:opacity-70 transition-all"
                              style={{ background: BEIGE, color: DARK }} title="Preview">
                              <Eye size={13} />
                            </Link>
                            {p.status === 'draft' && (
                              <>
                                <Link to={`/products/add`}
                                  className="p-1.5 rounded-lg hover:opacity-70 transition-all"
                                  style={{ background: BEIGE, color: DARK }} title="Edit">
                                  <Pencil size={13} />
                                </Link>
                                <button onClick={() => handleSubmit(p.id)} disabled={submitting === p.id}
                                  className="p-1.5 rounded-lg hover:opacity-70 transition-all"
                                  style={{ background: '#dcfce7', color: '#16a34a' }} title="Submit for Review">
                                  {submitting === p.id ? '…' : <Send size={13} />}
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
        )}
      </div>
    </div>
  );
}
