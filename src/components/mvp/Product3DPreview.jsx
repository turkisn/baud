import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Box, Maximize2, Minimize2, MousePointer2, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import { hasDemo3DModel } from '../../data/demo3dCatalog';

const Product3DViewer = lazy(() => import('./Product3DViewer'));

const hasProduct3DPreview = (product) => hasDemo3DModel(product?.slug);

export default function Product3DPreview({ product, variant = 'card', className = '' }) {
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const panelRef = useRef(null);
  const available = hasProduct3DPreview(product);
  const name = lang === 'ar'
    ? product?.product_name_ar || product?.product_name_en
    : product?.product_name_en || product?.product_name_ar;

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => { if (event.key === 'Escape' && !document.fullscreenElement) setOpen(false); };
    const updateFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('fullscreenchange', updateFullscreen);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('fullscreenchange', updateFullscreen);
    };
  }, [open]);

  if (!available) return null;

  const openPreview = (event) => {
    event?.preventDefault(); event?.stopPropagation(); setOpen(true);
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await panelRef.current?.requestFullscreen?.();
    } catch {
      // Fullscreen may be blocked by browser policy; the modal remains usable.
    }
  };
  const button = variant === 'detail' ? (
    <button type="button" onClick={openPreview} className={`btn-gold justify-center ${className}`}><Box size={17}/>{t('View interactive 3D', 'عرض 3D تفاعلي')}</button>
  ) : (
    <button type="button" onClick={openPreview} className={`product-3d-card-button ${className}`} aria-label={t(`View ${name} in 3D`, `عرض ${name} بشكل ثلاثي الأبعاد`)}><Box size={14}/><span>{t('View 3D', 'عرض 3D')}</span></button>
  );

  return (
    <>
      {button}
      {open && createPortal(
        <div className="product-3d-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section ref={panelRef} className="product-3d-dialog" role="dialog" aria-modal="true" aria-label={t(`Interactive 3D view for ${name}`, `عرض ثلاثي الأبعاد تفاعلي لـ ${name}`)}>
            <header>
              <div><p>BUOD / INTERACTIVE 3D</p><h2>{name}</h2></div>
              <div className="flex gap-2">
                <button type="button" onClick={toggleFullscreen} aria-label={t('Toggle fullscreen', 'تبديل ملء الشاشة')}>{fullscreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}</button>
                <button type="button" onClick={() => setOpen(false)} aria-label={t('Close 3D view', 'إغلاق العرض ثلاثي الأبعاد')}><X size={20}/></button>
              </div>
            </header>
            <div className="product-3d-canvas-wrap">
              <Suspense fallback={<div className="product-3d-loading"><span/><p>{t('Preparing 3D model…', 'جارٍ تجهيز المجسم…')}</p></div>}>
                <Product3DViewer slug={product.slug} label={t(`Interactive 3D model of ${name}`, `مجسم تفاعلي ثلاثي الأبعاد لـ ${name}`)} />
              </Suspense>
            </div>
            <footer><MousePointer2 size={15}/>{t('Drag to rotate · Scroll to zoom · Double-click to reset', 'اسحب للدوران · استخدم عجلة الفأرة للتقريب · انقر مرتين لإعادة الضبط')}<span>{t('BUOD demonstration model', 'نموذج بُعد تجريبي')}</span></footer>
          </section>
        </div>,
        document.body
      )}
    </>
  );
}
