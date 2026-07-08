import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, MessageCircle, Building2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import SectionHeader from '../components/ui/SectionHeader';
import { fadeInUp, slideInLeft, slideInRight, stagger, viewport } from '../utils/animations';

const topics = [
  { v: 'general', en: 'General Inquiry', ar: 'استفسار عام' },
  { v: 'supplier', en: 'Supplier Registration', ar: 'تسجيل مورد' },
  { v: 'support', en: 'Technical Support', ar: 'الدعم التقني' },
  { v: 'partnership', en: 'Partnership', ar: 'شراكة' },
  { v: 'pricing', en: 'Pricing', ar: 'التسعير' },
  { v: 'other', en: 'Other', ar: 'أخرى' },
];

export default function Contact() {
  const { t, lang } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '', company: '' });

  const handleSubmit = e => { e.preventDefault(); setSubmitted(true); };
  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div>
      {/* Header */}
      <section className="pt-32 pb-16 bg-dark-brown relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={fadeInUp}>
              <span className="badge-gold mb-6 inline-flex"><MessageCircle size={12} /> {t('Contact', 'تواصل')}</span>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl font-bold text-warm-white mb-4">
              {t("We'd love to hear from you", 'يسعدنا التواصل معك')}
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-light-brown/80 text-xl">
              {t("Our team typically responds within 1–2 business days.", 'يرد فريقنا عادةً خلال يوم إلى يومين عمل.')}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Contact grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Left: Info */}
          <motion.div variants={slideInLeft} initial="hidden" whileInView="visible" viewport={viewport} className="space-y-6">
            <div>
              <div className="section-eyebrow mb-3"><div className="h-px w-8 bg-gold" />{t('Get in Touch', 'تواصل معنا')}</div>
              <h2 className="section-title mb-4">{t("We're here to help", 'نحن هنا للمساعدة')}</h2>
              <p className="text-medium-brown leading-relaxed">
                {t(
                  'Have a question about Buad? Want to list your products? Reach out and we\'ll get back to you shortly.',
                  'لديك سؤال حول بُعد؟ تريد إدراج منتجاتك؟ تواصل معنا وسنرد عليك قريباً.'
                )}
              </p>
            </div>

            <div className="space-y-4">
              {[
                { Icon: MapPin, title: t('Address', 'العنوان'), val: t('King Fahd Road, Riyadh 12211\nSaudi Arabia', 'طريق الملك فهد، الرياض 12211\nالمملكة العربية السعودية') },
                { Icon: Phone, title: t('Phone', 'الهاتف'), val: '+966 11 000 0000' },
                { Icon: Mail, title: t('Email', 'البريد'), val: 'hello@buad.sa' },
                { Icon: Clock, title: t('Hours', 'ساعات العمل'), val: t('Sun–Thu: 8am–5pm KSA', 'الأحد–الخميس: 8ص–5م توقيت السعودية') },
              ].map(({ Icon, title, val }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-gold" />
                  </div>
                  <div>
                    <div className="text-xs text-light-brown font-semibold mb-0.5 uppercase tracking-wide">{title}</div>
                    <div className="text-dark-brown text-sm whitespace-pre-line">{val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick options */}
            <div className="bg-ivory rounded-2xl p-5 border border-sand">
              <h4 className="font-bold text-dark-brown text-sm mb-3">{t('Quick contact', 'تواصل سريع')}</h4>
              <div className="space-y-2">
                <a href="mailto:hello@buad.sa" className="flex items-center gap-2 text-gold text-sm hover:underline"><Mail size={14} /> hello@buad.sa</a>
                <a href="mailto:suppliers@buad.sa" className="flex items-center gap-2 text-gold text-sm hover:underline"><Building2 size={14} /> suppliers@buad.sa</a>
              </div>
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div variants={slideInRight} initial="hidden" whileInView="visible" viewport={viewport} className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-sand p-8 shadow-card">
              {submitted ? (
                <div className="text-center py-16">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.6 }}>
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                      <CheckCircle size={40} className="text-gold" />
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-bold text-dark-brown mb-2">{t('Message sent!', 'تم إرسال رسالتك!')}</h3>
                  <p className="text-light-brown">{t("We'll respond within 1–2 business days.", 'سنرد خلال يوم إلى يومين عمل.')}</p>
                  <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', topic: '', message: '', company: '' }); }} className="btn-secondary mt-6">
                    {t('Send another', 'إرسال رسالة أخرى')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-xl font-bold text-dark-brown mb-2">{t('Send us a message', 'أرسل لنا رسالة')}</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label">{t('Full Name', 'الاسم الكامل')} *</label>
                      <input required value={form.name} onChange={e => update('name', e.target.value)} className="input-field" placeholder={t('Your name', 'اسمك')} />
                    </div>
                    <div>
                      <label className="label">{t('Email', 'البريد الإلكتروني')} *</label>
                      <input required type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input-field" placeholder="email@example.com" />
                    </div>
                  </div>

                  <div>
                    <label className="label">{t('Company / University', 'الشركة / الجامعة')}</label>
                    <input value={form.company} onChange={e => update('company', e.target.value)} className="input-field" placeholder={t('Optional', 'اختياري')} />
                  </div>

                  <div>
                    <label className="label">{t('Topic', 'الموضوع')} *</label>
                    <select required value={form.topic} onChange={e => update('topic', e.target.value)} className="input-field">
                      <option value="">{t('Select a topic…', 'اختر موضوعاً…')}</option>
                      {topics.map(tp => (
                        <option key={tp.v} value={tp.v}>{lang === 'ar' ? tp.ar : tp.en}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">{t('Message', 'الرسالة')} *</label>
                    <textarea required rows={5} value={form.message} onChange={e => update('message', e.target.value)} className="input-field resize-none" placeholder={t('Write your message…', 'اكتب رسالتك…')} />
                  </div>

                  <button type="submit" className="w-full btn-primary justify-center py-4 text-base">
                    <Send size={18} />
                    {t('Send Message', 'إرسال الرسالة')}
                  </button>

                  <p className="text-xs text-light-brown text-center">
                    {t('By submitting, you agree to our Privacy Policy.', 'بالإرسال توافق على سياسة الخصوصية.')}
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
