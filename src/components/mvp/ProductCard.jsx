import { Box, ImageOff, Layers3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

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

  return (
    <Link to={`/blocks/${product.slug}`} className="group overflow-hidden rounded-2xl border border-sand bg-white transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-card-hover">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand/35">
        {product.signed_image_url ? (
          <img src={product.signed_image_url} alt={name || t('Construction product', 'منتج إنشائي')} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-light-brown"><ImageOff size={28} /><span className="text-xs">{product.image_error ? t('Image temporarily unavailable', 'الصورة غير متاحة مؤقتاً') : t('Image unavailable', 'الصورة غير متاحة')}</span></div>
        )}
        {product.buod_reference && <span className="absolute start-3 top-3 rounded-lg bg-deep-brown/90 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-warm-white">{product.buod_reference}</span>}
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gold"><Box size={12} />{category || t('Uncategorised', 'غير مصنف')}</div>
        <h3 className="line-clamp-2 min-h-12 text-lg font-bold leading-snug text-dark-brown">{name || t('Unnamed product', 'منتج بدون اسم')}</h3>
        <div className="mt-4 flex items-center justify-between border-t border-sand/70 pt-3 text-xs text-light-brown">
          <span className="truncate">{supplier || t('Supplier unavailable', 'المورد غير متاح')}</span>
          <span className="flex items-center gap-1"><Layers3 size={12} />{t('View block', 'عرض البلوك')}</span>
        </div>
      </div>
    </Link>
  );
}
