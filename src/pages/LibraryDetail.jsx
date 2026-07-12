import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Download, Eye, BadgeCheck, Share2, Heart,
  Calendar, HardDrive, Tag, ChevronRight, AlertCircle, Copy, Check
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { libraryModels, libraryCategories } from '../data/mockData';
import { fadeInUp, viewport } from '../utils/animations';

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
  const [saved, setSaved]     = useState(false);
  const [copied, setCopied]   = useState(false);
  const [showAlert, setAlert] = useState(false);

  const model   = libraryModels.find(m => m.id === id) || libraryModels[0];
  const similar = libraryModels.filter(m => m.id !== model.id && m.category === model.category).slice(0, 4);
  const cat     = libraryCategories.find(c => c.id === model.category);

  const name = lang === 'ar' ? model.nameAr : model.nameEn;
  const desc = lang === 'ar' ? model.descriptionAr : model.descriptionEn;
  const catLabel = lang === 'ar' ? cat?.labelAr : cat?.labelEn;

  const handleDownload = () => setAlert(true);
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <ModelPreview model={model} large />
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
                {model.verified && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: '#B68D5715', color: '#B68D57', border: '1px solid #B68D5730' }}>
                    <BadgeCheck size={13} /> {t('Verified Model', 'موديل موثق')}
                  </span>
                )}
                {model.isFree
                  ? <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: '#22c55e18', color: '#16a34a', border: '1px solid #22c55e30' }}>
                      {t('Free Download', 'تحميل مجاني')}
                    </span>
                  : <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: '#f59e0b18', color: '#d97706', border: '1px solid #f59e0b30' }}>
                      {t('Premium', 'مدفوع')}
                    </span>
                }
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
                  { label: t('Primary Format', 'الصيغة الرئيسية'), value: model.format, color: FORMAT_COLOR[model.format] },
                  { label: t('Software Version', 'إصدار البرنامج'), value: model.softwareVersion },
                  { label: t('File Size', 'حجم الملف'), value: model.fileSize },
                  { label: t('Designer', 'المصمم'), value: model.designer },
                  { label: t('Date Added', 'تاريخ الإضافة'), value: model.dateAdded },
                  { label: t('License', 'الترخيص'), value: model.license },
                  { label: t('Category', 'التصنيف'), value: `${cat?.icon} ${catLabel}` },
                  { label: t('Sub-category', 'التصنيف الفرعي'), value: model.subCategory },
                  { label: t('Downloads', 'التحميلات'), value: model.downloads.toLocaleString() },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-sand">
                    <div className="text-[10px] font-semibold text-light-brown uppercase tracking-wider mb-1">{s.label}</div>
                    <div className="font-bold text-sm text-dark-brown" style={s.color ? { color: s.color } : {}}>{s.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Available formats */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
              <h2 className="font-bold text-dark-brown text-lg mb-4">{t('Available Formats', 'الصيغ المتاحة')}</h2>
              <div className="flex flex-wrap gap-2">
                {model.formats.map(f => <FormatBadge key={f} fmt={f} />)}
              </div>
            </motion.div>

            {/* Available files */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
              <h2 className="font-bold text-dark-brown text-lg mb-4">{t('Files in Package', 'ملفات الحزمة')}</h2>
              <div className="bg-white border border-sand rounded-2xl overflow-hidden">
                {model.availableFiles.map((file, i) => {
                  const ext = file.split('.').pop().toUpperCase();
                  const c = FORMAT_COLOR[ext] || '#888';
                  return (
                    <div key={i}
                      className={`flex items-center justify-between px-5 py-3.5 ${i < model.availableFiles.length - 1 ? 'border-b border-sand' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold font-mono"
                          style={{ background: c + '18', color: c, border: `1px solid ${c}30` }}>
                          {ext}
                        </div>
                        <span className="text-sm text-dark-brown font-medium font-mono">{file}</span>
                      </div>
                      <span className="text-xs text-light-brown">{model.fileSize}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* License info */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
              <h2 className="font-bold text-dark-brown text-lg mb-4">{t('License & Rights', 'الترخيص والحقوق')}</h2>
              <div className="bg-white border border-sand rounded-2xl p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { label: t('License Type', 'نوع الترخيص'), value: model.license },
                    { label: t('Source', 'المصدر'), value: model.source },
                    { label: t('Commercial Use', 'استخدام تجاري'), value: model.licenseCommercial ? t('✓ Allowed', '✓ مسموح') : t('✗ Not allowed', '✗ غير مسموح') },
                    { label: t('Redistribution', 'إعادة التوزيع'), value: model.licenseRedistribution ? t('✓ Allowed', '✓ مسموح') : t('✗ Not allowed', '✗ غير مسموح') },
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

            {/* Keywords */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
              <h2 className="font-bold text-dark-brown text-lg mb-3">{t('Keywords', 'الكلمات المفتاحية')}</h2>
              <div className="flex flex-wrap gap-2">
                {model.keywords.map(kw => (
                  <span key={kw} className="px-3 py-1 rounded-full text-xs font-medium border border-sand bg-white text-medium-brown">
                    #{kw}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Right col — sticky CTA ────────────────── */}
          <div className="space-y-5">
            <div className="sticky top-24 space-y-5">

              {/* Download card */}
              <div className="bg-white rounded-2xl p-6 border border-sand shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center gap-1.5 text-sm text-light-brown">
                    <Eye size={14} /> {model.views.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-light-brown">
                    <Download size={14} /> {model.downloads.toLocaleString()}
                  </div>
                  <div className="ml-auto text-xs text-light-brown flex items-center gap-1">
                    <Calendar size={12} /> {model.dateAdded}
                  </div>
                </div>

                <div className="mb-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-light-brown mb-2">
                    {t('Package includes', 'الحزمة تشمل')}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {model.formats.map(f => {
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

                <button onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all hover:opacity-90 mb-3"
                  style={{ background: '#2B1B0E', color: '#F7F4EF' }}>
                  <Download size={16} />
                  {t('Download Model', 'تحميل الموديل')}
                </button>

                <button onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-sand hover:border-gold/40 transition-all text-medium-brown">
                  {copied ? <Check size={15} style={{ color: '#16a34a' }} /> : <Share2 size={15} />}
                  {copied ? t('Link Copied!', 'تم النسخ!') : t('Share Model', 'مشاركة الموديل')}
                </button>
              </div>

              {/* Trial alert */}
              {showAlert && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-5 border"
                  style={{ background: '#FFF8ED', borderColor: '#B68D5740' }}>
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} style={{ color: '#B68D57' }} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-dark-brown text-sm mb-1">
                        {t('Trial Model', 'موديل تجريبي')}
                      </p>
                      <p className="text-xs text-medium-brown leading-relaxed">
                        {t(
                          'This file is for preview and testing purposes only and is not available for download at this time.',
                          'هذا الملف تجريبي وغير متاح للتحميل حاليًا. سيتم إتاحته عند إطلاق المنصة رسمياً.'
                        )}
                      </p>
                      <button onClick={() => setAlert(false)}
                        className="mt-3 text-xs font-semibold hover:underline" style={{ color: '#B68D57' }}>
                        {t('Dismiss', 'إغلاق')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Info */}
              <div className="bg-white rounded-2xl p-5 border border-sand">
                <h3 className="font-bold text-dark-brown text-sm mb-4">{t('Model Info', 'معلومات الموديل')}</h3>
                <div className="space-y-3">
                  {[
                    { icon: <HardDrive size={13} />, label: t('File Size', 'الحجم'), value: model.fileSize },
                    { icon: <Tag size={13} />, label: t('License', 'الترخيص'), value: model.license },
                    { icon: <BadgeCheck size={13} />, label: t('Status', 'الحالة'), value: model.verified ? t('Verified', 'موثق') : t('Pending', 'قيد المراجعة') },
                    { icon: <Calendar size={13} />, label: t('Added', 'أُضيف'), value: model.dateAdded },
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
                const n = lang === 'ar' ? m.nameAr : m.nameEn;
                return (
                  <Link key={m.id} to={`/library/${m.id}`} className="group">
                    <div className="bg-white rounded-2xl overflow-hidden border border-sand hover:border-gold/40 hover:shadow-card transition-all">
                      <div className="relative overflow-hidden" style={{ paddingBottom: '60%' }}>
                        <ModelPreview model={m} />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-dark-brown text-sm line-clamp-2 mb-2">{n}</h3>
                        <div className="flex items-center gap-1">
                          {m.formats.slice(0, 3).map(f => {
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
