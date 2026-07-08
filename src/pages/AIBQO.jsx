import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Zap, CheckCircle, Download, ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import SectionHeader from '../components/ui/SectionHeader';
import { fadeInUp, stagger, slideInLeft, slideInRight, viewport } from '../utils/animations';

const steps = [
  {
    step: '01', icon: '📄',
    en: 'Upload your plan', ar: 'ارفع مخططك',
    desc_en: 'Upload a PDF, DWG or image of your architectural plan.',
    desc_ar: 'ارفع ملف PDF أو DWG أو صورة من مخططك المعماري.',
  },
  {
    step: '02', icon: '🤖',
    en: 'AI reads & extracts', ar: 'الذكاء يقرأ ويستخرج',
    desc_en: 'Our model identifies rooms, surfaces and quantities automatically.',
    desc_ar: 'يحدد نموذجنا الغرف والأسطح والكميات تلقائياً.',
  },
  {
    step: '03', icon: '🇸🇦',
    en: 'Saudi products matched', ar: 'مطابقة المنتجات السعودية',
    desc_en: 'Each item is matched to verified Saudi suppliers in our database.',
    desc_ar: 'يُطابق كل بند مع موردين سعوديين موثقين في قاعدة بياناتنا.',
  },
  {
    step: '04', icon: '📊',
    en: 'Export your BOQ', ar: 'صدّر جدول الكميات',
    desc_en: 'Download a ready-to-use Excel or PDF bill of quantities.',
    desc_ar: 'نزّل جدول كميات جاهزاً بصيغة Excel أو PDF.',
  },
];

const mockItems = [
  { name: 'Ceramic Floor Tiles', nameAr: 'بلاط أرضية سيراميك', qty: '240 m²', supplier: 'الراجحي للسيراميك', price: '38 SAR/m²', total: '9,120', confidence: 98 },
  { name: 'Gypsum Ceiling Board', nameAr: 'ألواح جبس للأسقف', qty: '180 m²', supplier: 'سعودي جبسم', price: '45 SAR/m²', total: '8,100', confidence: 95 },
  { name: 'Interior Paint', nameAr: 'دهانات داخلية', qty: '620 m²', supplier: 'جوتن السعودية', price: '12 SAR/m²', total: '7,440', confidence: 97 },
  { name: 'Aluminum Windows', nameAr: 'نوافذ ألمنيوم', qty: '24 pcs', supplier: 'المتحدة للألمنيوم', price: '850 SAR/pc', total: '20,400', confidence: 91 },
  { name: 'Steel Door Frames', nameAr: 'أطارات أبواب حديد', qty: '18 pcs', supplier: 'الحديد الوطني', price: '420 SAR/pc', total: '7,560', confidence: 93 },
  { name: 'Electrical Conduits', nameAr: 'مواسير كهربائية', qty: '340 m', supplier: 'سابك للبلاستيك', price: '8 SAR/m', total: '2,720', confidence: 89 },
];

const faqs = [
  { q: 'What file formats does the AI accept?', qAr: 'ما صيغ الملفات التي يقبلها الذكاء الاصطناعي؟', a: 'PDF, DWG, DXF, JPG, PNG — we support all common architectural file formats.', aAr: 'PDF وDWG وDXF وJPG وPNG — ندعم جميع صيغ الملفات المعمارية الشائعة.' },
  { q: 'How accurate is the extraction?', qAr: 'ما مدى دقة الاستخراج؟', a: 'Our model achieves 90–98% accuracy on standard plans. Complex or hand-drawn plans may require minor manual review.', aAr: 'يصل نموذجنا إلى دقة 90-98% في المخططات القياسية. المخططات المعقدة أو المرسومة يدوياً قد تحتاج مراجعة بسيطة.' },
  { q: 'Are the prices real-time?', qAr: 'هل الأسعار فورية؟', a: 'Prices are updated weekly from verified Saudi suppliers. You can also request a live quote directly from the supplier.', aAr: 'تتحدث الأسعار أسبوعياً من الموردين السعوديين الموثقين. يمكنك أيضاً طلب عرض سعر مباشر من المورد.' },
  { q: 'Is my file kept private?', qAr: 'هل ملفي يبقى خاصاً؟', a: 'All uploaded files are processed in encrypted storage and deleted after 24 hours.', aAr: 'تُعالج جميع الملفات المرفوعة في تخزين مشفر وتُحذف بعد 24 ساعة.' },
];

export default function AIBQO() {
  const { t, lang } = useLanguage();
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleUpload = () => {
    if (done) return;
    setUploaded(true);
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setDone(true); }, 2200);
  };

  const reset = () => { setUploaded(false); setProcessing(false); setDone(false); };

  return (
    <div>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-dark-brown relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div className="absolute top-16 right-16 w-72 h-72 opacity-[0.04] animate-spin-slow">
          <svg viewBox="0 0 200 200"><polygon points="100,0 200,100 100,200 0,100" fill="none" stroke="#C9A84C" strokeWidth="1"/><polygon points="100,20 180,100 100,180 20,100" fill="none" stroke="#C9A84C" strokeWidth="0.7"/></svg>
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp}>
              <span className="badge-gold mb-6 inline-flex"><Sparkles size={12} /> {t('AI-Powered BOQ', 'جدول كميات بالذكاء الاصطناعي')}</span>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl font-bold text-warm-white mb-5 leading-tight">
              {t('From plan to BOQ\nin seconds', 'من المخطط إلى جدول\nالكميات في ثوانٍ')}
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-light-brown/80 text-xl max-w-2xl mx-auto mb-10">
              {t(
                'Upload any architectural plan. Our AI extracts quantities and matches every item to verified Saudi suppliers.',
                'ارفع أي مخطط معماري. يستخرج ذكاؤنا الاصطناعي الكميات ويطابق كل بند مع موردين سعوديين موثقين.'
              )}
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-6 text-sm text-light-brown/70">
              {[
                t('PDF • DWG • DXF • Image', 'PDF • DWG • DXF • صورة'),
                t('90–98% accuracy', 'دقة 90–98%'),
                t('Saudi market prices', 'أسعار السوق السعودي'),
                t('Export to Excel / PDF', 'تصدير Excel / PDF'),
              ].map((item, i) => (
                <span key={i} className="flex items-center gap-1.5"><CheckCircle size={13} className="text-gold" />{item}</span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Upload demo */}
      <section className="py-20 bg-ivory">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={t('Try It Now', 'جرّبه الآن')}
            title={t('Upload a plan and see the magic', 'ارفع مخططاً وشاهد السحر')}
            subtitle={t('This is a live demo — try uploading any plan file.', 'هذه تجربة حية — جرّب رفع أي ملف مخطط.')}
            center
          />

          <div className="mt-10">
            {!done ? (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleUpload(); }}
                onClick={!uploaded ? handleUpload : undefined}
                className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all cursor-pointer ${
                  dragging ? 'border-dark-brown bg-gold/5' :
                  uploaded ? 'border-dark-brown/40 bg-white cursor-default' :
                  'border-sand bg-white hover:border-dark-brown/60 hover:bg-sand/30'
                }`}
              >
                {!uploaded ? (
                  <>
                    <div className="w-20 h-20 bg-sand rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <Upload size={32} className="text-medium-brown" />
                    </div>
                    <h3 className="text-lg font-bold text-dark-brown mb-2">{t('Drop your plan here', 'أسقط مخططك هنا')}</h3>
                    <p className="text-light-brown text-sm mb-4">{t('or click to browse — PDF, DWG, DXF, JPG, PNG', 'أو انقر للتصفح — PDF, DWG, DXF, JPG, PNG')}</p>
                    <span className="text-xs text-light-brown/60">{t('Max file size: 50 MB', 'الحجم الأقصى: 50 ميجابايت')}</span>
                  </>
                ) : processing ? (
                  <div className="py-4">
                    <div className="w-16 h-16 mx-auto mb-5 relative">
                      <div className="absolute inset-0 border-4 border-sand rounded-full" />
                      <div className="absolute inset-0 border-4 border-dark-brown border-t-transparent rounded-full animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-dark-brown mb-2">{t('AI is reading your plan…', 'الذكاء الاصطناعي يقرأ مخططك…')}</h3>
                    <p className="text-sm text-light-brown">{t('Extracting rooms, surfaces and quantities', 'استخراج الغرف والأسطح والكميات')}</p>
                    <div className="mt-6 max-w-xs mx-auto space-y-2">
                      {[t('Detecting floor areas…', 'اكتشاف مساحات الأرضيات…'), t('Matching ceiling dimensions…', 'مطابقة أبعاد الأسقف…'), t('Scanning door & window openings…', 'مسح فتحات الأبواب والنوافذ…')].map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-light-brown">
                          <div className="w-1.5 h-1.5 rounded-full bg-dark-brown animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Success bar */}
                <div className="bg-white border border-dark-brown/20 rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                      <CheckCircle size={20} className="text-gold" />
                    </div>
                    <div>
                      <p className="font-bold text-dark-brown text-sm">{t('BOQ generated successfully', 'تم إنشاء جدول الكميات بنجاح')}</p>
                      <p className="text-xs text-light-brown">{t('6 items · 55,340 SAR total · 94% avg confidence', '6 بنود · إجمالي 55,340 ريال · ثقة متوسطة 94%')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="btn-secondary text-sm py-2 px-4 gap-1.5"><Download size={14} /> Excel</button>
                    <button className="btn-secondary text-sm py-2 px-4 gap-1.5"><Download size={14} /> PDF</button>
                    <button onClick={reset} className="text-sm text-light-brown hover:text-dark-brown">{t('Reset', 'إعادة')}</button>
                  </div>
                </div>

                {/* Results table */}
                <div className="bg-white border border-sand rounded-2xl overflow-hidden shadow-card">
                  <div className="px-6 py-4 border-b border-sand flex items-center justify-between">
                    <h3 className="font-bold text-dark-brown">{t('Extracted Bill of Quantities', 'جدول الكميات المستخرج')}</h3>
                    <span className="badge-green text-xs">{t('AI Generated', 'مُولَّد بالذكاء الاصطناعي')}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-ivory">
                        <tr className="text-left text-xs text-light-brown uppercase tracking-wide">
                          <th className="px-6 py-3">{t('Item', 'البند')}</th>
                          <th className="px-4 py-3">{t('Qty', 'الكمية')}</th>
                          <th className="px-4 py-3">{t('Supplier', 'المورد')}</th>
                          <th className="px-4 py-3">{t('Unit Price', 'سعر الوحدة')}</th>
                          <th className="px-4 py-3">{t('Total (SAR)', 'الإجمالي (ريال)')}</th>
                          <th className="px-4 py-3">{t('Confidence', 'الثقة')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sand">
                        {mockItems.map((item, i) => (
                          <motion.tr
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="hover:bg-ivory/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="font-medium text-dark-brown">{lang === 'ar' ? item.nameAr : item.name}</div>
                            </td>
                            <td className="px-4 py-4 text-medium-brown font-mono">{item.qty}</td>
                            <td className="px-4 py-4">
                              <span className="text-gold text-xs font-medium">{item.supplier}</span>
                            </td>
                            <td className="px-4 py-4 text-medium-brown font-mono">{item.price}</td>
                            <td className="px-4 py-4 font-bold text-dark-brown font-mono">{item.total}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 bg-sand rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-dark-brown rounded-full"
                                    style={{ width: `${item.confidence}%` }}
                                  />
                                </div>
                                <span className="text-xs text-medium-brown">{item.confidence}%</span>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-ivory border-t-2 border-sand">
                        <tr>
                          <td colSpan={4} className="px-6 py-4 font-bold text-dark-brown text-right">{t('Total', 'الإجمالي')}</td>
                          <td className="px-4 py-4 font-bold text-dark-brown font-mono text-lg">55,340</td>
                          <td className="px-4 py-4 text-xs text-light-brown">SAR</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="px-6 py-3 bg-amber-50/50 border-t border-amber-100 flex items-center gap-2 text-xs text-amber-700">
                    <AlertCircle size={13} />
                    {t('Prices are indicative. Request a live quote from each supplier for final pricing.', 'الأسعار استرشادية. اطلب عرض سعر حياً من كل مورد للتسعير النهائي.')}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={t('How It Works', 'كيف يعمل')}
            title={t('Four steps to your Saudi BOQ', 'أربع خطوات لجدول كمياتك السعودي')}
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                transition={{ delay: i * 0.1 }}
                className="card p-6 text-center relative"
              >
                <div className="text-4xl mb-3">{s.icon}</div>
                <div className="text-xs font-bold text-gold mb-2 tracking-widest">{s.step}</div>
                <h3 className="font-bold text-dark-brown mb-2 text-sm">{lang === 'ar' ? s.ar : s.en}</h3>
                <p className="text-xs text-light-brown leading-relaxed">{lang === 'ar' ? s.desc_ar : s.desc_en}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-3 w-6 h-px bg-sand" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-dark-brown relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={slideInLeft} initial="hidden" whileInView="visible" viewport={viewport}>
              <div className="section-eyebrow mb-4"><div className="h-px w-8 bg-gold" /><span className="text-light-brown">{t('Built for Saudi projects', 'مبني للمشاريع السعودية')}</span></div>
              <h2 className="text-4xl font-bold text-warm-white mb-6">{t('Saudi market intelligence baked in', 'ذكاء السوق السعودي مدمج')}</h2>
              <div className="space-y-4">
                {[
                  { icon: '🗄️', en: 'Database of 180+ Saudi suppliers', ar: 'قاعدة بيانات أكثر من 180 مورد سعودي' },
                  { icon: '💰', en: 'SAR prices updated weekly from real orders', ar: 'أسعار بالريال تتحدث أسبوعياً من طلبات حقيقية' },
                  { icon: '📐', en: 'SASO & SBC standard compliance checks', ar: 'فحوصات امتثال لمعايير SASO والكود البنائي' },
                  { icon: '🔄', en: 'Integrates with AutoCAD, Revit exports', ar: 'يتكامل مع تصديرات AutoCAD وRevit' },
                  { icon: '👷', en: 'Contractor and subcontractor split BOQ', ar: 'جدول كميات منقسم للمقاول والمقاول الفرعي' },
                ].map((f, i) => (
                  <motion.div key={i} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} transition={{ delay: i * 0.07 }} className="flex items-center gap-3">
                    <span className="text-xl">{f.icon}</span>
                    <span className="text-light-brown/80 text-sm">{lang === 'ar' ? f.ar : f.en}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={slideInRight} initial="hidden" whileInView="visible" viewport={viewport} className="bg-warm-white/5 border border-warm-white/10 rounded-3xl p-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-warm-white/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-gold" />
                    <span className="text-warm-white/80 text-sm">{t('Villa_Ground_Floor.pdf', 'فيلا_الطابق_الأرضي.pdf')}</span>
                  </div>
                  <span className="text-xs text-gold font-medium">{t('Processed', 'تم المعالجة')}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t('Rooms', 'غرف'), val: '12' },
                    { label: t('Items', 'بنود'), val: '47' },
                    { label: t('Suppliers', 'موردون'), val: '8' },
                  ].map((s, i) => (
                    <div key={i} className="bg-warm-white/10 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-warm-white">{s.val}</div>
                      <div className="text-xs text-light-brown/60">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-warm-white/10 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-warm-white/60 text-xs">{t('Total Estimate', 'الإجمالي التقديري')}</span>
                    <span className="text-xs text-gold">{t('94% confidence', 'ثقة 94%')}</span>
                  </div>
                  <div className="text-3xl font-bold text-warm-white">348,200 <span className="text-lg text-light-brown/60">SAR</span></div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 btn-gold text-sm py-2.5 justify-center"><Download size={14} /> Excel</button>
                  <button className="flex-1 btn-ghost text-sm py-2.5 justify-center text-warm-white border-warm-white/30 hover:bg-warm-white/10"><Download size={14} /> PDF</button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-ivory">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow={t('FAQ', 'أسئلة شائعة')} title={t('Questions about AI BOQ', 'أسئلة حول جدول الكميات الذكي')} center />
          <div className="space-y-3 mt-10">
            {faqs.map((item, i) => (
              <motion.div key={i} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport} transition={{ delay: i * 0.07 }} className="bg-white border border-sand rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-sand/30 transition-colors">
                  <span className="font-semibold text-dark-brown text-sm">{lang === 'ar' ? item.qAr : item.q}</span>
                  {openFaq === i ? <ChevronUp size={18} className="text-light-brown flex-shrink-0" /> : <ChevronDown size={18} className="text-light-brown flex-shrink-0" />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                      <div className="px-6 pb-5 text-sm text-light-brown leading-relaxed border-t border-sand pt-4">{lang === 'ar' ? item.aAr : item.a}</div>
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
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={viewport}>
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 text-white/80 text-sm font-medium mb-4"><Zap size={14} /> {t('Available on Pro & Enterprise plans', 'متاح في الخطة الاحترافية والمؤسسية')}</span>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-white mb-4">{t('Ready to automate your BOQ?', 'جاهز لأتمتة جدول كمياتك؟')}</motion.h2>
            <motion.p variants={fadeInUp} className="text-white/70 mb-8">{t('Start your 14-day free trial. No credit card required.', 'ابدأ تجربتك المجانية لـ 14 يوم. لا بطاقة ائتمان مطلوبة.')}</motion.p>
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <a href="/login" className="bg-white text-gold font-semibold px-8 py-4 rounded-xl hover:bg-ivory transition-all flex items-center gap-2">
                {t('Try AI BOQ Free', 'جرّب جدول الكميات الذكي مجاناً')} <Zap size={16} />
              </a>
              <a href="/pricing" className="border border-white/40 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-all">
                {t('View Plans', 'عرض الخطط')}
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
