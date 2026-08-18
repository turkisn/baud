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
  useEffect(() => setOpen(false), [location.pathname]);
  const signOut = async () => { await logout(); navigate('/'); };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 h-[76px] border-b border-gold/15 bg-black/75 shadow-[0_8px_30px_rgba(0,0,0,.35)] backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <Link to="/" aria-label={t('BUOD home', 'الصفحة الرئيسية لمنصة BUOD')}><BrandWordmark inverse compact /></Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => <Link key={link.to} to={link.to} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${location.pathname.startsWith(link.to) ? 'bg-gold/15 text-light-gold' : 'text-sand/70 hover:bg-white/5 hover:text-white'}`}>{lang === 'ar' ? link.ar : link.en}</Link>)}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button onClick={toggleLang} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sand/75 hover:bg-white/5 hover:text-white" aria-label={t('Switch language', 'تغيير اللغة')}><Globe size={16} />{lang === 'ar' ? 'EN' : 'عربي'}</button>
          {user ? <>
            <Link to={isAdmin() ? '/admin/dashboard' : '/'} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white hover:bg-white/5"><UserRound size={16} />{user.name?.split(' ')[0] || t('Account', 'الحساب')}</Link>
            <button onClick={signOut} className="rounded-lg p-2 text-sand/70 hover:bg-gold/10 hover:text-gold" aria-label={t('Sign out', 'تسجيل الخروج')}><LogOut size={17} /></button>
          </> : <>
            <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-warm-white hover:bg-white/10">{t('Sign In', 'تسجيل الدخول')}</Link>
            <Link to="/login?mode=signup" className="btn-gold px-5 py-2.5 text-sm">{t('Create account', 'إنشاء حساب')}</Link>
          </>}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <button onClick={toggleLang} className="p-2 text-white" aria-label={t('Switch language', 'تغيير اللغة')}><Globe size={19} /></button>
          <button onClick={() => setOpen(!open)} className="p-2 text-white" aria-label={t('Open menu', 'فتح القائمة')}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>

      {open && <div className="border-t border-gold/15 bg-[#080705]/95 p-5 shadow-2xl backdrop-blur-xl md:hidden">
        {links.map((link) => <Link key={link.to} to={link.to} className="block rounded-lg px-4 py-3 font-semibold text-sand hover:bg-white/5 hover:text-gold">{lang === 'ar' ? link.ar : link.en}</Link>)}
        <div className="mt-3 grid gap-2 border-t border-gold/15 pt-4">
          {user ? <button onClick={signOut} className="flex items-center justify-center gap-2 rounded-xl border border-gold/20 px-4 py-3 font-semibold text-sand"><LogOut size={16} />{t('Sign out', 'تسجيل الخروج')}</button> : <><Link to="/login" className="rounded-xl border border-gold/25 px-4 py-3 text-center font-semibold text-sand">{t('Sign In', 'تسجيل الدخول')}</Link><Link to="/login?mode=signup" className="btn-gold justify-center">{t('Create account', 'إنشاء حساب')}</Link></>}
        </div>
      </div>}
    </nav>
  );
}
