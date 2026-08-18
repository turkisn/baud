import { AlertTriangle, Box, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function LoadingState() {
  const { t } = useLanguage();
  return <div className="flex min-h-52 items-center justify-center gap-3 text-light-brown"><Loader2 className="animate-spin text-gold" />{t('Loading library…', 'جارٍ تحميل المكتبة…')}</div>;
}

export function EmptyState({ title, description }) {
  return <div className="digital-panel rounded-2xl border-dashed px-6 py-16 text-center"><Box className="mx-auto mb-4 text-gold" size={34} /><h2 className="font-bold text-dark-brown">{title}</h2>{description && <p className="mx-auto mt-2 max-w-lg text-sm text-light-brown">{description}</p>}</div>;
}

export function ErrorState({ message }) {
  const { t } = useLanguage();
  return <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-800"><AlertTriangle className="mx-auto mb-3" /><p className="font-semibold">{t('We could not load this data.', 'تعذّر تحميل البيانات.')}</p>{message && <p className="mt-1 text-xs opacity-80">{message}</p>}</div>;
}
