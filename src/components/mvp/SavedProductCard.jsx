import { useEffect, useRef, useState } from 'react';
import ProductCard from './ProductCard';
import { useLanguage } from '../../context/LanguageContext';
import { mvpService } from '../../services/mvpService';
import { createProductResolver } from '../../utils/productResolver';

const resolveProduct = createProductResolver((slug) => mvpService.getProduct(slug));

export default function SavedProductCard({ product }) {
  const { t } = useLanguage();
  const element = useRef(null);
  const [visible, setVisible] = useState(false);
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!window.IntersectionObserver) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '200px' });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    let active = true;
    setResult(null);
    resolveProduct(product).then((data) => {
      if (active) setResult({ data, status: data ? 'ready' : 'missing' });
    }).catch(() => { if (active) setResult({ status: 'error' }); });
    return () => { active = false; };
  }, [product, visible, attempt]);
  return <div ref={element}>
    <ProductCard product={result?.data || { ...product, price: null, signed_image_url: null }}/>
    {result?.status !== 'ready' && <p role="status" className="mt-2 text-xs text-sand/70">
      {!result ? t('Updating saved product…', 'جارٍ تحديث المنتج المحفوظ…') : result.status === 'missing' ? t('This saved product is no longer published.', 'هذا المنتج المحفوظ لم يعد منشوراً.') : t('Current product details could not be loaded.', 'تعذّر تحديث بيانات المنتج.')}
      {result?.status === 'error' && <button type="button" onClick={() => setAttempt((value) => value + 1)} className="ms-2 underline">{t('Retry', 'إعادة المحاولة')}</button>}
    </p>}
  </div>;
}
