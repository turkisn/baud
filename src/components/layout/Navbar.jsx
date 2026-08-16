import { useEffect, useState } from 'react';
import { Globe, LogOut, Menu, UserRound, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import BrandWordmark from './BrandWordmark';

const links = [
  { to: '/blocks', en: 'Blocks', ar: 'البلوكات' },
  { to: '/suppliers', en: 'Suppliers', ar: 'الموردون' },
];

export default function Navbar() {
  const { lang, t, toggleLang } = useLanguage();
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const home = location.pathname === '/';

  useEffect(() => setOpen(false), [location.pathname]);
  const signOut = async () => { await logout(); navigate('/'); };

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 h-[76px] border-b backdrop-blur-xl ${home ? 'border-white/10 bg-deep-brown/85' : 'border-sand bg-ivory/95'}`}>
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Link to="/" aria-label={t('BUOD home', 'الصفحة الرئيسية لمنصة BUOD')}><BrandWordmark inverse={home} compact /></Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => <Link key={link.to} to={link.to} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${location.pathname.startsWith(link.to) ? 'bg-gold/15 text-gold' : home ? 'text-sand/80 hover:text-white' : 'text-medium-brown hover:bg-sand/50 hover:text-dark-brown'}`}>{lang === 'ar' ? link.ar : link.en}</Link>)}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button onClick={toggleLang} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${home ? 'text-sand/80 hover:text-white' : 'text-medium-brown hover:text-dark-brown'}`} aria-label={t('Switch language', 'تغيير اللغة')}><Globe size={16} />{lang === 'ar' ? 'EN' : 'عربي'}</button>
          {user ? <>
            <Link to={isAdmin() ? '/admin/dashboard' : '/'} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${home ? 'text-white' : 'text-dark-brown'}`}><UserRound size={16} />{user.name?.split(' ')[0] || t('Account', 'الحساب')}</Link>
            <button onClick={signOut} className={`${home ? 'text-sand' : 'text-medium-brown'} rounded-lg p-2 hover:bg-gold/10`} aria-label={t('Sign out', 'تسجيل الخروج')}><LogOut size={17} /></button>
          </> : <>
            <Link to="/login" className={`rounded-lg px-3 py-2 text-sm font-semibold ${home ? 'text-warm-white hover:bg-white/10' : 'text-dark-brown hover:bg-sand/60'}`}>{t('Sign In', 'تسجيل الدخول')}</Link>
            <Link to="/login?mode=signup" className="btn-gold px-5 py-2.5 text-sm">{t('Create account', 'إنشاء حساب')}</Link>
          </>}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <button onClick={toggleLang} className={home ? 'p-2 text-white' : 'p-2 text-dark-brown'} aria-label={t('Switch language', 'تغيير اللغة')}><Globe size={19} /></button>
          <button onClick={() => setOpen(!open)} className={home ? 'p-2 text-white' : 'p-2 text-dark-brown'} aria-label={t('Open menu', 'فتح القائمة')}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>

      {open && <div className="border-t border-sand bg-ivory p-5 shadow-brand md:hidden">
        {links.map((link) => <Link key={link.to} to={link.to} className="block rounded-lg px-4 py-3 font-semibold text-dark-brown hover:bg-sand/50">{lang === 'ar' ? link.ar : link.en}</Link>)}
        <div className="mt-3 grid gap-2 border-t border-sand pt-4">
          {user ? <button onClick={signOut} className="flex items-center justify-center gap-2 rounded-xl border border-sand px-4 py-3 font-semibold text-dark-brown"><LogOut size={16} />{t('Sign out', 'تسجيل الخروج')}</button> : <><Link to="/login" className="rounded-xl border border-dark-brown px-4 py-3 text-center font-semibold text-dark-brown">{t('Sign In', 'تسجيل الدخول')}</Link><Link to="/login?mode=signup" className="btn-gold justify-center">{t('Create account', 'إنشاء حساب')}</Link></>}
        </div>
      </div>}
    </nav>
  );
}
