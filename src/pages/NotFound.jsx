import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
  const { lang, t } = useLanguage();
  return <div className="grid min-h-[70vh] place-items-center bg-ivory px-6 py-28 text-center"><div><p className="font-mono text-sm font-bold tracking-[.2em] text-gold">404</p><h1 className="mt-4 text-4xl font-black text-dark-brown">{t('Page not found', 'الصفحة غير موجودة')}</h1><p className="mx-auto mt-4 max-w-md leading-7 text-light-brown">{t('The address may be incorrect, or the page may have moved.', 'قد يكون العنوان غير صحيح أو تم نقل الصفحة.')}</p><Link to="/" className="btn-primary mt-8 justify-center"><ArrowLeft className={lang === 'ar' ? 'rotate-180' : ''} size={16}/>{t('Back to home', 'العودة للرئيسية')}</Link></div></div>;
}
