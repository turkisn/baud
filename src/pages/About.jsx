import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Target, Heart, Zap, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { team } from '../data/mockData';
import SectionHeader from '../components/ui/SectionHeader';
import { fadeInUp, stagger, slideInLeft, slideInRight, viewport } from '../utils/animations';

export default function About() {
  const { t, lang } = useLanguage();

  const values = [
    { icon: Target, color: 'bg-blue-50 text-blue-600', title: t('Accuracy', 'الدقة'), desc: t('Every block links to a real, purchasable product with verified specs.', 'كل كتلة مرتبطة بمنتج حقيقي بمواصفات موثقة.') },
    { icon: Heart, color: 'bg-rose-50 text-rose-600', title: t('Community', 'المجتمع'), desc: t('Built for and with Saudi design professionals.', 'بُني من أجل المجتمع المعماري السعودي ومعه.') },
    { icon: Shield, color: 'bg-green-50 text-gold', title: t('Local First', 'المحلي أولاً'), desc: t('Championing Saudi manufacturers and suppliers.', 'ندعم المصنّعين والموردين السعوديين في كل منتج.') },
    { icon: Zap, color: 'bg-amber-50 text-amber-600', title: t('Innovation', 'الابتكار'), desc: t('Pushing BIM and AI tools forward for Saudi projects.', 'نطور أدوات BIM والذكاء الاصطناعي للمشاريع السعودية.') },
  ];

  const milestones = [
    { year: '2022', event: t('Buad founded in Riyadh', 'تأسيس بُعد في الرياض') },
    { year: '2023', event: t('100+ suppliers joined the platform', 'أكثر من 100 مورد انضموا للمنصة') },
    { year: '2024', event: t('Reached 10,000 registered designers', 'تجاوزنا 10,000 مصمم مسجل') },
    { year: '2025', event: t('AI BOQ feature in development', 'ميزة AI BOQ قيد التطوير') },
  ];

  return (
    <div>
      {/* Header */}
      <section className="pt-32 pb-20 bg-dark-brown relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp}>
              <span className="badge-gold mb-6 inline-flex">🇸🇦 {t('Saudi Architecture Platform', 'منصة العمارة السعودية')}</span>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl font-bold text-warm-white mb-6">
              {t('About Buad', 'عن بُعد')}
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-light-brown/80 text-xl leading-relaxed max-w-2xl mx-auto">
              {t(
                "We're building Saudi Arabia's digital bridge between design and construction.",
                'نبني الجسر الرقمي السعودي بين التصميم والبناء.'
              )}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={slideInLeft} initial="hidden" whileInView="visible" viewport={viewport}>
              <div className="section-eyebrow mb-3">
                <div className="h-px w-8 bg-gold" />
                {t('Our Mission', 'مهمتنا')}
              </div>
              <h2 className="section-title mb-6">{t('Connecting design to reality', 'ربط التصميم بالواقع')}</h2>
              <p className="text-medium-brown text-lg leading-relaxed mb-6">
                {t(
                  "Buad is Saudi Arabia's premier digital platform that links 3D design blocks directly to real products available in the local market. We empower architects, interior designers, contractors, and students to design with confidence.",
                  'بُعد هي المنصة الرقمية السعودية الرائدة التي تربط كتل التصميم ثلاثية الأبعاد مباشرةً بمنتجات حقيقية في السوق المحلية. نمكّن المعماريين ومصممي الداخل والمقاولين والطلاب من التصميم بثقة.'
                )}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { v: '2,400+', l: t('3D Blocks', 'كتلة ثلاثية الأبعاد') },
                  { v: '180+', l: t('Verified Suppliers', 'مورد موثق') },
                  { v: '15,000+', l: t('Registered Designers', 'مصمم مسجل') },
                  { v: '3,200+', l: t('Projects Powered', 'مشروع مُنجز') },
                ].map((s, i) => (
                  <div key={i} className="bg-ivory rounded-xl p-4 border border-sand">
                    <div className="text-2xl font-bold text-dark-brown">{s.v}</div>
                    <div className="text-sm text-light-brown">{s.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={slideInRight} initial="hidden" whileInView="visible" viewport={viewport}>
              <div className="relative h-80 lg:h-96 bg-gradient-to-br from-sand to-beige rounded-3xl flex items-center justify-center overflow-hidden">
                <svg className="w-full h-full opacity-20 absolute" viewBox="0 0 400 400">
                  {[...Array(5)].map((_, i) => (
                    <polygon key={i} points="200,0 400,200 200,400 0,200"
                      stroke="#C9A84C" strokeWidth="1" fill="none"
                      transform={`scale(${1 - i * 0.16}) translate(${i * 32}, ${i * 32})`}
                    />
                  ))}
                </svg>
                <div className="relative text-center">
                  <div className="w-24 h-24 bg-dark-brown rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brand">
                    <span className="text-white font-bold text-5xl" style={{ fontFamily: 'Tajawal' }}>ب</span>
                  </div>
                  <div className="text-dark-brown font-bold text-2xl">{lang === 'ar' ? 'بُعد' : 'Buad'}</div>
                  <div className="text-light-brown text-sm mt-1">{t('Saudi Design Platform', 'منصة التصميم السعودية')}</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-ivory geometric-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={t('Our Values', 'قيمنا')}
            title={t('What drives us', 'ما يحرّكنا')}
            subtitle={t('The principles behind every decision we make at Buad.', 'المبادئ التي تقف وراء كل قرار نتخذه في بُعد.')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {values.map((item, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                transition={{ delay: i * 0.1 }}
                className="card p-6 text-center group hover:shadow-card-hover"
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

      {/* Timeline */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow={t('Our Story', 'قصتنا')} title={t('The Buad journey', 'رحلة بُعد')} />
          <div className="mt-12 space-y-0">
            {milestones.map((m, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6"
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-dark-brown rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{m.year.slice(2)}</div>
                  {i < milestones.length - 1 && <div className="w-0.5 flex-1 bg-sand my-2" />}
                </div>
                <div className={`pb-8 ${i === milestones.length - 1 ? '' : ''}`}>
                  <div className="text-gold font-bold text-sm mb-1">{m.year}</div>
                  <p className="text-medium-brown">{m.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow={t('Team', 'الفريق')} title={t('The people behind Buad', 'الأشخاص خلف بُعد')} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12">
            {team.map((member, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                transition={{ delay: i * 0.1 }}
                className="card p-6 text-center"
              >
                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center text-gold text-2xl font-bold mx-auto mb-4">
                  {member.avatar}
                </div>
                <div className="font-bold text-dark-brown text-sm mb-1">{lang === 'ar' ? member.name : member.nameEn}</div>
                <div className="text-light-brown text-xs">{lang === 'ar' ? member.role : member.roleEn}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision 2030 */}
      <section className="py-24 bg-gradient-to-br from-dark-brown to-deep-brown relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <span className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full mb-6">
              🇸🇦 {t('Vision 2030 Aligned', 'متوافق مع رؤية 2030')}
            </span>
            <h2 className="text-4xl font-bold text-white mb-6">{t("Part of Saudi's Digital Future", 'جزء من المستقبل الرقمي للسعودية')}</h2>
            <p className="text-green-100 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              {t(
                'Buad directly supports Vision 2030 by digitalizing the construction sector, empowering local SMEs, and building a national BIM product ecosystem.',
                'يدعم بُعد رؤية 2030 من خلال رقمنة قطاع البناء، وتمكين المنشآت الصغيرة المحلية، وبناء منظومة منتجات BIM وطنية.'
              )}
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 bg-white text-gold font-bold px-8 py-4 rounded-xl hover:bg-ivory transition-colors">
              {t('Join Buad Today', 'انضم لبُعد اليوم')} <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
