import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Heart, Download, Eye, Star, BadgeCheck, Box, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ProductRender from './ProductRender';

// ─── SVG texture overlays per material type ───────────────────────────────────
const Patterns = {
  marble: (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <path d="M-20,70 Q50,20 110,85 Q170,150 240,60 Q300,0 360,70" stroke="white" strokeWidth="3" fill="none" opacity="0.10"/>
      <path d="M-20,110 Q70,50 140,120 Q210,195 280,105 Q340,45 390,115" stroke="white" strokeWidth="1.5" fill="none" opacity="0.07"/>
      <path d="M40,15 Q100,75 155,25 Q215,-25 260,55" stroke="white" strokeWidth="1" fill="none" opacity="0.05"/>
    </svg>
  ),
  wood: (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      {[0,14,28,42,56,70,84,98,112,126,140,154,168,182,196].map((y, i) => (
        <path key={i} d={`M0,${y} Q${50+i*4},${y-10+i%4*3} ${120+i*3},${y+3} Q${200+i},${y-5} ${320},${y+2}`}
          stroke="rgba(0,0,0,0.07)" strokeWidth="1" fill="none"/>
      ))}
    </svg>
  ),
  fabric: (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id={`fab`} x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M0,7 L7,0 L14,7 L7,14 Z" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="0.6"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#fab)"/>
    </svg>
  ),
  geometric: (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="geo" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
          <polygon points="22,0 44,22 22,44 0,22" fill="none" stroke="rgba(201,168,76,0.22)" strokeWidth="0.9"/>
          <polygon points="22,9 35,22 22,35 9,22" fill="none" stroke="rgba(201,168,76,0.10)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#geo)"/>
    </svg>
  ),
  stone: (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      {[
        'M15,8 L85,5 L95,45 L55,55 L8,46 Z',
        'M85,5 L150,9 L160,42 L95,45 Z',
        'M8,46 L55,55 L60,88 L10,82 Z',
        'M55,55 L95,45 L135,60 L125,92 L60,88 Z',
        'M135,60 L160,42 L210,52 L195,90 L125,92 Z',
        'M0,90 L10,82 L60,88 L65,120 L0,118 Z',
      ].map((d, i) => (
        <path key={i} d={d} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.09)" strokeWidth="0.5"/>
      ))}
    </svg>
  ),
};

const FORMAT_COLOR = { RVT: '#0696D7', SKP: '#D73A0A', MAX: '#00A3E0', FBX: '#5A8A2A', OBJ: '#7B5EA7' };

function FormatBadge({ fmt }) {
  const c = FORMAT_COLOR[fmt] || '#888';
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded leading-none"
      style={{ background: c + '20', color: c, border: `1px solid ${c}40` }}>
      {fmt}
    </span>
  );
}

export default function BlockCard({ block, index = 0, compact = false }) {
  const { t, lang } = useLanguage();
  const [saved, setSaved] = useState(false);
  const cardRef = useRef(null);

  // 3D magnetic tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-80, 80], [5, -5]), { stiffness: 280, damping: 28 });
  const rotY = useSpring(useTransform(mx, [-80, 80], [-5, 5]), { stiffness: 280, damping: 28 });
  const glare = useTransform(mx, [-80, 80], ['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.06)']);

  const onMove  = (e) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(e.clientX - r.left - r.width / 2);
    my.set(e.clientY - r.top  - r.height / 2);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  const name     = lang === 'ar' ? block.nameAr         : block.name;
  const catLabel = lang === 'ar' ? block.categoryLabelAr : block.categoryLabel;
  const supplier = lang === 'ar' ? block.supplierAr      : block.supplier;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: (index % 5) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 900, rotateX: rotX, rotateY: rotY }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative"
    >
      <div className="bg-white rounded-2xl overflow-hidden border border-sand shadow-card group-hover:shadow-card-hover transition-shadow duration-300 flex flex-col h-full">

        {/* ─── Preview / Render area ────────────────────── */}
        <div className="relative overflow-hidden flex-shrink-0" style={{ paddingBottom: compact ? '50%' : '55%' }}>

          {/* Material gradient */}
          <div className="absolute inset-0"
            style={{ background: `linear-gradient(145deg, ${block.previewGrad[0]}, ${block.previewGrad[1]} 55%, ${block.previewGrad[2]})` }}
          />
          {/* Texture pattern */}
          <div className="absolute inset-0 overflow-hidden">
            {Patterns[block.previewPattern] || Patterns.stone}
          </div>
          {/* Product SVG render */}
          <ProductRender block={block} />
          {/* Depth vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
          {/* Glare on mouse */}
          <motion.div className="absolute inset-0 pointer-events-none" style={{ background: glare }} />

          {/* Status badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {block.isNew && (
              <span className="bg-dark-brown/90 text-warm-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm">
                {t('New', 'جديد')}
              </span>
            )}
            {block.isEditorChoice && (
              <span className="flex items-center gap-1 bg-gold/90 text-dark-brown text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                <Sparkles size={7} />{t("Editor's Pick", 'اختيار')}
              </span>
            )}
          </div>

          {/* Save heart */}
          <button
            onClick={() => setSaved(!saved)}
            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center
                       hover:bg-black/50 transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <Heart size={12} className={saved ? 'fill-red-400 text-red-400' : 'text-white'} />
          </button>

          {/* BIM badge bottom-left */}
          <div className="absolute bottom-3 left-3 z-10">
            <span className="bg-black/50 backdrop-blur-sm text-white/90 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
              {block.bimLevel}
            </span>
          </div>

          {/* Format mini-badges bottom-right */}
          <div className="absolute bottom-3 right-3 z-10 flex gap-1">
            {block.formats.slice(0, 3).map(f => (
              <span key={f} className="bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                {f}
              </span>
            ))}
            {block.formats.length > 3 && (
              <span className="bg-black/60 backdrop-blur-sm text-white/70 text-[8px] px-1.5 py-0.5 rounded">
                +{block.formats.length - 3}
              </span>
            )}
          </div>

          {/* View 3D hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Link to={`/block/${block.id}`}
              className="flex items-center gap-1.5 bg-white/95 text-dark-brown text-[11px] font-bold px-4 py-2 rounded-xl shadow-lg hover:bg-white transition-colors backdrop-blur-sm">
              <Box size={12} />
              {t('View in 3D', 'عرض ثلاثي الأبعاد')}
            </Link>
          </div>
        </div>

        {/* ─── Card body ────────────────────────────────── */}
        <div className="p-4 flex flex-col gap-2.5 flex-1">

          {/* Category · Rating */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-light-brown uppercase tracking-widest">{catLabel}</span>
            <div className="flex items-center gap-1">
              <Star size={10} className="text-gold fill-gold" />
              <span className="text-[11px] font-bold text-dark-brown">{block.rating}</span>
              <span className="text-[10px] text-light-brown/70">({block.reviews})</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-dark-brown text-sm leading-snug line-clamp-2">{name}</h3>

          {/* Supplier */}
          <div className="flex items-center gap-1.5 text-[11px]">
            {block.supplierVerified && <BadgeCheck size={11} className="text-gold flex-shrink-0" />}
            <span className="text-medium-brown truncate">{supplier}</span>
            <span className="text-light-brown/50 flex-shrink-0">· {block.supplierCity}</span>
          </div>

          {/* Dimensions + Primary material */}
          {!compact && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
              <div>
                <div className="text-dark-brown/35 uppercase tracking-wider mb-0.5">{t('Dimensions', 'الأبعاد')}</div>
                <div className="text-medium-brown">{block.dimensions.w}×{block.dimensions.d}×{block.dimensions.h} {block.dimensions.unit}</div>
              </div>
              <div>
                <div className="text-dark-brown/35 uppercase tracking-wider mb-0.5">{t('Material', 'المادة')}</div>
                <div className="text-medium-brown line-clamp-1">{block.materials[0]}</div>
              </div>
            </div>
          )}

          {/* Color swatches */}
          {!compact && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-light-brown/60">{t('Colors', 'الألوان')}</span>
              {block.colors.map((c, i) => (
                <div key={i} title={c} className="w-3 h-3 rounded-full border border-sand/70" style={{ background: c }} />
              ))}
            </div>
          )}

          {/* All format badges */}
          <div className="flex flex-wrap gap-1">
            {block.formats.map(f => <FormatBadge key={f} fmt={f} />)}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-[10px] text-light-brown border-t border-sand/50 pt-2">
            <span className="flex items-center gap-1"><Download size={9} />{(block.downloads / 1000).toFixed(1)}k</span>
            <span className="flex items-center gap-1"><Eye size={9} />{(block.views / 1000).toFixed(0)}k</span>
            <span className="flex items-center gap-1"><Heart size={9} />{block.saves.toLocaleString()}</span>
            <span className="ml-auto text-[9px] text-light-brown/50">{t('Ships', 'تسليم')} {block.deliveryDays}d</span>
          </div>

          {/* Price + actions */}
          <div className="flex items-center justify-between pt-0.5">
            <div>
              <div className="text-[15px] font-bold text-dark-brown leading-none">
                {block.price.toLocaleString()} <span className="text-[11px] font-normal text-light-brown">SAR</span>
              </div>
              <div className="text-[9px] text-light-brown/60 mt-0.5">{t('incl. VAT', 'شامل الضريبة')}</div>
            </div>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-xl border border-sand flex items-center justify-center hover:bg-sand/50 transition-colors" title={t('Download', 'تحميل')}>
                <Download size={13} className="text-medium-brown" />
              </button>
              <Link to={`/block/${block.id}`}
                className="bg-dark-brown text-warm-white text-[11px] font-bold px-3 py-1.5 rounded-xl hover:bg-deep-brown transition-colors">
                {t('Details', 'التفاصيل')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
