import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Building2, Filter, MapPin, Palette, Ruler, Search, SlidersHorizontal, X, LoaderCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/mvp/ProductCard';
import { EmptyState, ErrorState } from '../components/mvp/States';
import { useLanguage } from '../context/LanguageContext';
import { mvpService } from '../services/mvpService';
import { collectPages } from '../utils/catalog';

const PAGE_SIZE = 24;
const EMPTY_FACETS = { material: [], color: [], dimension: [] };
const EMPTY_SUPPLIERS = [];

export default function Blocks() {
  const { lang, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') || '';
  const supplierId = searchParams.get('supplier') || '';
  const city = searchParams.get('city') || '';
  const material = searchParams.get('material') || '';
  const color = searchParams.get('color') || '';
  const dimension = searchParams.get('dimension') || '';
  const [query, setQuery] = useState(urlQuery);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState(EMPTY_FACETS);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersReady, setSuppliersReady] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);
  const [suppliersError, setSuppliersError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const requestVersion = useRef(0);
  const controllerRef = useRef(null);
  const morePending = useRef(false);
  // Supplier metadata affects products only when a city filter is active.
  // Its late arrival must not reset an already-paginated catalog.
  const filterSuppliers = city ? suppliers : EMPTY_SUPPLIERS;
  const filtersReady = !city || suppliersReady;

  useEffect(() => { setQuery(urlQuery); }, [urlQuery]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = query.trim().slice(0, 200);
      if (trimmed === urlQuery) return;
      setSearchParams(current => {
        const next = new URLSearchParams(current);
        if (trimmed) next.set('q', trimmed); else next.delete('q');
        return next;
      }, { replace: true });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query, setSearchParams, urlQuery]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([mvpService.getCategories(), collectPages(page => mvpService.getSuppliers(page))])
      .then(([categoryResult, supplierResult]) => {
        if (!active) return;
        if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value);
        else setCategoriesError(true);
        if (supplierResult.status === 'fulfilled') setSuppliers(supplierResult.value);
        else setSuppliersError(true);
        setSuppliersReady(true);
      });
    mvpService.recordEvent('catalog_view', { page: 'blocks' });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const version = ++requestVersion.current;
    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;
    morePending.current = false;
    setProducts([]); setTotal(0); setLoading(true); setLoadingMore(false); setError(false);
    if (!filtersReady) return () => { controller.abort(); requestVersion.current += 1; };
    mvpService.getCatalogPage({
      query: urlQuery, categoryId, supplierId,
      facets: { city, material, color, dimension }, suppliers: filterSuppliers, limit: PAGE_SIZE, signal: controller.signal,
    }).then(result => {
      if (version !== requestVersion.current) return;
      setProducts(result.products); setTotal(result.total); setFacets(result.facets);
      if (urlQuery.trim().length >= 2) mvpService.recordEvent('search', { page: 'blocks' });
    }).catch(() => {
      if (!controller.signal.aborted && version === requestVersion.current) setError(true);
    }).finally(() => {
      if (version === requestVersion.current) setLoading(false);
    });
    return () => { controller.abort(); requestVersion.current += 1; };
  }, [urlQuery, categoryId, supplierId, city, material, color, dimension, filterSuppliers, filtersReady, retry]);

  const loadMore = async () => {
    if (morePending.current || loading) return;
    morePending.current = true; setLoadingMore(true); setError(false);
    const version = requestVersion.current;
    try {
      const result = await mvpService.getCatalogPage({
        query: urlQuery, categoryId, supplierId, facets: { city, material, color, dimension },
        suppliers: filterSuppliers, limit: PAGE_SIZE, offset: products.length, signal: controllerRef.current.signal,
      });
      if (version !== requestVersion.current) return;
      setProducts(current => [...current, ...result.products]); setTotal(result.total);
    } catch {
      if (version === requestVersion.current) setError(true);
    } finally {
      if (version === requestVersion.current) { morePending.current = false; setLoadingMore(false); }
    }
  };

  const changeFilter = (key, value) => setSearchParams(current => {
    const next = new URLSearchParams(current);
    if (value) next.set(key, value); else next.delete(key);
    return next;
  });
  const changeCategory = value => changeFilter('category', value);
  const changeSupplier = value => changeFilter('supplier', value);
  const setCity = value => changeFilter('city', value);
  const setMaterial = value => changeFilter('material', value);
  const setColor = value => changeFilter('color', value);
  const setDimension = value => changeFilter('dimension', value);
  const cities = [...new Set(suppliers.map(supplier => supplier.city).filter(Boolean))].sort();
  const materialValues = facets.material;
  const colorValues = facets.color;
  const dimensions = facets.dimension;
  const visibleProducts = products;
  const hasMore = products.length < total;
  const hasFilters = Boolean(urlQuery || categoryId || supplierId || city || material || color || dimension);
  return <div className="min-h-screen bg-ivory pt-[76px]">
    <header className="digital-hero relative overflow-hidden border-b border-gold/10 px-6 py-16 text-warm-white"><div className="relative mx-auto max-w-7xl"><p className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] text-gold"><span className="h-px w-8 bg-gold"/>{t('BUOD data network', 'شبكة بيانات بُعد')}</p><h1 className="text-4xl font-black sm:text-5xl">{t('Construction products', 'منتجات البناء')}</h1><p className="mt-4 max-w-2xl text-sand/55">{t('Search professional products through one connected digital identity for data, supplier and design resources.', 'ابحث في المنتجات الاحترافية عبر هوية رقمية واحدة تربط البيانات والمورد وموارد التصميم.')}</p></div></header>
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="digital-panel mb-8 grid gap-3 rounded-2xl p-4 lg:grid-cols-[1fr_240px_240px]">
        <label className="relative"><span className="sr-only">{t('Search blocks', 'البحث عن البلوكات')}</span><Search className="absolute start-4 top-1/2 -translate-y-1/2 text-light-brown" size={18}/><input className="input-field ps-11" maxLength={200} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Name, reference or keyword…', 'الاسم أو المرجع أو كلمة مفتاحية…')}/></label>
        <label className="relative"><span className="sr-only">{t('Category', 'الفئة')}</span><Filter className="absolute start-4 top-1/2 -translate-y-1/2 text-light-brown" size={17}/><select className="input-field appearance-none ps-11" value={categoryId} onChange={(event) => changeCategory(event.target.value)} disabled={categoriesError}><option value="">{categoriesError ? t('Categories unavailable', 'الفئات غير متاحة') : t('All categories', 'جميع الفئات')}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name_en} · {category.name_ar}</option>)}</select></label>
        <label className="relative"><span className="sr-only">{t('Supplier', 'المورد')}</span><Building2 className="absolute start-4 top-1/2 -translate-y-1/2 text-light-brown" size={17}/><select className="input-field appearance-none ps-11" value={supplierId} onChange={(event) => changeSupplier(event.target.value)} disabled={suppliersError}><option value="">{suppliersError ? t('Suppliers unavailable', 'الموردون غير متاحين') : t('All suppliers', 'جميع الموردين')}</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{lang === 'ar' ? supplier.company_name_ar || supplier.company_name_en : supplier.company_name_en || supplier.company_name_ar}</option>)}</select></label>
      </div>
      <div className="mb-7 flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold"><SlidersHorizontal size={15}/>{t('Smart filters', 'فلاتر ذكية')}</span><label className="relative"><span className="sr-only">{t('Filter by city', 'تصفية حسب المدينة')}</span><MapPin size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gold"/><select value={city} onChange={(event) => setCity(event.target.value)} className="rounded-xl border border-gold/20 bg-black/65 py-2 pe-4 ps-9 text-xs text-sand"><option value="">{t('All cities', 'كل المدن')}</option>{cities.map((item) => <option key={item}>{item}</option>)}</select></label><label className="relative"><span className="sr-only">{t('Filter by material', 'تصفية حسب المادة')}</span><Filter size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gold"/><select value={material} onChange={(event) => setMaterial(event.target.value)} className="rounded-xl border border-gold/20 bg-black/65 py-2 pe-4 ps-9 text-xs text-sand"><option value="">{t('All materials', 'كل المواد')}</option>{materialValues.map((item) => <option key={item}>{item}</option>)}</select></label><label className="relative"><span className="sr-only">{t('Filter by color or finish', 'تصفية حسب اللون أو التشطيب')}</span><Palette size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gold"/><select value={color} onChange={(event) => setColor(event.target.value)} className="rounded-xl border border-gold/20 bg-black/65 py-2 pe-4 ps-9 text-xs text-sand"><option value="">{t('All colors & finishes', 'كل الألوان والتشطيبات')}</option>{colorValues.map((item) => <option key={item}>{item}</option>)}</select></label><label className="relative"><span className="sr-only">{t('Filter by dimensions', 'تصفية حسب المقاسات')}</span><Ruler size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gold"/><select value={dimension} onChange={(event) => setDimension(event.target.value)} className="rounded-xl border border-gold/20 bg-black/65 py-2 pe-4 ps-9 text-xs text-sand"><option value="">{t('All dimensions', 'كل المقاسات')}</option>{dimensions.map((item) => <option key={item}>{item}</option>)}</select></label><span className="ms-auto inline-flex items-center gap-1.5 text-xs text-sand/55"><BadgeCheck size={14} className="text-gold"/>{visibleProducts.length} {t('of', 'من')} {total} {t('products', 'منتج')}</span></div>
      {categoriesError && <div role="status" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{t('Category filters could not be loaded. Product search is still available.', 'تعذّر تحميل فلاتر الفئات. لا يزال البحث في المنتجات متاحاً.')}</div>}
      {suppliersError && <div role="status" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{t('Supplier filters could not be loaded. Product search is still available.', 'تعذّر تحميل فلتر الموردين. لا يزال البحث في المنتجات متاحاً.')}</div>}

      {hasFilters && <button type="button" onClick={() => { setQuery(''); setSearchParams({}); }} className="mb-6 inline-flex items-center gap-2 text-sm text-gold"><X size={15}/>{t('Clear all filters', 'مسح جميع الفلاتر')}</button>}
      {loading ? <div className="catalog-skeleton-grid" role="status" aria-label={t('Loading products', 'جارٍ تحميل المنتجات')}>{Array.from({ length: 8 }, (_, i) => <div key={i} className="catalog-skeleton"><div/><span/><span/></div>)}</div> : products.length === 0 && error ? <div><ErrorState/><button type="button" onClick={() => setRetry(v => v + 1)} className="btn-gold mx-auto mt-4">{t('Try again', 'إعادة المحاولة')}</button></div> : visibleProducts.length === 0 ? <EmptyState title={t('No blocks found', 'لا توجد بلوكات')} description={t('Try a different search or category. New published blocks will appear here.', 'جرّب بحثاً أو فئة مختلفة. ستظهر البلوكات المنشورة الجديدة هنا.')}/> : <>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleProducts.map((product) => <ProductCard key={product.id || product.slug} product={product}/>)}</div>
        {error && <div className="mt-6"><ErrorState/></div>}
        <div className="mt-10 flex flex-col items-center gap-3">
          {hasMore ? <button type="button" onClick={loadMore} disabled={loadingMore} className="btn-primary min-w-44 justify-center">{loadingMore && <LoaderCircle size={17} className="animate-spin"/>}{loadingMore ? t('Loading…', 'جارٍ التحميل…') : error ? t('Retry loading more', 'إعادة تحميل المزيد') : t('Load more blocks', 'تحميل المزيد من البلوكات')}</button> : <p className="text-sm text-light-brown">{t('You have reached the end of the matching blocks.', 'وصلت إلى نهاية البلوكات المطابقة.')}</p>}
        </div>
      </>}
    </div>
  </div>;
}
