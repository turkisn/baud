import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Footer() {
  const { t, lang } = useLanguage();

  const columns = [
    {
      title: t('Platform', 'المنصة'),
      links: [
        { to: '/marketplace', label: t('3D Marketplace', 'متجر الكتل ثلاثية الأبعاد') },
        { to: '/suppliers', label: t('Suppliers', 'الموردون') },
        { to: '/designers', label: t('For Designers', 'للمصممين') },
        { to: '/ai-boq', label: t('AI BOQ', 'AI BOQ') },
        { to: '/pricing', label: t('Pricing', 'الأسعار') },
      ],
    },
    {
      title: t('Company', 'الشركة'),
      links: [
        { to: '/about', label: t('About Buad', 'عن بُعد') },
        { to: '/about', label: t('Vision 2030', 'رؤية 2030') },
        { to: '/contact', label: t('Contact Us', 'تواصل معنا') },
        { to: '/about', label: t('Careers', 'الوظائف') },
        { to: '/about', label: t('Press', 'الإعلام') },
      ],
    },
    {
      title: t('Legal', 'قانوني'),
      links: [
        { to: '/', label: t('Privacy Policy', 'سياسة الخصوصية') },
        { to: '/', label: t('Terms of Service', 'شروط الخدمة') },
        { to: '/', label: t('Cookie Policy', 'سياسة ملفات تعريف الارتباط') },
      ],
    },
  ];

  return (
    <footer className="bg-dark-brown text-sand">
      {/* Gold accent line */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-5">
              {/* brand mark */}
              <div className="relative w-10 h-10 flex-shrink-0">
                <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
                  <rect x="6" y="6" width="24" height="24" rx="2" fill="#6A5744" />
                  <path d="M13 26 L13 16 Q13 11 18 11 Q23 11 23 16 L23 26" stroke="#F8F5EF" strokeWidth="2" fill="none" />
                </svg>
                <svg width="9" height="9" viewBox="0 0 20 20" fill="#C9A84C" className="absolute -top-0.5 -right-0.5">
                  <path d="M10 0 L11.5 8.5 L20 10 L11.5 11.5 L10 20 L8.5 11.5 L0 10 L8.5 8.5 Z" />
                </svg>
              </div>
              <div>
                <div className="text-warm-white font-bold text-xl font-arabic">{lang === 'ar' ? 'بُعد' : 'BUAD'}</div>
                <div className="text-light-brown text-xs">{t('Saudi Design Platform', 'منصة التصميم السعودية')}</div>
              </div>
            </Link>

            <p className="text-light-brown text-sm leading-relaxed mb-6 max-w-xs">
              {t(
                "Saudi Arabia's premier platform connecting architects and designers to real 3D product libraries from verified local suppliers.",
                'المنصة السعودية الرائدة التي تربط المعماريين والمصممين بمكتبات منتجات ثلاثية الأبعاد من موردين محليين موثوقين.'
              )}
            </p>

            {/* Social */}
            <div className="flex gap-2.5">
              {/* X (Twitter) */}
              <a href="#" aria-label="Twitter / X" className="w-9 h-9 bg-medium-brown/40 rounded-lg flex items-center justify-center text-light-brown hover:bg-gold/80 hover:text-dark-brown transition-all duration-200">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.727-8.833L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              {[
                { label: 'LinkedIn', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                { label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
                { label: 'YouTube', path: 'M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z' },
              ].map(({ label, path }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 bg-medium-brown/40 rounded-lg flex items-center justify-center text-light-brown hover:bg-gold/80 hover:text-dark-brown transition-all duration-200"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d={path} /></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-warm-white font-semibold text-sm mb-4 tracking-wide">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link, i) => (
                  <li key={i}>
                    <Link
                      to={link.to}
                      className="text-light-brown hover:text-gold text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact strip */}
        <div className="mt-12 pt-8 border-t border-medium-brown/40 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { Icon: MapPin, value: t('King Fahd Road, Riyadh 12211, KSA', 'طريق الملك فهد، الرياض 12211، المملكة العربية السعودية') },
            { Icon: Phone, value: '+966 11 000 0000' },
            { Icon: Mail, value: 'hello@buad.sa' },
          ].map(({ Icon, value }) => (
            <div key={value} className="flex items-start gap-2.5 text-sm text-light-brown">
              <Icon size={14} className="text-gold mt-0.5 flex-shrink-0" />
              <span>{value}</span>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-medium-brown/30 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-medium-brown">
          <p>© {new Date().getFullYear()} Buad / بُعد — {t('All rights reserved', 'جميع الحقوق محفوظة')}</p>
          <div className="flex items-center gap-1.5 text-gold font-medium">
            <span>🇸🇦</span>
            <span>{t('Made in Saudi Arabia', 'صُنع في المملكة العربية السعودية')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
