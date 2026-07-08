import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Download, CheckCircle, Layers, Monitor, Cpu, FileText, Zap, Globe2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supportedSoftware, blocks } from '../data/mockData';
import BlockCard from '../components/BlockCard';
import SectionHeader from '../components/ui/SectionHeader';
import { fadeInUp, slideInLeft, slideInRight, stagger, viewport } from '../utils/animations';

const workflows = [
  { step: '01', icon: Monitor, title: 'Browse & Search', titleAr: 'تصفح وابحث', desc: 'Find exactly the element you need from our curated library of Saudi products.', descAr: 'ابحث عن العنصر الذي تحتاجه من مكتبتنا المنتقاة من المنتجات السعودية.' },
  { step: '02', icon: Download, title: 'Download your format', titleAr: 'حمّل الصيغة التي تريد', desc: 'Get the file in your preferred format — DWG, RVT, SKP, OBJ and more.', descAr: 'احصل على الملف بالصيغة التي تفضلها — DWG وRVT وSKP وOBJ وأكثر.' },
  { step: '03', icon: Layers, title: 'Use in your software', titleAr: 'استخدمه في برنامجك', desc: 'Drop straight into Revit, SketchUp, AutoCAD, or any BIM workflow.', descAr: 'أدرجه مباشرة في Revit وSketchUp وAutoCAD أو أي سير عمل BIM.' },
  { step: '04', icon: FileText, title: 'Specify the real product', titleAr: 'حدد المنتج الحقيقي', desc: 'Every block links to a real Saudi supplier with live pricing and specs.', descAr: 'كل كتلة مرتبطة بمورد سعودي حقيقي مع تسعير حي ومواصفات.' },
];

export default function Designers() {
  const { t, lang } = useLanguage();
  const latest = blocks.filter(b => b.new).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="pt-32 pb-24 bg-dark-brown relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={stagger} initial="hidden" animate="visible">
              <motion.div variants={fadeInUp}>
                <span className="badge-gold mb-6 inline-flex"><Layers size={12} /> {t('For Designers', 'للمصممين')}</span>
              </motion.div>
              <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl font-bold text-warm-white leading-tight mb-6">
                {t('Your design software, Saudi products', 'برنامجك، منتجات سعودية')}
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-light-brown/80 text-lg leading-relaxed mb-10">
                {t(
                  'Buad integrates seamlessly with Revit, SketchUp, AutoCAD, and more. Every block you download links to a real product you can actually specify and order.',
                  'يتكامل بُعد بسلاسة مع Revit وSketchUp وAutoCAD وغيرها. كل كتلة تحملها مرتبطة بمنتج حقيقي يمكنك تحديده وطلبه.'
                )}
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <Link to="/marketplace" className="btn-gold">{t('Browse Library', 'تصفح المكتبة')} <ArrowRight size={16} /></Link>
                <Link to="/login" className="btn-ghost">{t('Create Free Account', 'إنشاء حساب مجاني')}</Link>
              </motion.div>
            </motion.div>

            <motion.div variants={slideInRight} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '🏛️', title: t('2,400+ blocks', '2,400+ كتلة'), desc: t('Saudi-made 3D elements', 'عناصر ثلاثية الأبعاد سعودية') },
                  { icon: '📐', title: t('LOD 300', 'LOD 300'), desc: t('BIM-ready detail', 'تفاصيل جاهزة لـ BIM') },
                  { icon: '🔄', title: t('All formats', 'جميع الصيغ'), desc: t('DWG, RVT, SKP, OBJ…', 'DWG, RVT, SKP, OBJ…') },
                  { icon: '📦', title: t('Real specs', 'مواصفات حقيقية'), desc: t('Linked to actual suppliers', 'مرتبطة بموردين حقيقيين') },
                ].map((item, i) => (
                  <div key={i} className="bg-warm-white/8 border border-warm-white/10 rounded-2xl p-5">
                    <span className="text-3xl mb-3 block">{item.icon}</span>
                    <div className="text-warm-white font-semibold text-sm mb-1">{item.title}</div>
                    <div className="text-light-brown/70 text-xs">{item.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Supported Software */}
      <section className="py-16 bg-white border-b border-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-light-brown text-sm font-semibold tracking-widest uppercase mb-8">
            {t('Works with your favorite software', 'يعمل مع برنامجك المفضل')}
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {supportedSoftware.map(sw => (
              <div key={sw.name} className="flex items-center gap-2.5 bg-ivory border border-sand rounded-xl px-4 py-3">
                <span className="font-mono font-bold text-sm" style={{ color: sw.color }}>{sw.short}</span>
                <span className="text-medium-brown text-sm">{sw.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-24 bg-ivory geometric-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow={t('Workflow', 'سير العمل')} title={t('Designed for your workflow', 'مصمم لسير عملك')} subtitle={t('From browser to BIM in minutes.', 'من المتصفح إلى BIM في دقائق.')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
            {workflows.map((w, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                transition={{ delay: i * 0.1 }}
                className="card p-6 hover:shadow-card-hover group"
              >
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold/15 transition-colors">
                  <w.icon size={22} className="text-gold" />
                </div>
                <div className="text-gold font-bold text-xs mb-2 tracking-widest">{w.step}</div>
                <h3 className="font-bold text-dark-brown mb-2">{lang === 'ar' ? w.titleAr : w.title}</h3>
                <p className="text-sm text-light-brown leading-relaxed">{lang === 'ar' ? w.descAr : w.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest blocks */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} className="flex items-end justify-between mb-12">
            <div>
              <div className="section-eyebrow mb-2"><div className="h-px w-8 bg-gold" />{t('New Arrivals', 'وصل حديثاً')}</div>
              <h2 className="section-title mb-0">{t('Latest 3D blocks', 'أحدث الكتل ثلاثية الأبعاد')}</h2>
            </div>
            <Link to="/marketplace" className="hidden sm:flex items-center gap-2 text-gold font-semibold text-sm hover:underline">
              {t('View all', 'عرض الكل')} <ArrowRight size={16} />
            </Link>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latest.map((block, i) => <BlockCard key={block.id} block={block} index={i} />)}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-dark-brown relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={slideInLeft} initial="hidden" whileInView="visible" viewport={viewport}>
              <h2 className="text-4xl font-bold text-warm-white mb-6">{t('Why designers love Buad', 'لماذا يحب المصممون بُعد')}</h2>
              <ul className="space-y-4">
                {[
                  t('Save hours searching paper catalogs', 'وفّر ساعات البحث في الكتالوجات الورقية'),
                  t('Specify products with real Saudi pricing', 'حدد منتجات بأسعار سعودية حقيقية'),
                  t('Download in the format you need', 'حمّل بالصيغة التي تحتاجها'),
                  t('Link directly to supplier contacts', 'اربط مباشرة ببيانات الموردين'),
                  t('BIM LOD 300 compliant blocks', 'كتل متوافقة مع BIM LOD 300'),
                  t('Free for students and small firms', 'مجاني للطلاب والشركات الصغيرة'),
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sand text-sm">
                    <CheckCircle size={16} className="text-gold flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="btn-gold mt-8">
                {t('Create Free Account', 'إنشاء حساب مجاني')} <ArrowRight size={16} />
              </Link>
            </motion.div>

            <motion.div variants={slideInRight} initial="hidden" whileInView="visible" viewport={viewport}>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { icon: Cpu, v: 'AI BOQ', d: t('Auto-extract quantities from your model', 'استخرج الكميات تلقائياً من نموذجك') },
                  { icon: Globe2, v: t('Saudi Market', 'السوق السعودي'), d: t('180+ verified local suppliers', 'أكثر من 180 مورد محلي موثق') },
                  { icon: Zap, v: t('Instant Download', 'تحميل فوري'), d: t('No waiting, no approval needed', 'لا انتظار، لا حاجة لموافقة') },
                ].map((item, i) => (
                  <div key={i} className="bg-warm-white/8 border border-warm-white/10 rounded-2xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gold/15 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon size={22} className="text-gold" />
                    </div>
                    <div>
                      <div className="text-warm-white font-bold">{item.v}</div>
                      <div className="text-light-brown/70 text-sm">{item.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-ivory">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <h2 className="text-3xl font-bold text-dark-brown mb-4">{t('Ready to design smarter?', 'هل أنت مستعد للتصميم بذكاء أكبر؟')}</h2>
            <p className="text-light-brown mb-8">{t('Join 15,000+ Saudi designers on Buad.', 'انضم إلى أكثر من 15,000 مصمم سعودي على بُعد.')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/login" className="btn-primary px-8 py-4">{t('Get Started Free', 'ابدأ مجاناً')} <ArrowRight size={16} /></Link>
              <Link to="/pricing" className="btn-secondary px-8 py-4">{t('View Pricing', 'عرض الأسعار')}</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
