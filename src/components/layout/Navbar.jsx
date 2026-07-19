import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, LogOut, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const navLinks = [
  { path: '/marketplace',  en: 'Marketplace',  ar: 'المتجر' },
  { path: '/library',      en: 'Library',       ar: 'المكتبة' },
  { path: '/my-products',  en: 'My Products',   ar: 'منتجاتي' },
  { path: '/suppliers',    en: 'Suppliers',     ar: 'الموردون' },
  { path: '/designers',    en: 'Designers',     ar: 'المصممون' },
  { path: '/ai-boq',       en: 'AI BOQ',        ar: 'AI BOQ' },
  { path: '/pricing',      en: 'Pricing',       ar: 'الأسعار' },
  { path: '/about',        en: 'About',         ar: 'عن بُعد' },
];

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, toggleLang, t }     = useLanguage();
  const { user, logout }            = useAuth();
  const location                    = useLocation();
  const navigate                    = useNavigate();

  useEffect(() => {
    console.log('[BUAD:navbar] user changed:', user?.email ?? null, '| role:', user?.role ?? null);
  }, [user]);

  const isHome      = location.pathname === '/';
  const transparent = isHome && !scrolled;

  // First letter of name for avatar bubble
  const initial = (user?.name || user?.email || '?')[0].toUpperCase();
  // Truncate to first word for display
  const displayName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <motion.nav
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={scrolled || !isHome
        ? { background: 'rgba(235,223,209,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(182,141,87,0.18)', boxShadow: '0 2px 24px rgba(43,27,14,0.08)' }
        : { background: 'transparent' }
      }
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between h-[70px]">

          {/* ── Logo ── */}
          <Link to="/" className="flex-shrink-0 group">
            <img
              src="/logo.png"
              alt="بُعد — BUAD"
              className="transition-all duration-200 group-hover:scale-105"
              style={{ height: '64px', width: 'auto', filter: transparent ? 'brightness(2.5)' : 'none' }}
            />
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map(link => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="relative px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200"
                  style={{
                    color: transparent
                      ? active ? '#F7F4EF' : 'rgba(247,244,239,0.65)'
                      : active ? '#2B1B0E' : '#6E5847',
                    background: transparent
                      ? active ? 'rgba(255,255,255,0.12)' : 'transparent'
                      : active ? 'rgba(182,141,87,0.14)' : 'transparent',
                  }}
                >
                  {lang === 'ar' ? link.ar : link.en}
                  {active && (
                    <motion.div
                      layoutId="nav-dot"
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: '#B68D57' }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── Desktop Actions ── */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
              style={{ color: transparent ? 'rgba(247,244,239,0.7)' : '#6E5847' }}
            >
              <Globe size={14} />
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>

            {user ? (
              <>
                {/* User name → dashboard */}
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
                  style={{ color: transparent ? 'rgba(247,244,239,0.85)' : '#2B1B0E' }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{ background: 'rgba(182,141,87,0.25)', color: '#B68D57' }}
                  >
                    {initial}
                  </span>
                  {displayName}
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all hover:opacity-70"
                  style={{ color: transparent ? 'rgba(247,244,239,0.7)' : '#6E5847' }}
                >
                  <LogOut size={14} />
                  {t('Sign Out', 'خروج')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
                  style={{ color: transparent ? 'rgba(247,244,239,0.7)' : '#6E5847' }}
                >
                  {t('Sign in', 'دخول')}
                </Link>

                <Link
                  to="/login"
                  className="flex items-center gap-2 font-semibold text-[13px] px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: '#B68D57',
                    color: '#2B1B0E',
                    boxShadow: '0 4px 16px rgba(182,141,87,0.28)',
                  }}
                >
                  {t('Get Started', 'ابدأ الآن')}
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile buttons ── */}
          <div className="lg:hidden flex items-center gap-1">
            <button
              onClick={toggleLang}
              className="p-2 rounded-lg text-sm transition-all"
              style={{ color: transparent ? 'rgba(247,244,239,0.8)' : '#6E5847' }}
            >
              <Globe size={18} />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg transition-all"
              style={{ color: transparent ? '#F7F4EF' : '#2B1B0E' }}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="lg:hidden overflow-hidden"
            style={{ background: 'rgba(235,223,209,0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(182,141,87,0.15)' }}
          >
            <div className="px-6 py-5 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    color: location.pathname === link.path ? '#2B1B0E' : '#6E5847',
                    background: location.pathname === link.path ? 'rgba(182,141,87,0.15)' : 'transparent',
                    fontWeight: location.pathname === link.path ? '600' : '500',
                  }}
                >
                  {lang === 'ar' ? link.ar : link.en}
                </Link>
              ))}

              <div className="pt-4 flex flex-col gap-2 border-t mt-2" style={{ borderColor: 'rgba(182,141,87,0.2)' }}>
                {user ? (
                  <>
                    {/* User info row */}
                    <div className="flex items-center gap-3 px-4 py-2">
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: 'rgba(182,141,87,0.2)', color: '#B68D57' }}
                      >
                        {initial}
                      </span>
                      <span className="text-sm font-medium" style={{ color: '#2B1B0E' }}>
                        {displayName}
                      </span>
                    </div>

                    <Link
                      to="/dashboard"
                      className="w-full text-center py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                      style={{ background: '#B68D57', color: '#2B1B0E' }}
                    >
                      <LayoutDashboard size={15} />
                      {t('Dashboard', 'لوحة التحكم')}
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-center py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
                      style={{ border: '1.5px solid rgba(43,27,14,0.2)', color: '#2B1B0E' }}
                    >
                      <LogOut size={15} />
                      {t('Sign Out', 'تسجيل الخروج')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login"
                      className="w-full text-center py-3 rounded-xl font-semibold text-sm transition-all"
                      style={{ background: '#B68D57', color: '#2B1B0E' }}
                    >
                      {t('Get Started', 'ابدأ الآن')}
                    </Link>
                    <Link to="/login"
                      className="w-full text-center py-3 rounded-xl font-medium text-sm transition-all"
                      style={{ border: '1.5px solid rgba(43,27,14,0.2)', color: '#2B1B0E' }}
                    >
                      {t('Sign in', 'دخول')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
