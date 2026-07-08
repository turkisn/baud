import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { blocks, categories } from '../data/mockData';
import BlockCard from '../components/BlockCard';
import { fadeInUp, viewport } from '../utils/animations';

const formats = ['DWG', 'RVT', 'SKP', 'OBJ', 'FBX', '3DS', 'MAX', 'STL', 'IES'];

export default function Marketplace() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [priceMax, setPriceMax] = useState(10000);
  const [onlyNew, setOnlyNew] = useState(false);

  const filteredBlocks = useMemo(() => {
    let result = [...blocks];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b => b.name.toLowerCase().includes(q) || b.nameAr.includes(q) || b.tags.some(tag => tag.includes(q)));
    }
    if (category !== 'all') result = result.filter(b => b.category === category);
    if (selectedFormats.length) result = result.filter(b => selectedFormats.every(f => b.formats.includes(f)));
    result = result.filter(b => b.price <= priceMax);
    if (onlyNew) result = result.filter(b => b.isNew);

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'downloads') result.sort((a, b) => b.downloads - a.downloads);
    else result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    return result;
  }, [search, category, selectedFormats, sortBy, priceMax, onlyNew]);

  const toggleFormat = f => setSelectedFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  const clearAll = () => { setSearch(''); setCategory('all'); setSelectedFormats([]); setSortBy('featured'); setPriceMax(10000); setOnlyNew(false); };
  const activeFilters = [category !== 'all', selectedFormats.length > 0, priceMax < 10000, onlyNew].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-ivory">
      {/* ── Premium Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-0" style={{ background: 'linear-gradient(160deg,#F5EFE5 0%,#EDE3D4 45%,#E9DDD0 100%)' }}>

        {/* Najdi geometric background pattern */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="najdi-hero" x="0" y="0" width="96" height="96" patternUnits="userSpaceOnUse">
                {/* 8-point star — Najdi motif */}
                <g opacity="0.055" fill="none" stroke="#4A392D">
                  <polygon points="48,6 56,38 48,48 40,38" strokeWidth="0.6"/>
                  <polygon points="90,48 58,56 48,48 58,40" strokeWidth="0.6"/>
                  <polygon points="48,90 40,58 48,48 56,58" strokeWidth="0.6"/>
                  <polygon points="6,48 38,40 48,48 38,56" strokeWidth="0.6"/>
                  <rect x="28" y="28" width="40" height="40" transform="rotate(45 48 48)" strokeWidth="0.5"/>
                  <rect x="14" y="14" width="68" height="68" transform="rotate(45 48 48)" strokeWidth="0.3"/>
                </g>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#najdi-hero)"/>
          </svg>
        </div>

        {/* Warm radial glow — center depth */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 80% at 65% 50%, rgba(201,168,76,0.07) 0%, transparent 70%)' }}/>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 xl:gap-12 items-center min-h-[480px]">

            {/* ── Left: Typography ───────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }} className="pb-16 lg:pb-24 pt-4">

              {/* Eyebrow line */}
              <div className="flex items-center gap-3 mb-7">
                <div className="h-px w-10 bg-gold"/>
                <span className="text-[10px] font-bold tracking-[0.22em] text-gold uppercase">Saudi Design Platform</span>
                <div className="h-px w-10 bg-gold"/>
              </div>

              {/* EN Headline */}
              <h1 className="font-bold text-dark-brown leading-[0.92] mb-3" style={{ fontSize: 'clamp(56px,6.5vw,96px)', letterSpacing: '-0.025em' }}>
                Design.<br/>Source.<br/>
                <span style={{ WebkitTextStroke: '1.5px #4A392D', color: 'transparent' }}>Build.</span>
              </h1>

              {/* AR Headline */}
              <p className="font-arabic font-bold text-medium-brown mt-4 mb-5" style={{ fontSize: 'clamp(18px,2vw,26px)', direction: 'rtl', textAlign: 'left', letterSpacing: '0.02em' }}>
                صمّم. اربط. نفّذ.
              </p>

              {/* Divider */}
              <div className="w-14 h-0.5 bg-beige mb-5"/>

              {/* AR Subtitle */}
              <p className="font-arabic text-light-brown leading-loose mb-9" style={{ fontSize: '15px', direction: 'rtl', textAlign: 'left', maxWidth: '400px' }}>
                منصة تربط البلوكات ثلاثية الأبعاد<br/>بالمنتجات الحقيقية في السوق السعودي.
              </p>

              {/* Stats row */}
              <div className="flex items-stretch gap-6 mb-10">
                {[['2,400+','كتلة'], ['180+','مورد'], ['98%','رضا']].map(([n, l]) => (
                  <div key={l} className="flex flex-col">
                    <span className="text-2xl font-bold text-dark-brown leading-none">{n}</span>
                    <span className="font-arabic text-[11px] text-light-brown mt-1">{l}</span>
                  </div>
                ))}
              </div>

              {/* CTA row */}
              <div className="flex items-center gap-3">
                <button className="btn-primary text-sm px-6 py-3 shadow-brand">
                  استعرض المنتجات
                </button>
                <button className="btn-secondary text-sm px-5 py-3">
                  كيف يعمل؟
                </button>
              </div>
            </motion.div>

            {/* ── Right: Interior render + floating blocks ─ */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.85, delay: 0.15 }} className="relative hidden lg:flex items-end justify-center pb-0 self-end">

              {/* Interior render panel */}
              <div className="relative w-full max-w-[540px]" style={{ filter: 'drop-shadow(0 32px 64px rgba(74,57,45,0.22))' }}>
                <svg viewBox="0 0 560 380" xmlns="http://www.w3.org/2000/svg" className="w-full rounded-t-3xl">
                  {/* Room shell */}
                  <defs>
                    <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2A1C10"/>
                      <stop offset="100%" stopColor="#1E130A"/>
                    </linearGradient>
                    <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3D2B1B"/>
                      <stop offset="100%" stopColor="#2C1F14"/>
                    </linearGradient>
                    <linearGradient id="archGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F5E6C0" stopOpacity="0.45"/>
                      <stop offset="100%" stopColor="#F5E6C0" stopOpacity="0.0"/>
                    </linearGradient>
                    <radialGradient id="lightPool" cx="50%" cy="30%" r="50%">
                      <stop offset="0%" stopColor="#F5E2A0" stopOpacity="0.09"/>
                      <stop offset="100%" stopColor="#F5E2A0" stopOpacity="0"/>
                    </radialGradient>
                    <filter id="soft">
                      <feGaussianBlur stdDeviation="3"/>
                    </filter>
                  </defs>

                  {/* Background */}
                  <rect width="560" height="380" fill="url(#wallGrad)"/>

                  {/* Salmani pointed-arch window */}
                  <path d="M210,0 L210,190 Q210,260 280,260 Q350,260 350,190 L350,0 Z" fill="url(#archGlow)"/>
                  {/* Window frame */}
                  <path d="M215,0 L215,188 Q215,253 280,253 Q345,253 345,188 L345,0 Z" fill="none" stroke="rgba(201,168,76,0.3)" strokeWidth="1.5"/>
                  {/* Inner arch line */}
                  <path d="M225,0 L225,186 Q225,245 280,245 Q335,245 335,186 L335,0 Z" fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth="0.8"/>

                  {/* Mashrabiya lattice on window */}
                  <g opacity="0.18">
                    {[0,1,2,3,4,5,6,7,8,9].map(i => (
                      <line key={`v${i}`} x1={218 + i*14} y1="0" x2={218 + i*14} y2="250" stroke="#C9A84C" strokeWidth="0.6"/>
                    ))}
                    {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(i => (
                      <line key={`h${i}`} x1="215" y1={i*16} x2="345" y2={i*16} stroke="#C9A84C" strokeWidth="0.6"/>
                    ))}
                  </g>

                  {/* Ambient light pool from window */}
                  <ellipse cx="280" cy="260" rx="130" ry="80" fill="#F5E2A0" opacity="0.06" filter="url(#soft)"/>

                  {/* Floor — travertine tiles in perspective */}
                  <rect x="0" y="290" width="560" height="90" fill="url(#floorGrad)"/>
                  {/* Tile joints */}
                  {[1,2,3,4,5,6].map(i => (
                    <line key={`ft${i}`} x1={i*93} y1="290" x2={i*93} y2="380" stroke="#1E130A" strokeWidth="1.2" opacity="0.6"/>
                  ))}
                  {[1,2].map(i => (
                    <line key={`fh${i}`} x1="0" y1={290+i*30} x2="560" y2={290+i*30} stroke="#1E130A" strokeWidth="1" opacity="0.5"/>
                  ))}

                  {/* Skirting / base molding */}
                  <rect x="0" y="285" width="560" height="8" fill="#3A2718" opacity="0.8"/>

                  {/* Left wall panel — Salmani arch relief */}
                  <rect x="30" y="60" width="140" height="240" rx="2" fill="rgba(255,255,255,0.03)" stroke="rgba(201,168,76,0.12)" strokeWidth="1"/>
                  <path d="M55,60 L55,200 Q55,240 100,240 Q145,240 145,200 L145,60 Z" fill="none" stroke="rgba(201,168,76,0.10)" strokeWidth="0.8"/>

                  {/* Right wall panel */}
                  <rect x="390" y="60" width="140" height="240" rx="2" fill="rgba(255,255,255,0.03)" stroke="rgba(201,168,76,0.12)" strokeWidth="1"/>
                  <path d="M415,60 L415,200 Q415,240 460,240 Q505,240 505,200 L505,60 Z" fill="none" stroke="rgba(201,168,76,0.10)" strokeWidth="0.8"/>

                  {/* Pendant chandelier */}
                  <line x1="280" y1="0" x2="280" y2="68" stroke="#8B7555" strokeWidth="1.5"/>
                  {/* Lantern body */}
                  <polygon points="280,68 246,128 248,148 280,158 312,148 314,128" fill="#1A0E06" stroke="#C9A84C" strokeWidth="1.2"/>
                  <polygon points="280,78 252,122 280,142 308,122" fill="rgba(201,168,76,0.08)"/>
                  {/* Arabesque perforations */}
                  {[0,1,2,3,4,5,6,7].map(i => (
                    <circle key={i} cx={255 + i*4.5} cy="115" r="1.2" fill="rgba(201,168,76,0.5)"/>
                  ))}
                  {/* Lantern glow */}
                  <ellipse cx="280" cy="155" rx="40" ry="12" fill="#C9A84C" opacity="0.12" filter="url(#soft)"/>
                  <ellipse cx="280" cy="240" rx="100" ry="50" fill="#F5E2A0" opacity="0.04" filter="url(#soft)"/>

                  {/* Majlis sofa */}
                  {/* Seat */}
                  <rect x="120" y="252" width="320" height="42" rx="8" fill="#3D2E22"/>
                  {/* Cushions */}
                  <rect x="125" y="240" width="150" height="20" rx="6" fill="#4A392D"/>
                  <rect x="285" y="240" width="150" height="20" rx="6" fill="#4A392D"/>
                  {/* Back rest */}
                  <rect x="120" y="220" width="320" height="24" rx="6" fill="#2E2018"/>
                  {/* Arms */}
                  <rect x="108" y="226" width="18" height="65" rx="7" fill="#2E2018"/>
                  <rect x="434" y="226" width="18" height="65" rx="7" fill="#2E2018"/>
                  {/* Gold accent stripe */}
                  <rect x="120" y="215" width="320" height="2.5" rx="1.2" fill="#C9A84C" opacity="0.5"/>

                  {/* Side table left */}
                  <rect x="60" y="263" width="50" height="30" rx="4" fill="#2C1F14"/>
                  <rect x="55" y="256" width="60" height="10" rx="3" fill="#3A2A1A"/>
                  {/* Vase */}
                  <rect x="78" y="240" width="12" height="18" rx="6" fill="#C9A84C" opacity="0.75"/>
                  <ellipse cx="84" cy="258" rx="9" ry="3" fill="#C9A84C" opacity="0.55"/>

                  {/* Side table right */}
                  <rect x="450" y="263" width="50" height="30" rx="4" fill="#2C1F14"/>
                  <rect x="445" y="256" width="60" height="10" rx="3" fill="#3A2A1A"/>
                  {/* Book stack */}
                  <rect x="460" y="248" width="28" height="8" rx="2" fill="#5A3E2A"/>
                  <rect x="462" y="241" width="24" height="8" rx="2" fill="#4A3020"/>

                  {/* Overall light radial */}
                  <rect width="560" height="380" fill="url(#lightPool)"/>
                </svg>
              </div>

              {/* ── Floating product blocks ─────────────── */}

              {/* Block A — Sofa */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-0 top-16 bg-white rounded-2xl overflow-hidden"
                style={{ width: 148, boxShadow: '0 16px 48px rgba(74,57,45,0.18)', transform: 'translateX(-50%)' }}
              >
                <div style={{ height: 86, background: 'linear-gradient(145deg,#2C1810,#4A392D,#6A5744)' }}>
                  <svg viewBox="0 0 280 200" className="w-full h-full">
                    <rect x="30" y="118" width="220" height="55" rx="10" fill="#6A5744"/>
                    <rect x="30" y="72" width="220" height="52" rx="10" fill="#4A392D"/>
                    <rect x="18" y="88" width="22" height="75" rx="8" fill="#2C1810"/>
                    <rect x="240" y="88" width="22" height="75" rx="8" fill="#2C1810"/>
                    {[48,88,178,218].map(x => <rect key={x} x={x} y="172" width="10" height="18" rx="3" fill="#2C1810"/>)}
                    <line x1="140" y1="72" x2="140" y2="173" stroke="#3D2E22" strokeWidth="2"/>
                    <ellipse cx="140" cy="192" rx="100" ry="5" fill="rgba(0,0,0,0.15)"/>
                  </svg>
                </div>
                <div className="p-2.5">
                  <div className="text-[10px] font-bold text-dark-brown">Modern Najdi Sofa</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[9px] text-gold font-semibold">4,800 SAR</span>
                    <span className="text-[8px] bg-sand px-1.5 py-0.5 rounded text-medium-brown">RVT</span>
                  </div>
                </div>
              </motion.div>

              {/* Block B — Pendant */}
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                className="absolute right-0 top-8 bg-white rounded-2xl overflow-hidden"
                style={{ width: 136, boxShadow: '0 16px 48px rgba(74,57,45,0.16)', transform: 'translateX(38%)' }}
              >
                <div style={{ height: 78, background: 'linear-gradient(145deg,#140900,#3D2B10,#6B4E1A)' }}>
                  <svg viewBox="0 0 280 200" className="w-full h-full">
                    <line x1="140" y1="0" x2="140" y2="48" stroke="#C9A84C" strokeWidth="3"/>
                    <polygon points="140,48 96,128 100,148 140,162 180,148 184,128" fill="#1A0A00" stroke="#C9A84C" strokeWidth="2"/>
                    <polygon points="140,58 108,122 140,150 172,122" fill="rgba(201,168,76,0.12)"/>
                    {[0,1,2,3,4,5].map(i => <circle key={i} cx={112+i*6} cy="112" r="2" fill="#C9A84C" opacity="0.6"/>)}
                    <ellipse cx="140" cy="162" rx="48" ry="14" fill="#C9A84C" opacity="0.25"/>
                    <ellipse cx="140" cy="192" rx="60" ry="7" fill="rgba(0,0,0,0.2)"/>
                  </svg>
                </div>
                <div className="p-2.5">
                  <div className="text-[10px] font-bold text-dark-brown">Arabesque Pendant</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[9px] text-gold font-semibold">3,400 SAR</span>
                    <span className="text-[8px] bg-sand px-1.5 py-0.5 rounded text-medium-brown">SKP</span>
                  </div>
                </div>
              </motion.div>

              {/* Block C — Tile */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
                className="absolute right-0 bottom-8 bg-white rounded-2xl overflow-hidden"
                style={{ width: 144, boxShadow: '0 16px 48px rgba(74,57,45,0.18)', transform: 'translateX(30%)' }}
              >
                <div style={{ height: 80, background: 'linear-gradient(145deg,#C8B898,#B0A078,#D6C8A0)' }}>
                  <svg viewBox="0 0 280 200" className="w-full h-full">
                    {[0,1,2,3].map(r => [0,1,2,3,4].map(c => (
                      <rect key={`${r}-${c}`} x={c*58+4} y={r*48+4} width="52" height="42" rx="2" fill="#C4B48A" stroke="#A89468" strokeWidth="1.5"/>
                    )))}
                    <ellipse cx="140" cy="195" rx="120" ry="4" fill="rgba(0,0,0,0.08)"/>
                  </svg>
                </div>
                <div className="p-2.5">
                  <div className="text-[10px] font-bold text-dark-brown">Limestone Tile</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[9px] text-gold font-semibold">340 SAR</span>
                    <span className="text-[8px] bg-sand px-1.5 py-0.5 rounded text-medium-brown">MAX</span>
                  </div>
                </div>
              </motion.div>

              {/* Block D — Mashrabiya */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="absolute left-12 bottom-6 bg-white rounded-2xl overflow-hidden"
                style={{ width: 130, boxShadow: '0 16px 48px rgba(74,57,45,0.15)' }}
              >
                <div style={{ height: 74, background: 'linear-gradient(145deg,#1E1E1E,#3A3A3A,#555)' }}>
                  <svg viewBox="0 0 280 200" className="w-full h-full">
                    <defs>
                      <pattern id="mshr-fp" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <polygon points="20,0 40,20 20,40 0,20" fill="none" stroke="rgba(201,168,76,0.7)" strokeWidth="1.5"/>
                        <polygon points="20,8 32,20 20,32 8,20" fill="none" stroke="rgba(201,168,76,0.35)" strokeWidth="0.8"/>
                      </pattern>
                    </defs>
                    <rect width="280" height="200" fill="url(#mshr-fp)"/>
                    <rect width="280" height="200" fill="rgba(30,20,10,0.55)"/>
                    <ellipse cx="140" cy="195" rx="120" ry="4" fill="rgba(0,0,0,0.2)"/>
                  </svg>
                </div>
                <div className="p-2.5">
                  <div className="text-[10px] font-bold text-dark-brown">Mashrabiya Screen</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[9px] text-gold font-semibold">4,800 SAR</span>
                    <span className="text-[8px] bg-sand px-1.5 py-0.5 rounded text-medium-brown">FBX</span>
                  </div>
                </div>
              </motion.div>

            </motion.div>
          </div>
        </div>

        {/* Bottom fade into content area */}
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #F5EFE5)' }}/>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-brown" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Search blocks, materials, suppliers…', 'ابحث عن كتل، مواد، موردين…')}
              className="input-field pl-10 bg-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-light-brown hover:text-dark-brown">
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all ${showFilters || activeFilters > 0 ? 'bg-dark-brown text-white border-dark-brown' : 'bg-white border-sand text-medium-brown hover:border-dark-brown'}`}
          >
            <SlidersHorizontal size={16} />
            {t('Filters', 'الفلاتر')}
            {activeFilters > 0 && <span className="bg-white text-gold rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">{activeFilters}</span>}
          </button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field bg-white w-auto px-4 py-3 cursor-pointer">
            <option value="featured">{t('Featured', 'المميز')}</option>
            <option value="rating">{t('Top Rated', 'الأعلى تقييماً')}</option>
            <option value="downloads">{t('Most Downloaded', 'الأكثر تحميلاً')}</option>
            <option value="price-asc">{t('Price: Low–High', 'السعر: الأقل فالأعلى')}</option>
            <option value="price-desc">{t('Price: High–Low', 'السعر: الأعلى فالأقل')}</option>
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${category === cat.id ? 'bg-dark-brown text-white' : 'bg-white text-medium-brown border border-sand hover:border-dark-brown hover:text-gold'}`}
            >
              {lang === 'ar' ? cat.nameAr : cat.name}
            </button>
          ))}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-sand rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-dark-brown">{t('Advanced Filters', 'فلاتر متقدمة')}</h3>
              <button onClick={clearAll} className="text-sm text-gold hover:underline">{t('Clear All', 'مسح الكل')}</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="label">{t('File Format', 'صيغة الملف')}</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formats.map(f => (
                    <button
                      key={f}
                      onClick={() => toggleFormat(f)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all ${selectedFormats.includes(f) ? 'bg-dark-brown text-white border-dark-brown' : 'bg-sand text-medium-brown border-sand hover:border-dark-brown'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">{t('Max Price', 'السعر الأقصى')}: {priceMax.toLocaleString()} SAR</label>
                <input type="range" min="100" max="10000" step="100" value={priceMax} onChange={e => setPriceMax(+e.target.value)} className="w-full accent-saudi-green mt-3" />
                <div className="flex justify-between text-xs text-light-brown mt-1"><span>100</span><span>10,000 SAR</span></div>
              </div>
              <div>
                <label className="label">{t('Other', 'أخرى')}</label>
                <label className="flex items-center gap-2 cursor-pointer mt-3">
                  <input type="checkbox" checked={onlyNew} onChange={e => setOnlyNew(e.target.checked)} className="w-4 h-4 accent-saudi-green" />
                  <span className="text-sm text-medium-brown">{t('New arrivals only', 'الوصول الحديث فقط')}</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-light-brown">
            <span className="font-semibold text-dark-brown">{filteredBlocks.length}</span> {t('results', 'نتيجة')}
          </p>
        </div>

        {filteredBlocks.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-dark-brown mb-2">{t('No blocks found', 'لم يُعثر على كتل')}</h3>
            <p className="text-light-brown mb-6">{t('Try different filters or search terms', 'جرّب فلاتر أو مصطلحات بحث مختلفة')}</p>
            <button onClick={clearAll} className="btn-secondary">{t('Clear Filters', 'مسح الفلاتر')}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBlocks.map((block, i) => <BlockCard key={block.id} block={block} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
