import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Download, Search, Package, Cpu, CheckCircle,
  Star, Building2, Layers, Leaf, Users, ChevronDown, ChevronUp,
  Zap, Shield, Globe2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { blocks, testimonials, faqItems, howItWorks, supportedSoftware } from '../data/mockData';
import BlockCard from '../components/BlockCard';
import { fadeInUp, fadeIn, stagger, slideInLeft, slideInRight, viewport } from '../utils/animations';

const iconMap = { Search, Download, Package, Cpu };

// ─── HERO ────────────────────────────────────────────────
function Hero() {
  const { t, lang } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">

      {/* ── Brand image — full bleed, right-focused ── */}
      <div className="absolute inset-0">
        <img
          src="/hero.jpg"
          alt="BUAD — Saudi Design Platform"
          className="w-full h-full object-cover"
          style={{ objectPosition: '40% center' }}
          loading="eager"
          decoding="async"
        />
        {/* Gradient: strong left → transparent right so image breathes */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(100deg, rgba(43,27,14,0.93) 0%, rgba(43,27,14,0.82) 32%, rgba(43,27,14,0.45) 58%, rgba(43,27,14,0.08) 78%, transparent 100%)' }}
        />
        {/* Subtle vignette top */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
      </div>

      {/* ── Content ── */}
      <div className="relative w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-40">
        <motion.div
          variants={stagger} initial="hidden" animate="visible"
          className="max-w-[580px]"
        >
          {/* Logo mark */}
          <motion.div variants={fadeInUp} className="mb-10">
            <img
              src="/logo.png"
              alt="بُعد — BUAD"
              style={{ height: '140px', width: 'auto', filter: 'brightness(2) drop-shadow(0 2px 16px rgba(0,0,0,0.4))' }}
            />
          </motion.div>

          {/* Divider */}
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-8">
            <div className="h-px w-10" style={{ background: '#B68D57' }} />
            <span className="text-[11px] font-semibold tracking-[0.28em] uppercase" style={{ color: '#D6C2A1' }}>
              Saudi Design Platform
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1 variants={fadeInUp}
            className="font-arabic font-black leading-tight mb-4"
            style={{ fontSize: 'clamp(32px,4.5vw,58px)', color: '#F7F4EF', fontFamily: 'Cairo, sans-serif', direction: 'rtl', textAlign: 'right' }}
          >
            صمّم <span style={{ color: '#B68D57' }}>•</span> اربط <span style={{ color: '#B68D57' }}>•</span> نفّذ
          </motion.h1>

          {/* EN sub-headline */}
          <motion.p variants={fadeInUp}
            className="font-bold tracking-[0.18em] uppercase mb-6"
            style={{ fontSize: '13px', color: '#D6C2A1', letterSpacing: '0.22em' }}
          >
            DESIGN. SOURCE. BUILD.
          </motion.p>

          {/* Description */}
          <motion.p variants={fadeInUp}
            className="font-arabic leading-loose mb-10"
            style={{ fontSize: '16px', color: 'rgba(214,194,161,0.85)', direction: 'rtl', textAlign: 'right', maxWidth: '420px' }}
          >
            منصة تربط البلوكات ثلاثية الأبعاد<br />
            بالمنتجات الحقيقية في السوق السعودي
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 mb-14">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: '#B68D57', color: '#2B1B0E', fontSize: '14px', boxShadow: '0 8px 32px rgba(182,141,87,0.35)' }}
            >
              {t('Explore Marketplace', 'استكشف المتجر')} <ArrowRight size={16} />
            </Link>
            <Link
              to="/suppliers"
              className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ border: '1.5px solid rgba(247,244,239,0.35)', color: '#F7F4EF', fontSize: '14px', backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.06)' }}
            >
              {t('Become a Supplier', 'كن موردًا')}
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeInUp} className="flex flex-wrap gap-8">
            {[
              { v: '2,400+', l: t('3D Blocks', 'بلوك ثلاثي') },
              { v: '180+',   l: t('Suppliers', 'مورد موثق') },
              { v: '15K+',   l: t('Designers', 'مصمم') },
              { v: '98%',    l: t('Satisfaction', 'رضا العملاء') },
            ].map((s, i) => (
              <div key={i}>
                <div className="font-bold text-2xl" style={{ color: '#F7F4EF' }}>{s.v}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(214,194,161,0.7)' }}>{s.l}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ color: 'rgba(247,244,239,0.35)' }}
      >
        <ChevronDown size={26} />
      </motion.div>
    </section>
  );
}

// ─── TRUST BAR ────────────────────────────────────────────
function TrustBar() {
  const { t } = useLanguage();
  const firms = ['ROSHN', 'Dar Al-Omran', 'Emaar KSA', 'NEOM', 'Red Sea Global', 'Diriyah Gate'];
  return (
    <section className="py-10 bg-warm-white border-y border-sand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs text-light-brown font-semibold tracking-widest uppercase mb-6">
          {t('Trusted by leading Saudi firms', 'تثق به شركات سعودية رائدة')}
        </p>
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
          {firms.map(firm => (
            <span key={firm} className="text-medium-brown/60 font-semibold text-sm tracking-wide">{firm}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────
function HowItWorks() {
  const { t, lang } = useLanguage();
  return (
    <section className="py-24 bg-white pattern-overlay">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="text-center mb-16">
          <div className="section-eyebrow justify-center mb-3">
            <div className="h-px w-8 bg-gold" />
            {t('How It Works', 'كيف يعمل')}
            <div className="h-px w-8 bg-gold" />
          </div>
          <h2 className="section-title">{t('From design to real product in 4 steps', 'من التصميم إلى المنتج الحقيقي في 4 خطوات')}</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-sand via-gold/40 to-sand" />
          {howItWorks.map((step, i) => {
            const Icon = iconMap[step.icon] || Package;
            return (
              <motion.div
                key={step.step}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                transition={{ delay: i * 0.1 }}
                className="relative bg-warm-white rounded-2xl p-6 border border-sand hover:border-gold/40 hover:shadow-card transition-all group"
              >
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold/15 transition-colors">
                  <Icon size={22} className="text-gold" />
                </div>
                <div className="text-gold font-bold text-xs mb-1 tracking-widest">{step.step}</div>
                <h3 className="font-bold text-dark-brown mb-2">{lang === 'ar' ? step.ar : step.en}</h3>
                <p className="text-sm text-light-brown leading-relaxed">{lang === 'ar' ? step.desc_ar : step.desc_en}</p>
                {step.step === '04' && (
                  <span className="mt-3 inline-block text-xs badge-gold">{t('Coming Soon', 'قريباً')}</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── FEATURED BLOCKS ──────────────────────────────────────
function FeaturedBlocks() {
  const { t } = useLanguage();
  const featured = blocks.filter(b => b.isFeatured).slice(0, 4);
  return (
    <section className="py-24 bg-ivory geometric-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="flex items-end justify-between mb-12">
          <div>
            <div className="section-eyebrow mb-2">
              <div className="h-px w-8 bg-gold" />
              {t('Featured', 'المميز')}
            </div>
            <h2 className="section-title mb-0">{t('Top 3D Blocks', 'أفضل الكتل ثلاثية الأبعاد')}</h2>
          </div>
          <Link to="/marketplace" className="hidden sm:flex items-center gap-2 text-gold font-semibold text-sm hover:underline">
            {t('View all', 'عرض الكل')} <ArrowRight size={16} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((block, i) => <BlockCard key={block.id} block={block} index={i} />)}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Link to="/marketplace" className="btn-secondary">{t('View All Blocks', 'عرض كل الكتل')}</Link>
        </div>
      </div>
    </section>
  );
}

// ─── FOR PROFESSIONALS ────────────────────────────────────
function ForProfessionals() {
  const { t } = useLanguage();
  const roles = [
    { icon: Building2, title: t('Architects', 'المعماريون'), desc: t('BIM-ready blocks for your projects', 'كتل جاهزة لـ BIM لمشاريعك'), color: 'bg-blue-50 text-blue-600' },
    { icon: Layers, title: t('Interior Designers', 'مصممو الداخل'), desc: t('Furniture & finishes in 3D', 'الأثاث والتشطيبات بثلاثية الأبعاد'), color: 'bg-purple-50 text-purple-600' },
    { icon: Package, title: t('Contractors', 'المقاولون'), desc: t('Specify real products faster', 'حدد المنتجات الحقيقية بسرعة'), color: 'bg-amber-50 text-amber-700' },
    { icon: Leaf, title: t('Students', 'الطلاب'), desc: t('Learn with real Saudi product context', 'تعلّم مع سياق المنتجات السعودية'), color: 'bg-green-50 text-green-600' },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="text-center mb-14">
          <h2 className="section-title">{t('Built for Every Professional', 'مبني لكل محترف')}</h2>
          <p className="section-subtitle mt-2">{t('One platform, every discipline.', 'منصة واحدة، كل التخصصات.')}</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              transition={{ delay: i * 0.1 }}
              className="card p-6 text-center hover:shadow-card-hover group cursor-default"
            >
              <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon size={26} />
              </div>
              <h3 className="font-bold text-dark-brown mb-2">{item.title}</h3>
              <p className="text-sm text-light-brown leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── AI FEATURE ───────────────────────────────────────────
function AIFeature() {
  const { t } = useLanguage();
  return (
    <section className="py-24 bg-dark-brown relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-pattern opacity-40" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={slideInLeft} initial="hidden" whileInView="visible" viewport={viewport}>
            <span className="badge-gold mb-6">{t('Coming Soon', 'قريباً')}</span>
            <h2 className="text-4xl font-bold text-warm-white mb-6">
              {t('AI-powered Bill of Quantities', 'جدول كميات بالذكاء الاصطناعي')}
            </h2>
            <p className="text-light-brown/80 text-lg leading-relaxed mb-8">
              {t(
                'Upload your 3D model and let our AI automatically extract a complete Bill of Quantities with real Saudi product prices and supplier contacts.',
                'ارفع نموذجك ثلاثي الأبعاد ودع ذكاءنا الاصطناعي يستخرج تلقائياً جدول كميات كاملاً مع أسعار المنتجات السعودية الحقيقية وبيانات الموردين.'
              )}
            </p>
            <ul className="space-y-3 mb-10">
              {[
                t('Auto-extract all elements from your model', 'استخراج تلقائي لجميع العناصر من نموذجك'),
                t('Match to real Saudi market products', 'مطابقة مع منتجات حقيقية من السوق السعودي'),
                t('Instant pricing from verified suppliers', 'تسعير فوري من موردين موثوقين'),
                t('Export to Excel, PDF or share link', 'تصدير إلى Excel أو PDF أو رابط مشاركة'),
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sand text-sm">
                  <CheckCircle size={16} className="text-gold flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/ai-boq" className="btn-gold">
              {t('Join Waitlist', 'انضم لقائمة الانتظار')} <ArrowRight size={16} />
            </Link>
          </motion.div>

          <motion.div variants={slideInRight} initial="hidden" whileInView="visible" viewport={viewport}>
            <div className="bg-medium-brown/20 border border-medium-brown/30 rounded-3xl p-6">
              <div className="bg-dark-brown/60 rounded-2xl p-4 mb-4 border border-medium-brown/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="text-light-brown/50 text-xs ml-2">{t('AI BOQ Generator', 'مولّد جداول الكميات AI')}</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: t('Najdi Arch Column', 'عمود القوس النجدي'), qty: '12 pcs', price: '14,400 SAR', status: 'green' },
                    { label: t('Mashrabiya Screen', 'شاشة مشربية'), qty: '8 pcs', price: '30,400 SAR', status: 'green' },
                    { label: t('LED Panel Arabesque', 'لوحة LED أرابيسك'), qty: '24 pcs', price: '44,400 SAR', status: 'green' },
                    { label: t('Palm Tree Model', 'نموذج نخلة'), qty: '6 pcs', price: '2,700 SAR', status: 'amber' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-medium-brown/20 text-xs">
                      <span className="text-sand/80">{row.label}</span>
                      <span className="text-light-brown/60">{row.qty}</span>
                      <span className="text-gold font-semibold">{row.price}</span>
                      <span className={`w-2 h-2 rounded-full bg-${row.status}-400`} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-light-brown text-sm">{t('Total estimate', 'إجمالي التقدير')}</span>
                <span className="text-warm-white font-bold text-lg">91,900 SAR</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {['Excel', 'PDF', t('Share', 'مشاركة')].map(btn => (
                  <div key={btn} className="bg-gold/15 text-gold text-xs font-medium py-2 rounded-lg text-center">{btn}</div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── SUPPLIER CTA ─────────────────────────────────────────
function SupplierCTA() {
  const { t } = useLanguage();
  return (
    <section className="py-20 bg-ivory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}
          className="bg-dark-brown rounded-3xl p-10 lg:p-14 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-hero-pattern opacity-30" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="badge-gold mb-4">{t('For Suppliers', 'للموردين')}</span>
              <h2 className="text-3xl font-bold text-warm-white mb-4">
                {t('Reach architects where they design', 'تواصل مع المعماريين حيث يصممون')}
              </h2>
              <p className="text-light-brown/80 leading-relaxed mb-6">
                {t(
                  'List your products as 3D blocks on Buad and get discovered by 15,000+ architects, designers, and contractors actively working on Saudi projects.',
                  'أدرج منتجاتك ككتل ثلاثية الأبعاد على بُعد وتواصل مع أكثر من 15,000 معماري ومصمم ومقاول يعملون على مشاريع سعودية.'
                )}
              </p>
              <Link to="/suppliers" className="btn-gold">
                {t('Join as Supplier', 'انضم كمورد')} <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, value: '15,000+', label: t('Active Designers', 'مصمم نشط') },
                { icon: Download, value: '48,000+', label: t('Monthly Downloads', 'تحميل شهري') },
                { icon: Star, value: '4.8/5', label: t('Avg Rating', 'متوسط التقييم') },
                { icon: Globe2, value: '180+', label: t('Verified Suppliers', 'مورد موثق') },
              ].map((s, i) => (
                <div key={i} className="bg-warm-white/8 border border-warm-white/10 rounded-2xl p-5">
                  <s.icon size={22} className="text-gold mb-2" />
                  <div className="text-2xl font-bold text-warm-white">{s.value}</div>
                  <div className="text-sm text-light-brown/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── VISION 2030 ──────────────────────────────────────────
function Vision2030() {
  const { t } = useLanguage();
  const tags = [
    t('National Digitalization', 'الرقمنة الوطنية'),
    t('SME Empowerment', 'تمكين المنشآت الصغيرة'),
    t('Construction Tech', 'تقنية البناء'),
    t('Saudi Content', 'المحتوى السعودي'),
    t('BIM Ecosystem', 'منظومة BIM'),
  ];
  return (
    <section className="py-24 bg-gradient-to-br from-dark-brown to-deep-brown relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 border-4 border-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 border-4 border-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
          <span className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6">
            🇸🇦 {t('Aligned with Vision 2030', 'متوافق مع رؤية 2030')}
          </span>
          <h2 className="text-4xl font-bold text-white mb-6">
            {t("Supporting Saudi Arabia's Digital Transformation", 'دعم التحول الرقمي للمملكة العربية السعودية')}
          </h2>
          <p className="text-green-100 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            {t(
              'Buad is aligned with Saudi Vision 2030 by digitalizing the construction sector, empowering Saudi suppliers, and building a national BIM product library.',
              'يتوافق بُعد مع رؤية السعودية 2030 من خلال رقمنة قطاع البناء، وتمكين الموردين السعوديين، وبناء مكتبة منتجات BIM وطنية.'
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {tags.map(tag => (
              <span key={tag} className="bg-white/20 border border-white/30 text-white text-sm px-4 py-2 rounded-full">{tag}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────
function Testimonials() {
  const { t, lang } = useLanguage();
  return (
    <section className="py-24 bg-ivory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="text-center mb-14">
          <div className="section-eyebrow justify-center mb-3">
            <div className="h-px w-8 bg-gold" />
            {t('Testimonials', 'آراء المستخدمين')}
            <div className="h-px w-8 bg-gold" />
          </div>
          <h2 className="section-title">{t('What designers say', 'ما يقوله المصممون')}</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.id}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              transition={{ delay: i * 0.12 }}
              className="card p-6 flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(item.rating)].map((_, j) => (
                  <Star key={j} size={14} fill="#C9A84C" className="text-gold" />
                ))}
              </div>
              <p className="text-medium-brown text-sm leading-relaxed flex-1 mb-5">
                "{lang === 'ar' ? item.quoteAr : item.quote}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-sand">
                <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center text-gold font-bold text-sm">
                  {item.avatar}
                </div>
                <div>
                  <div className="font-semibold text-dark-brown text-sm">{lang === 'ar' ? item.nameAr : item.name}</div>
                  <div className="text-light-brown text-xs">{lang === 'ar' ? item.roleAr : item.role} · {item.city}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────
function FAQ() {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(null);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="text-center mb-12">
          <div className="section-eyebrow justify-center mb-3">
            <div className="h-px w-8 bg-gold" />
            {t('FAQ', 'الأسئلة الشائعة')}
            <div className="h-px w-8 bg-gold" />
          </div>
          <h2 className="section-title">{t('Common questions', 'أسئلة شائعة')}</h2>
        </motion.div>

        <div className="space-y-3">
          {faqItems.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              transition={{ delay: i * 0.06 }}
              className="border border-sand rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-sand/30 transition-colors"
              >
                <span className="font-semibold text-dark-brown text-sm">
                  {lang === 'ar' ? item.qAr : item.q}
                </span>
                <span className="text-light-brown flex-shrink-0 ml-4">
                  {open === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-sm text-light-brown leading-relaxed border-t border-sand pt-4">
                      {lang === 'ar' ? item.aAr : item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FINAL CTA ────────────────────────────────────────────
function FinalCTA() {
  const { t } = useLanguage();
  return (
    <section className="py-20 bg-ivory">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
          <h2 className="text-3xl sm:text-4xl font-bold text-dark-brown mb-4">
            {t('Start designing with real products', 'ابدأ التصميم بمنتجات حقيقية')}
          </h2>
          <p className="text-light-brown text-lg mb-8">
            {t('Join 15,000+ Saudi designers who use Buad daily.', 'انضم إلى أكثر من 15,000 مصمم سعودي يستخدم بُعد يومياً.')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/login" className="btn-primary text-base px-8 py-4">
              {t('Create Free Account', 'إنشاء حساب مجاني')} <ArrowRight size={16} />
            </Link>
            <Link to="/marketplace" className="btn-secondary text-base px-8 py-4">
              {t('Browse Marketplace', 'تصفح المتجر')}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── PAGE ─────────────────────────────────────────────────
export default function Home() {
  return (
    <div>
      <Hero />
      <TrustBar />
      <HowItWorks />
      <FeaturedBlocks />
      <ForProfessionals />
      <AIFeature />
      <SupplierCTA />
      <Vision2030 />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </div>
  );
}
