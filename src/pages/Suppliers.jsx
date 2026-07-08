import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, Package, CheckCircle, Phone, Mail, Globe, ArrowRight, Building2, TrendingUp, Users, Download } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { suppliers } from '../data/mockData';
import SectionHeader from '../components/ui/SectionHeader';
import { fadeInUp, stagger, viewport } from '../utils/animations';

const cities = ['All', 'Riyadh', 'Jeddah', 'Madinah', 'Makkah', 'Dammam'];

export default function Suppliers() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !search || s.name.toLowerCase().includes(q) || s.nameAr.includes(q) || s.category.toLowerCase().includes(q);
    const matchCity = city === 'All' || s.city === city;
    const matchVerified = !verifiedOnly || s.verified;
    return matchSearch && matchCity && matchVerified;
  });

  return (
    <div>
      {/* Header */}
      <section className="pt-32 pb-16 bg-dark-brown relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="text-center">
            <motion.div variants={fadeInUp}>
              <span className="badge-gold mb-6 inline-flex">🇸🇦 {t('Saudi Suppliers Directory', 'دليل الموردين السعوديين')}</span>
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl font-bold text-warm-white mb-4">
              {t('Saudi Suppliers', 'الموردون السعوديون')}
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-light-brown/80 text-xl max-w-2xl mx-auto">
              {t('Verified manufacturers and suppliers across the Kingdom.', 'مصنعون وموردون موثوقون في أنحاء المملكة.')}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-8 bg-white border-b border-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-12">
            {[
              { icon: Building2, value: '180+', label: t('Verified Suppliers', 'مورد موثق') },
              { icon: Package, value: '2,400+', label: t('Products Listed', 'منتج مُدرج') },
              { icon: Users, value: '15,000+', label: t('Active Designers', 'مصمم نشط') },
              { icon: Download, value: '48,000+', label: t('Monthly Downloads', 'تحميل شهري') },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                  <s.icon size={18} className="text-gold" />
                </div>
                <div>
                  <div className="text-xl font-bold text-dark-brown">{s.value}</div>
                  <div className="text-xs text-light-brown">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-sand p-5 mb-8">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-brown" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('Search suppliers by name or category...', 'ابحث عن موردين بالاسم أو الفئة...')}
                className="input-field pl-10"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer px-4 py-3 bg-warm-white rounded-xl border border-sand hover:border-dark-brown transition-colors">
              <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} className="w-4 h-4 accent-saudi-green" />
              <span className="text-sm text-medium-brown font-medium">{t('Verified only', 'موثق فقط')}</span>
              <CheckCircle size={14} className="text-gold" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {cities.map(c => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${city === c ? 'bg-dark-brown text-white' : 'bg-sand text-medium-brown hover:bg-beige'}`}
              >
                {c === 'All' ? t('All Cities', 'جميع المدن') : c}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-light-brown mb-6">{filtered.length} {t('suppliers found', 'مورد وُجد')}</p>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((supplier, i) => (
            <motion.div
              key={supplier.id}
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              transition={{ delay: (i % 6) * 0.08 }}
              className="card p-6 flex flex-col hover:shadow-card-hover group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-sand to-beige rounded-xl flex items-center justify-center text-2xl font-bold text-dark-brown">
                  {(lang === 'ar' ? supplier.nameAr : supplier.name).charAt(0)}
                </div>
                {supplier.verified && (
                  <span className="flex items-center gap-1 bg-green-50 text-gold text-xs font-semibold px-2.5 py-1 rounded-full border border-green-100">
                    <CheckCircle size={11} />{t('Verified', 'موثق')}
                  </span>
                )}
              </div>

              <h3 className="font-bold text-dark-brown text-lg mb-1 group-hover:text-gold transition-colors">
                {lang === 'ar' ? supplier.nameAr : supplier.name}
              </h3>
              <p className="text-sm text-light-brown mb-1">{lang === 'ar' ? supplier.categoryAr : supplier.category}</p>

              <div className="flex items-center gap-3 text-sm text-light-brown mb-3">
                <span className="flex items-center gap-1"><MapPin size={12} className="text-gold" />{lang === 'ar' ? supplier.cityAr : supplier.city}</span>
                <span className="flex items-center gap-1"><Star size={12} fill="#C9A84C" className="text-gold" />{supplier.rating}</span>
                <span className="flex items-center gap-1"><Package size={12} />{supplier.products} {t('products', 'منتج')}</span>
              </div>

              <p className="text-sm text-medium-brown leading-relaxed flex-1 mb-4">
                {lang === 'ar' ? supplier.descriptionAr : supplier.description}
              </p>

              <div className="space-y-1.5 mb-4 pt-4 border-t border-sand">
                {[
                  { Icon: Phone, val: supplier.phone },
                  { Icon: Mail, val: supplier.email },
                  { Icon: Globe, val: supplier.website },
                ].map(({ Icon, val }) => (
                  <div key={val} className="flex items-center gap-2 text-xs text-light-brown">
                    <Icon size={11} className="text-light-brown/60 flex-shrink-0" />{val}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button className="flex-1 btn-primary text-sm justify-center py-2.5">{t('Contact', 'تواصل')}</button>
                <Link to="/marketplace" className="flex-1 btn-secondary text-sm justify-center py-2.5">{t('Products', 'المنتجات')}</Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Join CTA */}
        <motion.div
          variants={fadeInUp} initial="hidden" whileInView="visible" viewport={viewport}
          className="mt-16 bg-gradient-to-r from-dark-brown to-deep-brown rounded-3xl p-10 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-hero-pattern opacity-20" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-3">{t('Are you a Saudi supplier?', 'هل أنت مورد سعودي؟')}</h2>
            <p className="text-green-100 text-lg mb-6 max-w-lg mx-auto">
              {t('List your products on Buad and reach thousands of architects and designers.', 'أدرج منتجاتك على بُعد وتواصل مع آلاف المعماريين والمصممين.')}
            </p>
            <Link to="/dashboard" className="btn-gold text-base px-8 py-4">
              {t('Join as Supplier', 'انضم كمورد')} <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
