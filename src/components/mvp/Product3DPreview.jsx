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
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const available = hasProduct3DPreview(product);
  const name = lang === 'ar'
    ? product?.product_name_ar || product?.product_name_en
    : product?.product_name_en || product?.product_name_ar;

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    const appRoot = document.getElementById('root');
    const previousRootInert = appRoot?.inert;
    const previousRootAriaHidden = appRoot?.getAttribute('aria-hidden');
    const handleDialogKeys = (event) => {
      if (event.key === 'Escape' && !document.fullscreenElement) {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...(panelRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || [])]
        .filter((element) => !element.disabled && element.getAttribute('aria-hidden') !== 'true');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const updateFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.body.style.overflow = 'hidden';
    document.body.classList.add('product-3d-open');
    if (appRoot) {
      appRoot.inert = true;
      appRoot.setAttribute('aria-hidden', 'true');
    }
    closeRef.current?.focus();
    document.addEventListener('keydown', handleDialogKeys);
    document.addEventListener('fullscreenchange', updateFullscreen);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('product-3d-open');
      document.removeEventListener('keydown', handleDialogKeys);
      document.removeEventListener('fullscreenchange', updateFullscreen);
      if (appRoot) {
        appRoot.inert = Boolean(previousRootInert);
        if (previousRootAriaHidden === null) appRoot.removeAttribute('aria-hidden');
        else appRoot.setAttribute('aria-hidden', previousRootAriaHidden);
      }
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
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
    <button ref={triggerRef} type="button" onClick={openPreview} className={`btn-gold justify-center ${className}`}><Box size={17}/>{t('View interactive 3D', 'عرض 3D تفاعلي')}</button>
  ) : (
    <button ref={triggerRef} type="button" onClick={openPreview} className={`product-3d-card-button ${className}`} aria-label={t(`View ${name} in 3D`, `عرض ${name} بشكل ثلاثي الأبعاد`)}><Box size={14}/><span>{t('View 3D', 'عرض 3D')}</span></button>
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
                <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label={t('Close 3D view', 'إغلاق العرض ثلاثي الأبعاد')}><X size={20}/></button>
              </div>
            </header>
            <div className="product-3d-canvas-wrap">
              {product.signed_image_url && <aside className="product-3d-reference"><img src={product.signed_image_url} alt="" loading="eager" decoding="async"/><span>{t('Reference image', 'الصورة المرجعية')}</span></aside>}
              <Suspense fallback={<div className="product-3d-loading"><span/><p>{t('Preparing 3D model…', 'جارٍ تجهيز المجسم…')}</p></div>}>
                <Product3DViewer
                  slug={product.slug}
                  label={t(`Interactive 3D model of ${name}`, `مجسم تفاعلي ثلاثي الأبعاد لـ ${name}`)}
                  pauseLabel={t('Pause rotation', 'إيقاف الدوران')}
                  resumeLabel={t('Resume rotation', 'استئناف الدوران')}
                  resetLabel={t('Reset 3D view', 'إعادة ضبط العرض ثلاثي الأبعاد')}
                  errorLabel={t('The 3D view could not start on this device. Close it and try again.', 'تعذّر تشغيل العرض ثلاثي الأبعاد على هذا الجهاز. أغلقه وحاول مرة أخرى.')}
                />
              </Suspense>
            </div>
            <div className="product-3d-dialog-footer"><MousePointer2 size={15}/>{t('Drag to rotate · Scroll to zoom · Double-click to reset', 'اسحب للدوران · استخدم عجلة الفأرة للتقريب · انقر مرتين لإعادة الضبط')}<span>{t('BUOD demonstration model', 'نموذج بُعد تجريبي')}</span></div>
          </section>
        </div>,
        document.body
      )}
    </>
  );
}
