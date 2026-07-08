import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const navLinks = [
  { path: '/', labelEn: 'Home', labelAr: 'الرئيسية' },
  { path: '/library', labelEn: '3D Library', labelAr: 'مكتبة 3D' },
  { path: '/suppliers', labelEn: 'Suppliers', labelAr: 'الموردون' },
  { path: '/about', labelEn: 'About', labelAr: 'عن بُعد' },
  { path: '/contact', labelEn: 'Contact', labelAr: 'تواصل معنا' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, toggleLang, t } = useLanguage();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-warm-white/95 backdrop-blur-md border-b border-sand shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-dark-brown rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg leading-none" style={{ fontFamily: 'Tajawal, sans-serif' }}>ب</span>
            </div>
            <div>
              <span className="text-dark-brown font-bold text-xl tracking-tight">
                {lang === 'ar' ? 'بُعد' : 'Buad'}
              </span>
              <span className="block text-light-brown text-[10px] leading-none -mt-0.5">بُعد</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'bg-dark-brown text-white'
                    : 'text-medium-brown hover:bg-sand hover:text-dark-brown'
                }`}
              >
                {lang === 'ar' ? link.labelAr : link.labelEn}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-medium-brown hover:bg-sand transition-all"
            >
              <Globe size={15} />
              <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
            <Link
              to="/supplier-dashboard"
              className="text-sm text-medium-brown hover:text-dark-brown px-3 py-2 rounded-lg hover:bg-sand transition-all"
            >
              {t('Dashboard', 'لوحة التحكم')}
            </Link>
            <Link
              to="/login"
              className="btn-primary text-sm px-5 py-2.5"
            >
              {t('Sign In', 'تسجيل الدخول')}
            </Link>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleLang} className="p-2 rounded-lg text-medium-brown hover:bg-sand">
              <Globe size={18} />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-medium-brown hover:bg-sand"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-warm-white border-t border-sand px-4 py-4 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                location.pathname === link.path
                  ? 'bg-dark-brown text-white'
                  : 'text-medium-brown hover:bg-sand'
              }`}
            >
              {lang === 'ar' ? link.labelAr : link.labelEn}
            </Link>
          ))}
          <div className="pt-3 border-t border-sand flex gap-2">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="flex-1 btn-primary text-sm justify-center py-3"
            >
              {t('Sign In', 'تسجيل الدخول')}
            </Link>
            <Link
              to="/supplier-dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex-1 btn-secondary text-sm justify-center py-3"
            >
              {t('Dashboard', 'لوحة التحكم')}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
