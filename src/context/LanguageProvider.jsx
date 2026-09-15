import { useCallback, useEffect, useMemo, useState } from 'react';
import { LanguageContext } from './LanguageContext';

function initialLanguage() {
  try {
    const saved = window.localStorage.getItem('buod_language');
    if (saved === 'ar' || saved === 'en') return saved;
  } catch {
    // Storage may be disabled; English remains the safe default.
  }
  return 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(initialLanguage);

  const toggleLang = useCallback(() => {
    setLang((current) => current === 'en' ? 'ar' : 'en');
  }, []);

  const t = useCallback((en, ar) => lang === 'ar' ? ar : en, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try { window.localStorage.setItem('buod_language', lang); } catch { /* Storage may be disabled. */ }
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    toggleLang,
    t,
    isRTL: lang === 'ar',
  }), [lang, t, toggleLang]);

  return (
    <LanguageContext.Provider value={value}>
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={lang === 'ar' ? 'font-arabic' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}
