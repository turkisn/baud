import { useEffect, useState } from 'react';
import { ArrowRight, GitCompareArrows, ImageOff, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { mvpService } from '../services/mvpService';
import { productImage } from '../utils/productImage';
import { formatCurrency } from '../utils/number';

export default function Compare() {
  const { lang, t } = useLanguage();
  const { comparison, toggleComparison, clearComparison, maxComparison } = useWorkspace();
  const [details, setDetails] = useState({});
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setDetails({});
    Promise.allSettled(comparison.map((product) => mvpService.getProduct(product.slug)))
      .then((results) => {
        if (active) setDetails(Object.fromEntries(results.map((item, index) => {
          const saved = comparison[index];
          const data = item.status === 'fulfilled' && item.value?.id === saved.id ? item.value : null;
          return [saved.id, { data, status: item.status === 'rejected' ? 'error' : data ? 'ready' : 'missing' }];
        })));
      });
    return () => { active = false; };
  }, [comparison, attempt]);

  const products = comparison.map((product) => ({ ...product, ...details[product.id]?.data }));
  const specNames = [...new Set(products.flatMap((product) => (product.product_specifications || []).map((spec) => spec.specification_code || spec.specification_name_en || spec.specification_name_ar)))];
  const rows = [
    { label: t('Price', 'السعر'), get: (product) => formatCurrency(product.price, product.currency || 'SAR', lang === 'ar' ? 'ar-SA' : 'en-US') },
    { label: t('File formats', 'صيغ الملفات'), get: (product) => (product.available_formats || []).join(' · ') || null },
    { label: t('License', 'الترخيص'), get: (product) => product.license_type },
    { label: t('BUOD reference', 'مرجع بُعد'), get: (product) => product.buod_reference },
    { label: t('Category', 'الفئة'), get: (product) => lang === 'ar' ? product.category_name_ar || product.category_name_en : product.category_name_en || product.category_name_ar },
    { label: t('Supplier', 'المورد'), get: (product) => lang === 'ar' ? product.supplier_name_ar || product.supplier_name_en : product.supplier_name_en || product.supplier_name_ar },
    { label: t('Brand', 'العلامة التجارية'), get: (product) => product.brand_name },
    { label: t('Country of origin', 'بلد المنشأ'), get: (product) => product.country_of_origin },
    { label: t('Available files', 'الملفات المتاحة'), get: (product) => product.product_files?.length ?? product.available_file_count },
    { label: t('Availability', 'التوفر'), get: (product) => typeof product.in_stock === 'boolean' ? (product.in_stock ? t('In stock', 'متوفر') : t('Unavailable', 'غير متوفر')) : null },
    ...specNames.map((code) => ({ label: (() => { const spec = products.flatMap((item) => item.product_specifications || []).find((item) => (item.specification_code || item.specification_name_en || item.specification_name_ar) === code); return lang === 'ar' ? spec.specification_name_ar || spec.specification_name_en : spec.specification_name_en || spec.specification_name_ar; })(), get: (product) => { const spec = (product.product_specifications || []).find((item) => (item.specification_code || item.specification_name_en || item.specification_name_ar) === code); return spec && [spec.value, spec.unit].filter(Boolean).join(' '); } })),
  ];

  return <div className="min-h-screen bg-ivory pb-20 pt-[76px]"><header className="digital-hero border-b border-gold/10 px-6 py-16"><div className="mx-auto max-w-7xl"><p className="mb-3 text-xs font-bold uppercase tracking-[.24em] text-gold">BUOD / PRODUCT COMPARISON</p><h1 className="text-4xl font-black text-warm-white sm:text-5xl">{t('Compare products', 'مقارنة المنتجات')}</h1><p className="mt-4 text-sand/55">{t('Compare up to three products side by side using their actual specifications.', 'قارن حتى ثلاثة منتجات جنباً إلى جنب بناءً على مواصفاتها الفعلية.')}</p></div></header><div className="mx-auto max-w-7xl px-6 py-10">{products.length === 0 ? <div className="digital-panel rounded-3xl px-6 py-20 text-center"><GitCompareArrows size={46} className="mx-auto text-gold"/><h2 className="mt-5 text-2xl font-bold text-warm-white">{t('No products selected', 'لم يتم اختيار منتجات')}</h2><p className="mt-2 text-sand/55">{t('Use the comparison icon on any product to start.', 'استخدم أيقونة المقارنة في أي منتج للبدء.')}</p><Link to="/blocks" className="btn-gold mt-7 inline-flex"><ArrowRight size={16}/>{t('Explore products', 'استكشف المنتجات')}</Link></div> : <><div className="mb-5 flex justify-between text-sm text-sand/60"><span>{products.length} / {maxComparison} {t('products', 'منتجات')}</span><button type="button" onClick={clearComparison} className="flex items-center gap-1 text-red-300"><Trash2 size={15}/>{t('Clear comparison', 'مسح المقارنة')}</button></div><div className="digital-panel overflow-x-auto rounded-3xl"><table className="w-full min-w-[680px] table-fixed"><thead><tr><th className="w-44 p-5 text-start text-xs uppercase tracking-wider text-gold">{t('Product data', 'بيانات المنتج')}</th>{products.map((product) => <th key={product.id} className="border-s border-gold/15 p-5 text-start"><div className="relative"><button type="button" onClick={() => toggleComparison(product)} aria-label={t('Remove', 'إزالة')} className="absolute end-0 top-0 rounded-lg bg-black/70 p-1 text-sand"><X size={14}/></button><div className="mb-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-black/60">{productImage(product) ? <img src={productImage(product)} alt="" className="h-full w-full object-cover"/> : <ImageOff className="text-gold/40"/>}</div><Link to={`/blocks/${product.slug}`} className="text-sm font-bold text-warm-white hover:text-gold">{lang === 'ar' ? product.product_name_ar || product.product_name_en : product.product_name_en || product.product_name_ar}</Link><p role="status" className="mt-2 text-xs font-normal text-sand/70">{!details[product.id] ? t('Updating…', 'جارٍ التحديث…') : details[product.id].status === 'missing' ? t('No longer published', 'لم يعد منشوراً') : details[product.id].status === 'error' ? t('Could not update product', 'تعذّر تحديث المنتج') : Object.values(product.detail_errors || {}).some(Boolean) ? t('Some details could not be loaded', 'تعذّر تحميل بعض التفاصيل') : ''}</p>{details[product.id]?.status === 'error' && <button type="button" className="mt-2 text-xs text-gold underline" onClick={() => setAttempt((value) => value + 1)}>{t('Retry', 'إعادة المحاولة')}</button>}</div></th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.label}-${index}`} className="border-t border-gold/12"><th className="p-4 text-start text-xs font-semibold text-sand/60">{row.label}</th>{products.map((product) => <td key={product.id} className="border-s border-gold/12 p-4 text-sm text-warm-white">{details[product.id]?.status === 'ready' ? row.get(product) ?? '—' : '—'}</td>)}</tr>)}</tbody></table></div>{products.length < maxComparison && <Link to="/blocks" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold"><ArrowRight size={15}/>{t('Add another product', 'أضف منتجاً آخر')}</Link>}</>}</div></div>;
}
