import { Box, Download, Eye, FileBox, ImageOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import WorkspaceActions from './WorkspaceActions';

const value = (row, keys) => keys.map((key) => row?.[key]).find((item) => item !== null && item !== undefined && item !== '');

export default function ProductCard({ product }) {
  const { lang, t } = useLanguage();
  const name = lang === 'ar'
    ? value(product, ['product_name_ar', 'name_ar', 'product_name_en'])
    : value(product, ['product_name_en', 'name_en', 'product_name_ar']);
  const category = lang === 'ar'
    ? value(product, ['category_name_ar', 'category_ar'])
    : value(product, ['category_name_en', 'category_en']);
  const supplier = lang === 'ar'
    ? value(product, ['supplier_name_ar', 'company_name_ar', 'supplier_name_en'])
    : value(product, ['supplier_name_en', 'company_name_en', 'supplier_name_ar']);
  const formats = (product.available_formats || []).slice(0, 3);
  const price = product.price !== null && product.price !== undefined
    ? new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: product.currency || 'SAR',
      maximumFractionDigits: 0,
    }).format(Number(product.price))
    : null;

  return (
    <Link to={`/blocks/${product.slug}`} className="digital-panel product-card group overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:border-gold/55">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#100e0b]">
        {product.signed_image_url ? (
          <img src={product.signed_image_url} alt={name || t('Construction product', 'منتج إنشائي')} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-light-brown"><ImageOff size={28} /><span className="text-xs">{product.image_error ? t('Image temporarily unavailable', 'الصورة غير متاحة مؤقتاً') : t('Image unavailable', 'الصورة غير متاحة')}</span></div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        {product.buod_reference && <span className="absolute start-3 top-3 rounded-lg border border-gold/20 bg-black/80 px-2.5 py-1 font-mono text-[9px] font-semibold tracking-wider text-light-gold backdrop-blur">{product.buod_reference}</span>}
        {formats.length > 0 && <div className="absolute end-3 top-3 flex max-w-[55%] flex-wrap justify-end gap-1">{formats.map((format) => <span key={format} className="rounded-md border border-gold/25 bg-black/80 px-2 py-1 font-mono text-[9px] font-bold text-light-gold backdrop-blur">{format}</span>)}</div>}
        <div className="absolute bottom-3 end-3"><WorkspaceActions product={product} compact/></div>
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gold"><Box size={12} />{category || t('Uncategorised', 'غير مصنف')}</div>
        <h3 className="line-clamp-2 min-h-12 text-lg font-bold leading-snug text-warm-white transition group-hover:text-light-gold">{name || t('Unnamed product', 'منتج بدون اسم')}</h3>
        <div className="mt-3 flex min-h-6 items-center justify-between gap-3">
          <span className="truncate text-xs text-light-brown">{supplier || t('Supplier unavailable', 'المورد غير متاح')}</span>
          {price && <span className="shrink-0 text-xs font-bold text-light-gold" dir="ltr">{price}</span>}
        </div>
        <div className="mt-4 flex items-center gap-3 border-t border-sand/70 pt-3 text-[11px] text-light-brown">
          <span className="flex items-center gap-1" title={t('Available files', 'الملفات المتاحة')}><FileBox size={12}/>{product.file_metadata_error ? '—' : product.available_file_count || 0}</span>
          <span className="flex items-center gap-1" title={t('Downloads', 'التحميلات')}><Download size={12}/>{Number(product.download_count || 0).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
          <span className="flex items-center gap-1" title={t('Views', 'المشاهدات')}><Eye size={12}/>{Number(product.view_count || 0).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
          <span className="ms-auto font-semibold text-gold">{t('Details', 'التفاصيل')}</span>
        </div>
      </div>
    </Link>
  );
}
