import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Building2, Filter, Loader2, MapPin, Palette, Ruler, Search, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/mvp/ProductCard';
import { EmptyState, ErrorState, LoadingState } from '../components/mvp/States';
import { useLanguage } from '../context/LanguageContext';
import { mvpService } from '../services/mvpService';

const PAGE_SIZE = 24;

function uniqueProducts(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = row.id || row.product_id || row.slug;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function Blocks() {
  const { lang, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') || '';
  const supplierId = searchParams.get('supplier') || '';
  const [query, setQuery] = useState(urlQuery);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categoriesError, setCategoriesError] = useState(false);
  const [suppliersError, setSuppliersError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [city, setCity] = useState('');
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');
  const [dimension, setDimension] = useState('');
  const requestVersion = useRef(0);
  const loadingMoreRef = useRef(false);
  const nextOffset = useRef(0);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed === urlQuery) return;
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (trimmed) next.set('q', trimmed);
        else next.delete('q');
        return next;
      });
    }, 550);
    return () => window.clearTimeout(timer);
  }, [query, setSearchParams, urlQuery]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      mvpService.getCategories(),
      mvpService.getSuppliers({ limit: 100 }),
    ]).then(([categoryResult, supplierResult]) => {
      if (!active) return;
      if (categoryResult.status === 'fulfilled') {
        setCategories(categoryResult.value);
        setCategoriesError(false);
      } else {
        setCategoriesError(true);
      }
      if (supplierResult.status === 'fulfilled') {
        setSuppliers(supplierResult.value);
        setSuppliersError(false);
      } else {
        setSuppliersError(true);
      }
    });
    mvpService.recordEvent('page_view', { page: 'blocks' });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (categoryId) mvpService.recordEvent('filter', { category_id: categoryId, page: 'blocks' });
  }, [categoryId]);

  useEffect(() => {
    if (supplierId) mvpService.recordEvent('filter', { supplier_id: supplierId, page: 'blocks' });
  }, [supplierId]);

  useEffect(() => {
    const version = ++requestVersion.current;
    loadingMoreRef.current = false;
    setProducts([]);
    setLoading(true);
    setLoadingMore(false);
    setHasMore(false);
    setError('');
    nextOffset.current = 0;

    mvpService.searchProducts({
      query: urlQuery,
      categoryId: categoryId || null,
      supplierId: supplierId || null,
      limit: PAGE_SIZE,
      offset: 0,
    }).then((rows) => {
      if (version !== requestVersion.current) return;
      setProducts(uniqueProducts(rows));
      nextOffset.current = rows.length;
      setHasMore(rows.length === PAGE_SIZE);
      if (urlQuery.trim().length >= 2) mvpService.recordEvent('search', { query: urlQuery.trim(), page: 'blocks' });
    }).catch(() => {
      if (version === requestVersion.current) setError(true);
    }).finally(() => {
      if (version === requestVersion.current) setLoading(false);
    });
  }, [categoryId, supplierId, urlQuery]);

  const changeCategory = (nextCategory) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextCategory) next.set('category', nextCategory);
      else next.delete('category');
      return next;
    });
  };

  const changeSupplier = (nextSupplier) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextSupplier) next.set('supplier', nextSupplier);
      else next.delete('supplier');
      return next;
    });
  };

  const loadMore = async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError('');
    const version = requestVersion.current;
    try {
      const rows = await mvpService.searchProducts({
        query: urlQuery,
        categoryId: categoryId || null,
        supplierId: supplierId || null,
        limit: PAGE_SIZE,
        offset: nextOffset.current,
      });
      if (version !== requestVersion.current) return;
      setProducts((current) => uniqueProducts([...current, ...rows]));
      nextOffset.current += rows.length;
      setHasMore(rows.length === PAGE_SIZE);
    } catch {
      if (version === requestVersion.current) setError(true);
    } finally {
      if (version === requestVersion.current) setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  };

  const cities = [...new Set(suppliers.map((supplier) => supplier.city).filter(Boolean))].sort();
  const materialValues = [...new Set(products.flatMap((product) => [
    ...(product.product_materials || []).map((item) => lang === 'ar' ? item.material_name_ar || item.material_name_en : item.material_name_en || item.material_name_ar),
    ...(product.product_specifications || []).filter((item) => /material|ماد/i.test(`${item.specification_name_en} ${item.specification_name_ar}`)).map((item) => item.value),
  ]).filter(Boolean))].sort();
  const colorValues = [...new Set(products.flatMap((product) => [
    ...(product.product_materials || []).map((item) => item.color),
    ...(product.product_specifications || []).filter((item) => /color|colour|finish|لون|تشطيب/i.test(`${item.specification_name_en} ${item.specification_name_ar}`)).map((item) => item.value),
  ]).filter(Boolean))].sort();
  const dimensions = [...new Set(products.flatMap((product) => (product.product_specifications || [])
    .filter((item) => /dimension|width|height|depth|length|diameter|الأبعاد|الارتفاع|الطول|العرض/i.test(`${item.specification_name_en} ${item.specification_name_ar}`))
    .map((item) => [item.value, item.unit].filter(Boolean).join(' '))).filter(Boolean))].sort();
  const visibleProducts = products.filter((product) => {
    if (city && suppliers.find((supplier) => supplier.id === product.supplier_id)?.city !== city) return false;
    if (material && ![...(product.product_materials || []).flatMap((item) => [item.material_name_ar, item.material_name_en]), ...(product.product_specifications || []).map((item) => item.value)].includes(material)) return false;
    if (color && ![...(product.product_materials || []).map((item) => item.color), ...(product.product_specifications || []).map((item) => item.value)].includes(color)) return false;
    if (dimension && !(product.product_specifications || []).some((item) => [item.value, item.unit].filter(Boolean).join(' ') === dimension)) return false;
    return true;
  });

  return <div className="min-h-screen bg-ivory pt-[76px]">
    <header className="digital-hero relative overflow-hidden border-b border-gold/10 px-6 py-16 text-warm-white"><div className="relative mx-auto max-w-7xl"><p className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] text-gold"><span className="h-px w-8 bg-gold"/>{t('BUOD data network', 'شبكة بيانات بُعد')}</p><h1 className="text-4xl font-black sm:text-5xl">{t('Construction products', 'منتجات البناء')}</h1><p className="mt-4 max-w-2xl text-sand/55">{t('Search professional products through one connected digital identity for data, supplier and design resources.', 'ابحث في المنتجات الاحترافية عبر هوية رقمية واحدة تربط البيانات والمورد وموارد التصميم.')}</p></div></header>
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="digital-panel mb-8 grid gap-3 rounded-2xl p-4 lg:grid-cols-[1fr_240px_240px]">
        <label className="relative"><span className="sr-only">{t('Search blocks', 'البحث عن البلوكات')}</span><Search className="absolute start-4 top-1/2 -translate-y-1/2 text-light-brown" size={18}/><input className="input-field ps-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Name, reference or keyword…', 'الاسم أو المرجع أو كلمة مفتاحية…')}/></label>
        <label className="relative"><span className="sr-only">{t('Category', 'الفئة')}</span><Filter className="absolute start-4 top-1/2 -translate-y-1/2 text-light-brown" size={17}/><select className="input-field appearance-none ps-11" value={categoryId} onChange={(event) => changeCategory(event.target.value)} disabled={categoriesError}><option value="">{categoriesError ? t('Categories unavailable', 'الفئات غير متاحة') : t('All categories', 'جميع الفئات')}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name_en} · {category.name_ar}</option>)}</select></label>
        <label className="relative"><span className="sr-only">{t('Supplier', 'المورد')}</span><Building2 className="absolute start-4 top-1/2 -translate-y-1/2 text-light-brown" size={17}/><select className="input-field appearance-none ps-11" value={supplierId} onChange={(event) => changeSupplier(event.target.value)} disabled={suppliersError}><option value="">{suppliersError ? t('Suppliers unavailable', 'الموردون غير متاحين') : t('All suppliers', 'جميع الموردين')}</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{lang === 'ar' ? supplier.company_name_ar || supplier.company_name_en : supplier.company_name_en || supplier.company_name_ar}</option>)}</select></label>
      </div>
      <div className="mb-7 flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold"><SlidersHorizontal size={15}/>{t('Smart filters', 'فلاتر ذكية')}</span><label className="relative"><MapPin size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gold"/><select value={city} onChange={(event) => setCity(event.target.value)} className="rounded-xl border border-gold/20 bg-black/65 py-2 pe-4 ps-9 text-xs text-sand"><option value="">{t('All cities', 'كل المدن')}</option>{cities.map((item) => <option key={item}>{item}</option>)}</select></label><label className="relative"><Filter size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gold"/><select value={material} onChange={(event) => setMaterial(event.target.value)} className="rounded-xl border border-gold/20 bg-black/65 py-2 pe-4 ps-9 text-xs text-sand"><option value="">{t('All materials', 'كل المواد')}</option>{materialValues.map((item) => <option key={item}>{item}</option>)}</select></label><label className="relative"><Palette size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gold"/><select value={color} onChange={(event) => setColor(event.target.value)} className="rounded-xl border border-gold/20 bg-black/65 py-2 pe-4 ps-9 text-xs text-sand"><option value="">{t('All colors & finishes', 'كل الألوان والتشطيبات')}</option>{colorValues.map((item) => <option key={item}>{item}</option>)}</select></label><label className="relative"><Ruler size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gold"/><select value={dimension} onChange={(event) => setDimension(event.target.value)} className="rounded-xl border border-gold/20 bg-black/65 py-2 pe-4 ps-9 text-xs text-sand"><option value="">{t('All dimensions', 'كل المقاسات')}</option>{dimensions.map((item) => <option key={item}>{item}</option>)}</select></label><span className="ms-auto inline-flex items-center gap-1.5 text-xs text-sand/55"><BadgeCheck size={14} className="text-gold"/>{visibleProducts.length} {t('products shown', 'منتج ظاهر')}</span></div>
      {categoriesError && <div role="status" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{t('Category filters could not be loaded. Product search is still available.', 'تعذّر تحميل فلاتر الفئات. لا يزال البحث في المنتجات متاحاً.')}</div>}
      {suppliersError && <div role="status" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{t('Supplier filters could not be loaded. Product search is still available.', 'تعذّر تحميل فلتر الموردين. لا يزال البحث في المنتجات متاحاً.')}</div>}

      {loading ? <LoadingState/> : products.length === 0 && error ? <ErrorState/> : visibleProducts.length === 0 ? <EmptyState title={t('No blocks found', 'لا توجد بلوكات')} description={t('Try a different search or category. New published blocks will appear here.', 'جرّب بحثاً أو فئة مختلفة. ستظهر البلوكات المنشورة الجديدة هنا.')}/> : <>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleProducts.map((product) => <ProductCard key={product.id || product.slug} product={product}/>)}</div>
        {error && <div className="mt-6"><ErrorState/></div>}
        <div className="mt-10 flex flex-col items-center gap-3">
          {hasMore ? <button type="button" onClick={loadMore} disabled={loadingMore} className="btn-primary min-w-44 justify-center disabled:cursor-not-allowed disabled:opacity-60">{loadingMore && <Loader2 className="animate-spin" size={17}/>} {loadingMore ? t('Loading more…', 'جارٍ تحميل المزيد…') : t('Load more blocks', 'تحميل المزيد من البلوكات')}</button> : <p className="text-sm text-light-brown">{t('You have reached the end of the published blocks.', 'وصلت إلى نهاية البلوكات المنشورة.')}</p>}
        </div>
      </>}
    </main>
  </div>;
}
