import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Building2, ExternalLink, Globe, Loader2, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '../components/mvp/ProductCard';
import { EmptyState, ErrorState, LoadingState } from '../components/mvp/States';
import { useLanguage } from '../context/LanguageContext';
import { mvpService } from '../services/mvpService';

const PAGE_SIZE = 24;
const pick = (row, ...keys) => keys.map((key) => row?.[key]).find(Boolean);
const locationFor = (supplier) => [...new Set([supplier?.city, supplier?.country].filter(Boolean))].join(', ');
const safeExternalUrl = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

function uniqueProducts(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = row.id || row.product_id || row.slug;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function SupplierDetail() {
  const { slug } = useParams();
  const { lang, t } = useLanguage();
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [productsError, setProductsError] = useState('');
  const requestVersion = useRef(0);
  const nextOffset = useRef(0);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const version = ++requestVersion.current;
    nextOffset.current = 0;
    loadingMoreRef.current = false;
    setSupplier(null);
    setProducts([]);
    setLoading(true);
    setProductsLoading(false);
    setLoadingMore(false);
    setHasMore(false);
    setError('');
    setProductsError('');
    mvpService.recordEvent('page_view', { page: 'supplier_detail' });

    mvpService.getSupplier(slug).then(async (data) => {
      if (version !== requestVersion.current) return;
      setSupplier(data);
      setLoading(false);
      if (!data) return;

      const supplierId = data.id || data.supplier_id;
      mvpService.recordEvent('supplier_view', { supplier_id: supplierId });
      if (!supplierId) return;
      setProductsLoading(true);
      try {
        const rows = await mvpService.searchProducts({ supplierId, limit: PAGE_SIZE, offset: 0 });
        if (version !== requestVersion.current) return;
        setProducts(uniqueProducts(rows));
        nextOffset.current = rows.length;
        setHasMore(rows.length === PAGE_SIZE);
      } catch (requestError) {
        if (version === requestVersion.current) setProductsError(requestError.message);
      } finally {
        if (version === requestVersion.current) setProductsLoading(false);
      }
    }).catch((requestError) => {
      if (version === requestVersion.current) setError(requestError.message);
    }).finally(() => {
      if (version === requestVersion.current) setLoading(false);
    });
  }, [slug]);

  const loadMore = async () => {
    const supplierId = supplier?.id || supplier?.supplier_id;
    if (!supplierId || loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setProductsError('');
    const version = requestVersion.current;
    try {
      const rows = await mvpService.searchProducts({
        supplierId,
        limit: PAGE_SIZE,
        offset: nextOffset.current,
      });
      if (version !== requestVersion.current) return;
      setProducts((current) => uniqueProducts([...current, ...rows]));
      nextOffset.current += rows.length;
      setHasMore(rows.length === PAGE_SIZE);
    } catch (requestError) {
      if (version === requestVersion.current) setProductsError(requestError.message);
    } finally {
      if (version === requestVersion.current) setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  };

  if (loading) return <div className="min-h-screen bg-ivory pt-[76px]"><LoadingState/></div>;
  if (error || !supplier) return <div className="min-h-screen bg-ivory px-6 pt-[108px]"><ErrorState message={error || t('Supplier not found.', 'المورد غير موجود.')}/></div>;

  const name = lang === 'ar' ? pick(supplier, 'company_name_ar', 'name_ar', 'company_name_en') : pick(supplier, 'company_name_en', 'name_en', 'company_name_ar');
  const otherName = lang === 'ar' ? supplier.company_name_en : supplier.company_name_ar;
  const description = lang === 'ar' ? pick(supplier, 'description_ar', 'description_en') : pick(supplier, 'description_en', 'description_ar');
  const location = locationFor(supplier);
  const websiteUrl = safeExternalUrl(supplier.website);

  return <div className="min-h-screen bg-ivory pb-20 pt-[76px]"><div className="relative h-64 overflow-hidden bg-dark-brown">{supplier.signed_cover_url && <img src={supplier.signed_cover_url} alt="" className="h-full w-full object-cover opacity-55"/>}<div className="absolute inset-0 bg-gradient-to-t from-deep-brown via-deep-brown/30 to-transparent"/></div><main className="mx-auto -mt-20 max-w-7xl px-6"><Link to="/suppliers" className="relative mb-5 inline-flex items-center gap-2 text-sm font-semibold text-warm-white"><ArrowLeft className={lang === 'ar' ? 'rotate-180' : ''} size={16}/>{t('All suppliers', 'جميع الموردين')}</Link><section className="relative rounded-3xl border border-sand bg-white p-7 shadow-brand-lg sm:p-10"><div className="flex flex-col gap-6 sm:flex-row sm:items-start"><div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sand bg-ivory">{supplier.signed_logo_url ? <img src={supplier.signed_logo_url} alt={`${name} logo`} className="h-full w-full object-contain"/> : <Building2 className="text-beige" size={42}/>}</div><div className="flex-1"><h1 className="text-3xl font-black text-dark-brown sm:text-4xl">{name}</h1>{otherName && <p className="mt-1 text-light-brown">{otherName}</p>}<p className="mt-5 max-w-3xl whitespace-pre-line leading-7 text-medium-brown">{description || t('Supplier description unavailable.', 'وصف المورد غير متاح.')}</p><div className="mt-6 flex flex-wrap gap-4 text-sm">{location && <span className="flex items-center gap-2 text-medium-brown"><MapPin className="text-gold" size={17}/>{location}</span>}{websiteUrl && <a href={websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold text-gold hover:underline"><Globe size={17}/>{t('Visit website', 'زيارة الموقع')}<ExternalLink size={13}/></a>}</div></div></div></section>
    <section className="mt-14"><div className="mb-7 flex flex-wrap items-end justify-between gap-3"><h2 className="text-2xl font-black text-dark-brown">{t('Published BUOD blocks', 'بلوكات بُعد المنشورة')}</h2>{supplier.product_count !== null && supplier.product_count !== undefined && <p className="text-sm text-light-brown">{supplier.product_count} {t('published', 'منشور')}</p>}</div>
      {productsLoading
        ? <LoadingState/>
        : products.length === 0 && productsError
          ? <ErrorState message={productsError}/>
          : products.length
            ? <><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id || product.slug} product={product}/>)}</div>{productsError && <div className="mt-6"><ErrorState message={productsError}/></div>}<div className="mt-10 flex flex-col items-center gap-3">{hasMore ? <button type="button" onClick={loadMore} disabled={loadingMore} className="btn-primary min-w-44 justify-center disabled:opacity-60">{loadingMore && <Loader2 className="animate-spin" size={17}/>} {loadingMore ? t('Loading more…', 'جارٍ تحميل المزيد…') : t('Load more blocks', 'تحميل المزيد من البلوكات')}</button> : <p className="text-sm text-light-brown">{t('All published blocks are shown.', 'تم عرض جميع البلوكات المنشورة.')}</p>}</div></>
            : <EmptyState title={t('No published blocks yet', 'لا توجد بلوكات منشورة حالياً')}/>}
    </section></main></div>;
}
