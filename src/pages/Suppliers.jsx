import { useEffect, useRef, useState } from 'react';
import { Building2, Globe, ImageOff, Loader2, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../components/mvp/States';
import { useLanguage } from '../context/LanguageContext';
import { mvpService } from '../services/mvpService';

const PAGE_SIZE = 18;
const pick = (row, ...keys) => keys.map((key) => row?.[key]).find(Boolean);
const locationFor = (supplier) => [...new Set([supplier?.city, supplier?.country].filter(Boolean))].join(', ');
const safeWebsite = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

function uniqueSuppliers(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = row.id || row.supplier_id || row.slug;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function Suppliers() {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const nextOffset = useRef(0);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 550);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    mvpService.recordEvent('page_view', { page: 'suppliers' });
  }, []);

  useEffect(() => {
    const version = ++requestVersion.current;
    nextOffset.current = 0;
    loadingMoreRef.current = false;
    setSuppliers([]);
    setLoading(true);
    setLoadingMore(false);
    setHasMore(false);
    setError('');

    mvpService.getSuppliers({ query: debouncedQuery, limit: PAGE_SIZE, offset: 0 })
      .then((rows) => {
        if (version !== requestVersion.current) return;
        setSuppliers(uniqueSuppliers(rows));
        nextOffset.current = rows.length;
        setHasMore(rows.length === PAGE_SIZE);
        if (debouncedQuery.length >= 2) mvpService.recordEvent('search', { query: debouncedQuery, page: 'suppliers' });
      })
      .catch(() => { if (version === requestVersion.current) setError(true); })
      .finally(() => { if (version === requestVersion.current) setLoading(false); });
  }, [debouncedQuery]);

  const loadMore = async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError('');
    const version = requestVersion.current;
    try {
      const rows = await mvpService.getSuppliers({
        query: debouncedQuery,
        limit: PAGE_SIZE,
        offset: nextOffset.current,
      });
      if (version !== requestVersion.current) return;
      setSuppliers((current) => uniqueSuppliers([...current, ...rows]));
      nextOffset.current += rows.length;
      setHasMore(rows.length === PAGE_SIZE);
    } catch {
      if (version === requestVersion.current) setError(true);
    } finally {
      if (version === requestVersion.current) setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  };

  return <div className="min-h-screen bg-ivory pt-[76px]"><header className="bg-dark-brown px-6 py-16 text-warm-white"><div className="mx-auto max-w-7xl"><p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-gold">{t('Supplier windows', 'نوافذ الموردين')}</p><h1 className="text-4xl font-black sm:text-5xl">{t('Explore product suppliers', 'استكشف موردي المنتجات')}</h1><p className="mt-4 max-w-2xl text-sand/75">{t('Browse supplier data windows and their published construction blocks.', 'تصفح نوافذ بيانات الموردين وبلوكات البناء المنشورة.')}</p></div></header><main className="mx-auto max-w-7xl px-6 py-10"><label className="relative mb-8 block max-w-xl"><span className="sr-only">{t('Search suppliers', 'البحث عن الموردين')}</span><Search className="absolute start-4 top-1/2 -translate-y-1/2 text-light-brown" size={18}/><input className="input-field ps-11 shadow-card" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search by supplier name…', 'ابحث باسم المورد…')}/></label>
    {loading ? <LoadingState/> : suppliers.length === 0 && error ? <ErrorState/> : suppliers.length === 0 ? <EmptyState title={t('No supplier windows found', 'لا توجد نوافذ موردين')} description={t('Published supplier windows will appear here.', 'ستظهر نوافذ الموردين المنشورة هنا.')}/> : <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{suppliers.map((supplier) => {
        const name = lang === 'ar' ? pick(supplier, 'company_name_ar', 'name_ar', 'company_name_en') : pick(supplier, 'company_name_en', 'name_en', 'company_name_ar');
        const description = lang === 'ar' ? pick(supplier, 'description_ar', 'description_en') : pick(supplier, 'description_en', 'description_ar');
        const location = locationFor(supplier);
        const hasProductCount = supplier.product_count !== null
          && supplier.product_count !== undefined
          && Number.isFinite(Number(supplier.product_count));
        return <Link key={supplier.id || supplier.slug} to={`/suppliers/${supplier.slug}`} className="group overflow-hidden rounded-2xl border border-sand bg-white shadow-card transition hover:border-gold/50 hover:shadow-card-hover"><div className="relative h-36 bg-sand/40">{supplier.signed_cover_url ? <img src={supplier.signed_cover_url} alt="" className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-beige"><Building2 size={42}/></div>}<div className="absolute -bottom-8 start-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-ivory shadow-card">{supplier.signed_logo_url ? <img src={supplier.signed_logo_url} alt={`${name} logo`} className="h-full w-full object-contain"/> : <ImageOff className="text-beige"/>}</div></div><div className="p-6 pt-12"><h2 className="text-xl font-bold text-dark-brown group-hover:text-gold">{name}</h2>{description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-medium-brown">{description}</p>}<div className="mt-5 flex flex-wrap gap-4 border-t border-sand pt-4 text-xs text-light-brown">{location && <span className="flex items-center gap-1"><MapPin size={13}/>{location}</span>}{safeWebsite(supplier.website) && <span className="flex items-center gap-1"><Globe size={13}/>{t('Website', 'الموقع')}</span>}{hasProductCount && <span>{Number(supplier.product_count)} {t('published blocks', 'بلوكات منشورة')}</span>}</div></div></Link>;
      })}</div>
      {error && <div className="mt-6"><ErrorState/></div>}
      <div className="mt-10 flex flex-col items-center gap-3">{hasMore ? <button type="button" className="btn-primary min-w-44 justify-center disabled:opacity-60" onClick={loadMore} disabled={loadingMore}>{loadingMore && <Loader2 className="animate-spin" size={17}/>} {loadingMore ? t('Loading more…', 'جارٍ تحميل المزيد…') : t('Load more suppliers', 'تحميل المزيد من الموردين')}</button> : <p className="text-sm text-light-brown">{t('You have reached the end of the supplier windows.', 'وصلت إلى نهاية نوافذ الموردين.')}</p>}</div>
    </>}
  </main></div>;
}
