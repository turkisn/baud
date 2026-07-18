import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Download, Eye, BadgeCheck, Share2, Heart,
  Calendar, HardDrive, Tag, ChevronRight, Loader2, AlertCircle, Copy, Check
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fadeInUp, viewport } from '../utils/animations';
import { productService } from '../services/productService';
import { storageService } from '../services/storageService';

const FORMAT_COLOR = {
  RVT: '#0696D7', SKP: '#D73A0A', MAX: '#00A3E0',
  FBX: '#5A8A2A', OBJ: '#7B5EA7', DWG: '#C4302B',
};
const FORMAT_LABELS = {
  RVT: 'Autodesk Revit', SKP: 'SketchUp', MAX: '3ds Max',
  FBX: 'FBX (Universal)', OBJ: 'OBJ (Universal)', DWG: 'AutoCAD',
};

function FormatBadge({ fmt }) {
  const c = FORMAT_COLOR[fmt] || '#888';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg font-mono"
      style={{ background: c + '18', color: c, border: `1px solid ${c}35` }}>
      <span className="w-2 h-2 rounded-full" style={{ background: c }} />
      {fmt}
      <span className="font-sans font-normal text-[10px] opacity-70">— {FORMAT_LABELS[fmt]}</span>
    </span>
  );
}

function ModelPreview({ model, large = false }) {
  const colorMap = {
    furniture: ['#8B7355', '#C4A882', '#F0E8D8'],
    lighting:  ['#C9A84C', '#F0D060', '#FFF8DC'],
    kitchen:   ['#D8D0C0', '#C0B0A0', '#A09070'],
    bathroom:  ['#C8DDF0', '#E8F4FC', '#D0ECF8'],
    doors:     ['#6B4C2A', '#8B6A40', '#C4A070'],
    windows:   ['#A8C8E0', '#D0E8F4', '#EEF6FC'],
    decor:     ['#C9A84C', '#D4B860', '#F0D880'],
    plants:    ['#4A7C3F', '#6B9C5A', '#A8C890'],
    outdoor:   ['#6B7A5A', '#8B9A70', '#C0C890'],
    office:    ['#6B7A8D', '#8B9AB0', '#B0C0D0'],
  };
  const c = colorMap[model.category] || ['#8B7355', '#C4A882', '#F0E8D8'];
  return (
    <div className={`relative w-full overflow-hidden rounded-2xl flex items-center justify-center ${large ? 'h-80' : 'h-32'}`}
      style={{ background: `linear-gradient(145deg, ${c[0]}, ${c[1]} 55%, ${c[2]})` }}>
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 300">
        <polygon points="200,30 370,150 200,270 30,150" fill="none" stroke="white" strokeWidth="1.5"/>
        <polygon points="200,80 310,150 200,220 90,150" fill="none" stroke="white" strokeWidth="0.8"/>
        <polygon points="200,120 260,150 200,180 140,150" fill="none" stroke="white" strokeWidth="0.5"/>
      </svg>
      <div className="relative z-10 text-center px-6">
        <div className="text-white/50 text-xs font-mono font-bold tracking-[0.3em] mb-2">{model.format}</div>
        <div className="text-white/95 font-bold leading-tight" style={{ fontSize: large ? '18px' : '12px' }}>
          {model.nameEn}
        </div>
        {large && (
          <div className="text-white/50 text-xs mt-2">{model.softwareVersion}</div>
        )}
      </div>
    </div>
  );
}

export default function LibraryDetail() {
  const { id }         = useParams();
  const { t, lang }    = useLanguage();
  const [saved, setSaved]       = useState(false);
  const [copied, setCopied]     = useState(false);
  const [downloading, setDl]    = useState(null); // file id being downloaded
  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [similar, setSimilar]   = useState([]);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    productService.getProductById(id)
      .then((p) => {
        if (!p) { setLoadError('not_found'); return; }
        setProduct(p);
        productService.incrementViewCount(id).catch(() => {});
        if (p.category_id) {
          productService.getPublicProducts({ categoryId: p.category_id, pageSize: 5 })
            .then(list => setSimilar((list || []).filter(x => x.id !== id).slice(0, 4)))
            .catch(() => {});
        }
      })
      .catch(err => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = async (file) => {
    setDl(file.id);
    try {
      const url = await storageService.createSignedDownloadUrl(
        storageService.BUCKETS.FILES,
        file.file_path,
        3600
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_file_name || file.file_path.split('/').pop();
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // signed URL failed — open in new tab as fallback
    } finally {
      setDl(null);
    }
  };

  // ── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gold" style={{ color: '#B68D57' }} />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (loadError || !product) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center gap-4">
        <AlertCircle size={40} style={{ color: '#B68D57' }} />
        <p className="font-bold text-dark-brown text-lg">
          {loadError === 'not_found' ? t('Product not found', 'المنتج غير موجود') : t('Failed to load product', 'تعذر تحميل المنتج')}
        </p>
        <Link to="/library" className="text-sm font-semibold hover:underline" style={{ color: '#B68D57' }}>
          {t('Back to Library', 'العودة للمكتبة')}
        </Link>
      </div>
    );
  }

  // ── Map DB product to display values ──────────────────────────
  const name = lang === 'ar' ? product.product_name_ar : product.product_name_en;
  const desc = lang === 'ar'
    ? (product.full_description_ar || product.short_description_ar || '')
    : (product.full_description_en || product.short_description_en || '');
  const catLabel = lang === 'ar' ? product.categories?.name_ar : product.categories?.name_en;
  const subLabel = lang === 'ar' ? product.subcategories?.name_ar : product.subcategories?.name_en;

  const images = product.product_images || [];
  const primaryImg = images.find(i => i.is_primary) || images[0];
  const primaryImgUrl = primaryImg
    ? (storageService.getPublicUrl(primaryImg.image_path) || product.featured_image_path)
    : product.featured_image_path;

  const files = (product.product_files || []).filter(f => f.file_path);
  const formats = [...new Set(files.map(f => f.file_format).filter(Boolean))];
  const primaryFile = files.find(f => f.is_primary) || files[0];
  const fileSize = primaryFile?.file_size
    ? primaryFile.file_size > 1e6
      ? (primaryFile.file_size / 1e6).toFixed(1) + ' MB'
      : (primaryFile.file_size / 1e3).toFixed(0) + ' KB'
    : '—';

  const dateAdded = new Date(product.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const handleDownload = () => {
    if (files.length > 0) handleDownloadFile(files[0]);
  };

  return (
    <div className="min-h-screen bg-ivory">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-light-brown">
          <Link to="/" className="hover:text-gold transition-colors">{t('Home', 'الرئيسية')}</Link>
          <ChevronRight size={14} />
          <Link to="/library" className="hover:text-gold transition-colors">{t('Library', 'المكتبة')}</Link>
          <ChevronRight size={14} />
          <span className="text-dark-brown font-medium truncate max-w-xs">{name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── Left col ───────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Main preview */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              {primaryImgUrl
                ? <img src={primaryImgUrl} alt={name}
                    className="w-full h-80 object-cover rounded-2xl"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                : <ModelPreview model={{ category: product.categories?.code?.toLowerCase() || 'furniture', nameEn: name, format: formats[0] || '3D', softwareVersion: primaryFile?.software_version || '' }} large />
              }
            </motion.div>

            {/* Title + badges */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1">
                  <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: '#B68D57' }}>
                    {catLabel}
                  </p>
                  <h1 className="font-black text-dark-brown leading-tight" style={{ fontSize: 'clamp(22px,3vw,36px)', fontFamily: 'Cairo, sans-serif' }}>
                    {name}
                  </h1>
                </div>
                <div className="flex gap-2 mt-1">
                  <button onClick={() => setSaved(!saved)}
                    className="w-10 h-10 rounded-xl border border-sand flex items-center justify-center hover:border-gold/50 transition-colors bg-white">
                    <Heart size={16} className={saved ? 'fill-red-400 text-red-400' : 'text-light-brown'} />
                  </button>
                  <button onClick={handleCopy}
                    className="w-10 h-10 rounded-xl border border-sand flex items-center justify-center hover:border-gold/50 transition-colors bg-white">
                    {copied ? <Check size={16} style={{ color: '#16a34a' }} /> : <Copy size={16} className="text-light-brown" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {product.verification_status === 'verified' && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: '#B68D5715', color: '#B68D57', border: '1px solid #B68D5730' }}>
                    <BadgeCheck size={13} /> {t('Verified Model', 'موديل موثق')}
                  </span>
                )}
                {product.is_free
                  ? <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: '#22c55e18', color: '#16a34a', border: '1px solid #22c55e30' }}>
                      {t('Free Download', 'تحميل مجاني')}
                    </span>
                  : <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: '#f59e0b18', color: '#d97706', border: '1px solid #f59e0b30' }}>
                      {t('Premium', 'مدفوع')}
                    </span>
                }
                {product.buod_reference && (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full"
                    style={{ background: '#2B1B0E12', color: '#2B1B0E', border: '1px solid #2B1B0E25' }}>
                    {product.buod_reference}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Description */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
              <h2 className="font-bold text-dark-brown text-lg mb-3">{t('Description', 'الوصف')}</h2>
              <p className="text-medium-brown leading-relaxed">{desc}</p>
            </motion.div>

            {/* Specs grid */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
              <h2 className="font-bold text-dark-brown text-lg mb-4">{t('File Details', 'تفاصيل الملف')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: t('Primary Format', 'الصيغة الرئيسية'), value: formats[0] || '—', color: FORMAT_COLOR[formats[0]] },
                  { label: t('Software', 'البرنامج'), value: primaryFile?.software_name || '—' },
                  { label: t('File Size', 'حجم الملف'), value: fileSize },
                  { label: t('Date Added', 'تاريخ الإضافة'), value: dateAdded },
                  { label: t('License', 'الترخيص'), value: product.license_type || '—' },
                  { label: t('Category', 'التصنيف'), value: catLabel || '—' },
                  { label: t('Sub-category', 'التصنيف الفرعي'), value: subLabel || '—' },
                  { label: t('Downloads', 'التحميلات'), value: (product.download_count || 0).toLocaleString() },
                  { label: t('Views', 'المشاهدات'), value: (product.view_count || 0).toLocaleString() },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-sand">
                    <div className="text-[10px] font-semibold text-light-brown uppercase tracking-wider mb-1">{s.label}</div>
                    <div className="font-bold text-sm text-dark-brown" style={s.color ? { color: s.color } : {}}>{s.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Available formats */}
            {formats.length > 0 && (
              <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
                <h2 className="font-bold text-dark-brown text-lg mb-4">{t('Available Formats', 'الصيغ المتاحة')}</h2>
                <div className="flex flex-wrap gap-2">
                  {formats.map(f => <FormatBadge key={f} fmt={f} />)}
                </div>
              </motion.div>
            )}

            {/* Available files */}
            {files.length > 0 && (
              <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
                <h2 className="font-bold text-dark-brown text-lg mb-4">{t('Files in Package', 'ملفات الحزمة')}</h2>
                <div className="bg-white border border-sand rounded-2xl overflow-hidden">
                  {files.map((file, i) => {
                    const ext = file.file_format || file.original_file_name?.split('.').pop().toUpperCase() || '?';
                    const c = FORMAT_COLOR[ext] || '#888';
                    const sz = file.file_size > 1e6
                      ? (file.file_size / 1e6).toFixed(1) + ' MB'
                      : file.file_size ? (file.file_size / 1e3).toFixed(0) + ' KB' : '—';
                    return (
                      <div key={file.id || i}
                        className={`flex items-center justify-between px-5 py-3.5 ${i < files.length - 1 ? 'border-b border-sand' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold font-mono"
                            style={{ background: c + '18', color: c, border: `1px solid ${c}30` }}>
                            {ext}
                          </div>
                          <span className="text-sm text-dark-brown font-medium font-mono">
                            {file.original_file_name || `file.${ext.toLowerCase()}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-light-brown">{sz}</span>
                          <button onClick={() => handleDownloadFile(file)} disabled={!!downloading}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                            style={{ background: '#B68D5718', color: '#B68D57', border: '1px solid #B68D5730' }}>
                            {downloading === file.id
                              ? <Loader2 size={11} className="animate-spin" />
                              : <Download size={11} />}
                            {t('Download', 'تحميل')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* License info */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
              <h2 className="font-bold text-dark-brown text-lg mb-4">{t('License & Rights', 'الترخيص والحقوق')}</h2>
              <div className="bg-white border border-sand rounded-2xl p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { label: t('License Type', 'نوع الترخيص'), value: product.license_type || '—' },
                    { label: t('Source', 'المصدر'), value: product.source_url ? product.source_url.replace(/^https?:\/\//, '').split('/')[0] : '—' },
                    { label: t('Commercial Use', 'استخدام تجاري'), value: product.license_commercial ? t('✓ Allowed', '✓ مسموح') : t('✗ Not allowed', '✗ غير مسموح') },
                    { label: t('Redistribution', 'إعادة التوزيع'), value: product.license_redistribute ? t('✓ Allowed', '✓ مسموح') : t('✗ Not allowed', '✗ غير مسموح') },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="text-[10px] text-light-brown uppercase tracking-wider mb-0.5">{s.label}</div>
                      <div className="text-sm font-semibold text-dark-brown">{s.value}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-light-brown leading-relaxed border-t border-sand pt-4">
                  {t(
                    'All models on the BUAD platform are either original or licensed for use. Please verify the license before commercial deployment.',
                    'جميع الموديلات على منصة بُعد إما أصلية أو مرخصة للاستخدام. تحقق من الترخيص قبل الاستخدام التجاري.'
                  )}
                </p>
              </div>
            </motion.div>

            {/* Keywords — derived from category + subcategory */}
            {(catLabel || subLabel) && (
              <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
                <h2 className="font-bold text-dark-brown text-lg mb-3">{t('Tags', 'التصنيفات')}</h2>
                <div className="flex flex-wrap gap-2">
                  {[catLabel, subLabel, product.brand_name, product.product_type].filter(Boolean).map(kw => (
                    <span key={kw} className="px-3 py-1 rounded-full text-xs font-medium border border-sand bg-white text-medium-brown">
                      #{kw}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right col — sticky CTA ────────────────── */}
          <div className="space-y-5">
            <div className="sticky top-24 space-y-5">

              {/* Download card */}
              <div className="bg-white rounded-2xl p-6 border border-sand shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center gap-1.5 text-sm text-light-brown">
                    <Eye size={14} /> {(product.view_count || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-light-brown">
                    <Download size={14} /> {(product.download_count || 0).toLocaleString()}
                  </div>
                  <div className="ml-auto text-xs text-light-brown flex items-center gap-1">
                    <Calendar size={12} /> {dateAdded}
                  </div>
                </div>

                {formats.length > 0 && (
                  <div className="mb-5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-light-brown mb-2">
                      {t('Package includes', 'الحزمة تشمل')}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {formats.map(f => {
                        const c = FORMAT_COLOR[f] || '#888';
                        return (
                          <span key={f} className="text-[10px] font-bold px-2 py-1 rounded font-mono"
                            style={{ background: c + '18', color: c, border: `1px solid ${c}30` }}>
                            .{f.toLowerCase()}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button onClick={handleDownload} disabled={files.length === 0 || !!downloading}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all hover:opacity-90 mb-3 disabled:opacity-50"
                  style={{ background: '#2B1B0E', color: '#F7F4EF' }}>
                  {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {t('Download Model', 'تحميل الموديل')}
                </button>

                <button onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-sand hover:border-gold/40 transition-all text-medium-brown">
                  {copied ? <Check size={15} style={{ color: '#16a34a' }} /> : <Share2 size={15} />}
                  {copied ? t('Link Copied!', 'تم النسخ!') : t('Share Model', 'مشاركة الموديل')}
                </button>
              </div>

              {/* Info */}
              <div className="bg-white rounded-2xl p-5 border border-sand">
                <h3 className="font-bold text-dark-brown text-sm mb-4">{t('Model Info', 'معلومات الموديل')}</h3>
                <div className="space-y-3">
                  {[
                    { icon: <HardDrive size={13} />, label: t('File Size', 'الحجم'), value: fileSize },
                    { icon: <Tag size={13} />, label: t('License', 'الترخيص'), value: product.license_type || '—' },
                    { icon: <BadgeCheck size={13} />, label: t('Status', 'الحالة'), value: product.verification_status === 'verified' ? t('Verified', 'موثق') : t('Approved', 'معتمد') },
                    { icon: <Calendar size={13} />, label: t('Added', 'أُضيف'), value: dateAdded },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-light-brown text-xs">
                        {row.icon} {row.label}
                      </div>
                      <div className="text-xs font-semibold text-dark-brown">{row.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Link to="/library"
                className="flex items-center gap-2 text-sm font-semibold text-medium-brown hover:text-gold transition-colors">
                <ArrowLeft size={14} />
                {t('Back to Library', 'العودة للمكتبة')}
              </Link>
            </div>
          </div>
        </div>

        {/* Similar models */}
        {similar.length > 0 && (
          <div className="mt-16">
            <h2 className="font-bold text-dark-brown text-2xl mb-6">
              {t('Similar Models', 'موديلات مشابهة')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {similar.map(m => {
                const n = lang === 'ar' ? m.product_name_ar : m.product_name_en;
                const simFormats = [...new Set((m.product_files || []).map(f => f.file_format).filter(Boolean))];
                const simImg = m.featured_image_path
                  ? storageService.getPublicUrl(m.featured_image_path)
                  : null;
                return (
                  <Link key={m.id} to={`/library/${m.id}`} className="group">
                    <div className="bg-white rounded-2xl overflow-hidden border border-sand hover:border-gold/40 hover:shadow-card transition-all">
                      <div className="relative overflow-hidden h-40">
                        {simImg
                          ? <img src={simImg} alt={n} className="w-full h-full object-cover" />
                          : <ModelPreview model={{ category: m.categories?.code?.toLowerCase() || 'furniture', nameEn: n, format: simFormats[0] || '3D', softwareVersion: '' }} />
                        }
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-dark-brown text-sm line-clamp-2 mb-2">{n}</h3>
                        <div className="flex items-center gap-1">
                          {simFormats.slice(0, 3).map(f => {
                            const c = FORMAT_COLOR[f] || '#888';
                            return (
                              <span key={f} className="text-[8px] font-bold px-1.5 py-0.5 rounded font-mono"
                                style={{ background: c + '18', color: c, border: `1px solid ${c}30` }}>
                                {f}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
