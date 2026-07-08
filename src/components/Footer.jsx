import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Twitter, Linkedin, Instagram } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t, lang } = useLanguage();

  return (
    <footer className="bg-dark-brown text-sand">
      {/* Pattern Bar */}
      <div className="h-1.5 bg-gradient-to-r from-dark-brown via-gold to-saudi-green" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-dark-brown rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg" style={{ fontFamily: 'Tajawal' }}>ب</span>
              </div>
              <span className="text-warm-white font-bold text-xl">
                {lang === 'ar' ? 'بُعد' : 'Buad'}
              </span>
            </div>
            <p className="text-light-brown text-sm leading-relaxed mb-4">
              {t(
                'Saudi\'s premier digital platform connecting architects, designers, and contractors with real 3D product libraries.',
                'المنصة الرقمية السعودية الرائدة التي تربط المعماريين والمصممين والمقاولين بمكتبات المنتجات ثلاثية الأبعاد الحقيقية.'
              )}
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-medium-brown rounded-lg flex items-center justify-center hover:bg-dark-brown transition-colors">
                <Twitter size={16} className="text-sand" />
              </a>
              <a href="#" className="w-9 h-9 bg-medium-brown rounded-lg flex items-center justify-center hover:bg-dark-brown transition-colors">
                <Linkedin size={16} className="text-sand" />
              </a>
              <a href="#" className="w-9 h-9 bg-medium-brown rounded-lg flex items-center justify-center hover:bg-dark-brown transition-colors">
                <Instagram size={16} className="text-sand" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-warm-white font-semibold mb-4">{t('Platform', 'المنصة')}</h4>
            <ul className="space-y-2.5">
              {[
                { path: '/library', en: '3D Block Library', ar: 'مكتبة الكتل 3D' },
                { path: '/suppliers', en: 'Suppliers', ar: 'الموردون' },
                { path: '/supplier-dashboard', en: 'Supplier Dashboard', ar: 'لوحة تحكم المورد' },
                { path: '/login', en: 'Sign Up Free', ar: 'سجّل مجاناً' },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-light-brown hover:text-gold text-sm transition-colors">
                    {lang === 'ar' ? link.ar : link.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-warm-white font-semibold mb-4">{t('Company', 'الشركة')}</h4>
            <ul className="space-y-2.5">
              {[
                { path: '/about', en: 'About Buad', ar: 'عن بُعد' },
                { path: '/about', en: 'Vision 2030', ar: 'رؤية 2030' },
                { path: '/contact', en: 'Contact Us', ar: 'تواصل معنا' },
                { path: '/about', en: 'Careers', ar: 'الوظائف' },
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.path} className="text-light-brown hover:text-gold text-sm transition-colors">
                    {lang === 'ar' ? link.ar : link.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-warm-white font-semibold mb-4">{t('Contact', 'تواصل')}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-light-brown">
                <MapPin size={15} className="mt-0.5 text-gold flex-shrink-0" />
                <span>{t('King Fahd Road, Riyadh 12211, Saudi Arabia', 'طريق الملك فهد، الرياض 12211، المملكة العربية السعودية')}</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-light-brown">
                <Phone size={15} className="text-gold flex-shrink-0" />
                <span>+966 11 000 0000</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-light-brown">
                <Mail size={15} className="text-gold flex-shrink-0" />
                <span>hello@buad.sa</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-medium-brown flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-light-brown">
          <p>© 2025 Buad / بُعد — {t('All rights reserved', 'جميع الحقوق محفوظة')}</p>
          <div className="flex items-center gap-1 text-gold">
            <span className="w-4 h-4 inline-flex items-center justify-center">🇸🇦</span>
            <span>{t('Made in Saudi Arabia', 'صُنع في المملكة العربية السعودية')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
