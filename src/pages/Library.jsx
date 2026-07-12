import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, X, SlidersHorizontal, Download, Eye, BadgeCheck,
  Grid3X3, List
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { libraryModels, libraryCategories } from '../data/mockData';
import { fadeInUp, stagger, viewport } from '../utils/animations';

const FORMAT_COLOR = {
  RVT: '#0696D7', SKP: '#D73A0A', MAX: '#00A3E0',
  FBX: '#5A8A2A', OBJ: '#7B5EA7', DWG: '#C4302B',
};
const FORMAT_LABELS = {
  RVT: 'Revit', SKP: 'SketchUp', MAX: '3ds Max',
  FBX: 'FBX', OBJ: 'OBJ', DWG: 'AutoCAD',
};

function FormatBadge({ fmt }) {
  const c = FORMAT_COLOR[fmt] || '#888';
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono leading-none"
      style={{ background: c + '18', color: c, border: `1px solid ${c}35` }}>
      {fmt}
    </span>
  );
}

function ModelPreview({ model }) {
  const colorMap = {
    furniture: ['#8B7355', '#C4A882', '#F0E8D8'],
    lighting:  ['#C9A84C', '#F0D060', '#FFF8DC'],
    kitchen:   ['#E8E0D0', '#C8B89A', '#A09070'],
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
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(145deg, ${c[0]}, ${c[1]} 55%, ${c[2]})` }}>
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 200">
        <polygon points="100,20 180,100 100,180 20,100" fill="none" stroke="white" strokeWidth="1"/>
        <polygon points="100,50 150,100 100,150 50,100" fill="none" stroke="white" strokeWidth="0.5"/>
      </svg>
      <div className="relative z-10 text-center px-3">
        <div className="text-white/60 text-[10px] font-mono font-bold tracking-widest mb-1">{model.format}</div>
        <div className="text-white/90 text-[11px] font-semibold leading-tight line-clamp-2">{model.nameEn}</div>
      </div>
    </div>
  );
}

function ModelCard({ model, index }) {
  const { t, lang } = useLanguage();
  const name = lang === 'ar' ? model.nameAr : model.nameEn;
  return (
    <motion.div variants={fadeInUp} initial="hidden" whileInView="visible"
      viewport={viewport} transition={{ delay: (index % 6) * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      <Link to={`/library/${model.id}`} className="group block">
        <div className="bg-white rounded-2xl overflow-hidden border border-sand hover:border-gold/40 hover:shadow-card-hover transition-all duration-300 h-full flex flex-col">
          <div className="relative overflow-hidden flex-shrink-0" style={{ paddingBottom: '60%' }}>
            <ModelPreview model={model} />
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
              {model.isFree && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                  style={{ background: '#22c55e22', color: '#16a34a', border: '1px solid #22c55e40' }}>
                  {t('Free', 'مجاني')}
                </span>
              )}
              {model.verified && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: '#B68D5722', color: '#B68D57', border: '1px solid #B68D5740' }}>
                  <BadgeCheck size={8} /> {t('Verified', 'موثق')}
                </span>
              )}
            </div>
            <div className="absolute top-2.5 right-2.5 z-10">
              <FormatBadge fmt={model.format} />
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center z-20">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 text-dark-brown text-xs font-bold px-3 py-1.5 rounded-xl">
                {t('View Details', 'عرض التفاصيل')}
              </span>
            </div>
          </div>
          <div className="p-4 flex flex-col flex-1">
            <h3 className="font-bold text-dark-brown text-sm leading-snug line-clamp-2 mb-2 flex-1">{name}</h3>
            <div className="flex flex-wrap gap-1 mb-3">
              {model.formats.slice(0, 3).map(f => <FormatBadge key={f} fmt={f} />)}
              {model.formats.length > 3 && <span className="text-[9px] text-light-brown px-1">+{model.formats.length - 3}</span>}
            </div>
            <div className="flex items-center justify-between text-[10px] text-light-brown border-t border-sand/60 pt-2.5">
              <span className="flex items-center gap-1"><Download size={9} />{model.downloads.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Eye size={9} />{model.views.toLocaleString()}</span>
              <span className="text-[9px] text-light-brown/60">{model.fileSize}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Library() {
  const { t, lang } = useLanguage();
  const [search, setSearch]           = useState('');
  const [selectedCat, setCat]         = useState('all');
  const [selectedFormats, setFormats] = useState([]);
  const [freeOnly, setFreeOnly]       = useState(false);
  const [verifiedOnly, setVerified]   = useState(false);
  const [sortBy, setSortBy]           = useState('downloads');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode]       = useState('grid');

  const allFormats = ['RVT', 'SKP', 'MAX', 'FBX', 'OBJ', 'DWG'];

  const filtered = useMemo(() => {
    let r = [...libraryModels];
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(m =>
        m.nameEn.toLowerCase().includes(q) || m.nameAr.includes(q) ||
        m.descriptionEn.toLowerCase().includes(q) || m.category.includes(q) ||
        m.format.toLowerCase().includes(q) || m.keywords.some(k => k.toLowerCase().includes(q))
      );
    }
    if (selectedCat !== 'all')       r = r.filter(m => m.category === selectedCat);
    if (selectedFormats.length > 0)  r = r.filter(m => selectedFormats.some(f => m.formats.includes(f)));
    if (freeOnly)                    r = r.filter(m => m.isFree);
    if (verifiedOnly)                r = r.filter(m => m.verified);
    if (sortBy === 'downloads') r.sort((a, b) => b.downloads - a.downloads);
    else if (sortBy === 'views')  r.sort((a, b) => b.views - a.views);
    else if (sortBy === 'newest') r.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    else if (sortBy === 'name')   r.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    return r;
  }, [search, selectedCat, selectedFormats, freeOnly, verifiedOnly, sortBy]);

  const clearFilters = () => {
    setSearch(''); setCat('all'); setFormats([]);
    setFreeOnly(false); setVerified(false); setSortBy('downloads');
  };
  const activeFilters = [selectedCat !== 'all', selectedFormats.length > 0, freeOnly, verifiedOnly].filter(Boolean).length;
  const toggleFormat  = f => setFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  return (
    <div className="min-h-screen bg-ivory">

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: '#2B1B0E' }}>
        <div className="absolute inset-0 opacity-[0.06]">
          <svg viewBox="0 0 600 260" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            {[...Array(7)].map((_, i) => (
              <polygon key={i} points={`${i*90},0 ${i*90+45},130 ${i*90},260 ${i*90-45},130`}
                stroke="#C9A84C" strokeWidth="0.6" fill="none"/>
            ))}
          </svg>
        </div>
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-14">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-4">
              <div className="h-px w-8" style={{ background: '#B68D57' }} />
              <span className="text-[11px] font-bold tracking-[0.25em] uppercase" style={{ color: '#D6C2A1' }}>
                BUAD Platform
              </span>
            </motion.div>
            <motion.h1 variants={fadeInUp}
              className="font-black mb-3"
              style={{ fontSize: 'clamp(26px,4vw,46px)', color: '#F7F4EF', fontFamily: 'Cairo, sans-serif' }}>
              {t('3D Model Library', 'مكتبة الموديلات ثلاثية الأبعاد')}
            </motion.h1>
            <motion.p variants={fadeInUp} className="mb-8 max-w-xl"
              style={{ color: 'rgba(214,194,161,0.8)', fontSize: '15px', lineHeight: 1.7 }}>
              {t(
                'Browse and download BIM-ready 3D models for Saudi architectural projects.',
                'تصفّح وحمّل موديلات BIM ثلاثية الأبعاد للمشاريع المعمارية السعودية.'
              )}
            </motion.p>
            {/* Search */}
            <motion.div variants={fadeInUp} className="relative max-w-2xl mb-8">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#B68D57' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('Search by name, format, category, keyword...', 'ابحث بالاسم أو الصيغة أو التصنيف...')}
                className="w-full pl-12 pr-12 py-4 rounded-2xl text-dark-brown font-medium text-sm outline-none"
                style={{ background: 'rgba(247,244,239,0.97)', border: '1.5px solid rgba(182,141,87,0.3)' }}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-light-brown hover:text-dark-brown">
                  <X size={16} />
                </button>
              )}
            </motion.div>
            {/* Stats */}
            <motion.div variants={fadeInUp} className="flex gap-8">
              {[
                { v: libraryModels.length, l: t('Models', 'موديل') },
                { v: 6, l: t('Formats', 'صيغة') },
                { v: libraryModels.filter(m => m.isFree).length, l: t('Free', 'مجاني') },
                { v: libraryModels.filter(m => m.verified).length, l: t('Verified', 'موثق') },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-2xl font-bold" style={{ color: '#F7F4EF' }}>{s.v}+</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(214,194,161,0.6)' }}>{s.l}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-1">
          {libraryCategories.map(cat => (
            <button key={cat.id} onClick={() => setCat(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                selectedCat === cat.id
                  ? 'text-white border-transparent'
                  : 'bg-white border-sand text-medium-brown hover:border-gold/50 hover:text-gold'
              }`}
              style={selectedCat === cat.id ? { background: '#2B1B0E' } : {}}>
              <span>{cat.icon}</span>
              {lang === 'ar' ? cat.labelAr : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              showFilters || activeFilters > 0 ? 'text-white border-transparent' : 'bg-white border-sand text-medium-brown'
            }`}
            style={showFilters || activeFilters > 0 ? { background: '#2B1B0E' } : {}}>
            <SlidersHorizontal size={15} />
            {t('Filters', 'الفلاتر')}
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ background: '#B68D57', color: '#2B1B0E' }}>{activeFilters}</span>
            )}
          </button>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-sand bg-white text-sm text-dark-brown outline-none cursor-pointer">
            <option value="downloads">{t('Most Downloaded', 'الأكثر تحميلاً')}</option>
            <option value="views">{t('Most Viewed', 'الأكثر مشاهدة')}</option>
            <option value="newest">{t('Newest', 'الأحدث')}</option>
            <option value="name">{t('Name A–Z', 'الاسم أ–ي')}</option>
          </select>

          <div className="flex items-center gap-1 bg-white border border-sand rounded-xl p-1 ml-auto">
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-sand' : 'hover:bg-sand/50'}`}>
              <Grid3X3 size={15} className="text-dark-brown" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-sand' : 'hover:bg-sand/50'}`}>
              <List size={15} className="text-dark-brown" />
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-sand rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-dark-brown">{t('Advanced Filters', 'فلاتر متقدمة')}</h3>
              <button onClick={clearFilters} className="text-sm font-medium hover:underline" style={{ color: '#B68D57' }}>
                {t('Clear All', 'مسح الكل')}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-semibold text-dark-brown uppercase tracking-wider mb-3">
                  {t('File Format', 'صيغة الملف')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {allFormats.map(f => (
                    <button key={f} onClick={() => toggleFormat(f)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                        selectedFormats.includes(f) ? 'text-white border-transparent' : 'bg-sand/50 text-medium-brown border-sand'
                      }`}
                      style={selectedFormats.includes(f) ? { background: FORMAT_COLOR[f] } : {}}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-dark-brown uppercase tracking-wider mb-3">
                  {t('Availability', 'الإتاحة')}
                </p>
                <div className="space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)}
                      className="w-4 h-4 rounded" style={{ accentColor: '#B68D57' }} />
                    <span className="text-sm text-medium-brown">{t('Free only', 'مجاني فقط')}</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={verifiedOnly} onChange={e => setVerified(e.target.checked)}
                      className="w-4 h-4 rounded" style={{ accentColor: '#B68D57' }} />
                    <span className="text-sm text-medium-brown">{t('Verified only', 'موثق فقط')}</span>
                  </label>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-dark-brown uppercase tracking-wider mb-3">
                  {t('Software Legend', 'دليل البرامج')}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(FORMAT_LABELS).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1.5 text-xs text-light-brown">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: FORMAT_COLOR[k] }} />
                      <span className="font-mono font-bold text-[10px]" style={{ color: FORMAT_COLOR[k] }}>{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-light-brown">
            <span className="font-bold text-dark-brown">{filtered.length}</span>{' '}
            {t('models', 'موديل')}
            {search && <span> — {t('for', 'لـ')} "<strong className="text-dark-brown">{search}</strong>"</span>}
          </p>
          {activeFilters > 0 && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-light-brown hover:text-dark-brown transition-colors">
              <X size={11} /> {t('Clear filters', 'مسح الفلاتر')}
            </button>
          )}
        </div>

        {/* Empty */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-dark-brown mb-2">{t('No models found', 'لا توجد موديلات')}</h3>
            <p className="text-light-brown mb-6">{t('Try different terms or clear filters', 'جرب كلمات أخرى أو امسح الفلاتر')}</p>
            <button onClick={clearFilters}
              className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
              style={{ background: '#2B1B0E' }}>
              {t('Clear Filters', 'مسح الفلاتر')}
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((model, i) => <ModelCard key={model.id} model={model} index={i} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((model, i) => {
              const name = lang === 'ar' ? model.nameAr : model.nameEn;
              const desc = lang === 'ar' ? model.descriptionAr : model.descriptionEn;
              return (
                <motion.div key={model.id} variants={fadeInUp} initial="hidden"
                  whileInView="visible" viewport={viewport} transition={{ delay: i * 0.03 }}>
                  <Link to={`/library/${model.id}`}
                    className="flex items-center gap-4 bg-white border border-sand rounded-2xl p-4 hover:border-gold/40 hover:shadow-card transition-all group">
                    <div className="relative flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden">
                      <ModelPreview model={model} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <h3 className="font-bold text-dark-brown text-sm leading-tight truncate">{name}</h3>
                        {model.verified && <BadgeCheck size={13} style={{ color: '#B68D57' }} className="flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-light-brown line-clamp-1 mb-1.5">{desc}</p>
                      <div className="flex flex-wrap gap-1">
                        {model.formats.slice(0, 4).map(f => <FormatBadge key={f} fmt={f} />)}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right hidden sm:block">
                      <div className="text-xs text-light-brown mb-1">{model.fileSize}</div>
                      <div className="flex items-center gap-2 text-[10px] text-light-brown">
                        <span className="flex items-center gap-0.5"><Download size={9} />{model.downloads.toLocaleString()}</span>
                        <span className="flex items-center gap-0.5"><Eye size={9} />{model.views.toLocaleString()}</span>
                      </div>
                      {model.isFree && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded mt-1 inline-block"
                          style={{ background: '#22c55e22', color: '#16a34a' }}>
                          {t('Free', 'مجاني')}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
