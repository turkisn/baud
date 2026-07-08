import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronDown, ChevronUp, ArrowRight, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { pricingPlans, faqItems } from '../data/mockData';
import SectionHeader from '../components/ui/SectionHeader';
import { fadeInUp, stagger, viewport } from '../utils/animations';

export default function Pricing() {
  const { t, lang } = useLanguage();
  const [billing, setBilling] = useState('monthly'); // 'monthly' | 'yearly'
  const [openFaq, setOpenFaq] = useState(null);

  const pricingFaq = faqItems.slice(2, 5);

  return (
    <div>
      {/* Header */}
      <section className="pt-32 pb-20 bg-dark-brown relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp}>
              <span className="badge-gold mb-6 inline-flex">{t('Simple Pricing', 'تسعير بسيط')}</span>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl font-bold text-warm-white mb-4">
              {t('Start free, scale as you grow', 'ابدأ مجاناً، توسع مع نموك')}
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-light-brown/80 text-xl max-w-2xl mx-auto mb-10">
              {t('No hidden fees. Cancel anytime.', 'لا رسوم مخفية. إلغاء في أي وقت.')}
            </motion.p>

            {/* Billing toggle */}
            <motion.div variants={fadeInUp} className="inline-flex items-center bg-warm-white/10 border border-warm-white/20 rounded-xl p-1">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${billing === 'monthly' ? 'bg-warm-white text-dark-brown' : 'text-warm-white/70 hover:text-warm-white'}`}
              >
                {t('Monthly', 'شهري')}
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billing === 'yearly' ? 'bg-warm-white text-dark-brown' : 'text-warm-white/70 hover:text-warm-white'}`}
              >
                {t('Yearly', 'سنوي')}
                <span className="bg-gold text-dark-brown text-xs font-bold px-2 py-0.5 rounded-full">-20%</span>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-10">
            {pricingPlans.map((plan, i) => {
              const displayPrice = plan.price === null ? null :
                billing === 'yearly' ? Math.round(plan.price * 0.8) : plan.price;
              return (
                <motion.div
                  key={plan.id}
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: i * 0.1 }}
                  className={`relative rounded-3xl p-8 flex flex-col ${
                    plan.highlighted
                      ? 'bg-dark-brown text-warm-white border-2 border-gold shadow-2xl scale-[1.02]'
                      : 'bg-white border border-sand shadow-card'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gold text-dark-brown text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                        {lang === 'ar' ? plan.badge : plan.badgeEn}
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? 'text-warm-white' : 'text-dark-brown'}`}>
                      {lang === 'ar' ? plan.name : plan.nameEn}
                    </h3>
                    <p className={`text-sm ${plan.highlighted ? 'text-light-brown/70' : 'text-light-brown'}`}>
                      {lang === 'ar' ? plan.description : plan.descriptionEn}
                    </p>
                  </div>

                  <div className="mb-8">
                    {displayPrice === null ? (
                      <div className={`text-3xl font-bold ${plan.highlighted ? 'text-warm-white' : 'text-dark-brown'}`}>
                        {t('Custom', 'مخصص')}
                      </div>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className={`text-5xl font-bold ${plan.highlighted ? 'text-warm-white' : 'text-dark-brown'}`}>
                          {displayPrice}
                        </span>
                        <span className={`text-sm mb-2 ${plan.highlighted ? 'text-light-brown/70' : 'text-light-brown'}`}>
                          SAR/{t('mo', 'شهر')}
                        </span>
                      </div>
                    )}
                    {billing === 'yearly' && displayPrice !== null && displayPrice > 0 && (
                      <p className="text-xs text-gold mt-1">{t('Billed annually', 'يُحسب سنوياً')}</p>
                    )}
                  </div>

                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm">
                        {f.ok
                          ? <Check size={15} className="text-gold flex-shrink-0" />
                          : <X size={15} className={`flex-shrink-0 ${plan.highlighted ? 'text-light-brown/40' : 'text-sand'}`} />
                        }
                        <span className={f.ok ? (plan.highlighted ? 'text-sand' : 'text-medium-brown') : (plan.highlighted ? 'text-light-brown/40' : 'text-light-brown/60')}>
                          {lang === 'ar' ? f.text : f.textEn}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={plan.id === 'enterprise' ? '/contact' : '/login'}
                    className={`w-full justify-center py-3.5 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] flex items-center gap-2 ${
                      plan.highlighted
                        ? 'bg-gold text-dark-brown hover:bg-light-gold'
                        : 'border-2 border-dark-brown text-gold hover:bg-dark-brown hover:text-white'
                    }`}
                  >
                    {lang === 'ar' ? plan.cta : plan.ctaEn}
                    <ArrowRight size={16} />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features comparison highlight */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionHeader
            eyebrow={t('Why Upgrade', 'لماذا الترقية')}
            title={t('Everything you need to design with Saudi products', 'كل ما تحتاجه للتصميم بالمنتجات السعودية')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            {[
              { icon: '⚡', title: t('Unlimited Downloads', 'تحميلات غير محدودة'), desc: t('No monthly caps on Pro and Enterprise plans.', 'لا حدود شهرية في الخطة الاحترافية والمؤسسية.') },
              { icon: '🤖', title: t('AI BOQ Beta', 'AI BOQ بيتا'), desc: t('Early access to our AI-powered quantity extraction.', 'وصول مبكر لاستخراج الكميات بالذكاء الاصطناعي.') },
              { icon: '📋', title: t('Full Product Specs', 'مواصفات المنتج الكاملة'), desc: t('Complete material specs, pricing and supplier data.', 'مواصفات المواد الكاملة والتسعير وبيانات الموردين.') },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} transition={{ delay: i * 0.1 }} className="card p-6 text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-dark-brown mb-2">{item.title}</h3>
                <p className="text-sm text-light-brown leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-ivory">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow={t('FAQ', 'الأسئلة الشائعة')} title={t('Pricing questions', 'أسئلة التسعير')} />
          <div className="space-y-3 mt-10">
            {pricingFaq.map((item, i) => (
              <motion.div key={i} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} transition={{ delay: i * 0.07 }} className="border border-sand rounded-2xl overflow-hidden bg-white">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-sand/30 transition-colors">
                  <span className="font-semibold text-dark-brown text-sm">{lang === 'ar' ? item.q : item.qEn}</span>
                  {openFaq === i ? <ChevronUp size={18} className="text-light-brown flex-shrink-0" /> : <ChevronDown size={18} className="text-light-brown flex-shrink-0" />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                      <div className="px-6 pb-5 text-sm text-light-brown leading-relaxed border-t border-sand pt-4">{lang === 'ar' ? item.a : item.aEn}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-dark-brown relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}>
            <h2 className="text-3xl font-bold text-warm-white mb-4">{t('Start designing today', 'ابدأ التصميم اليوم')}</h2>
            <p className="text-light-brown/80 mb-8">{t('Free for students. 14-day trial for Pro. No credit card required.', 'مجاني للطلاب. تجربة 14 يوم للاحترافي. لا بطاقة ائتمان مطلوبة.')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/login" className="btn-gold text-base px-8 py-4">{t('Get Started Free', 'ابدأ مجاناً')} <ArrowRight size={16} /></Link>
              <Link to="/contact" className="btn-ghost text-base px-8 py-4">{t('Talk to Sales', 'تحدث مع المبيعات')}</Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
