import { useEffect, useRef, useState } from 'react';
import { Filter, Loader2, Search } from 'lucide-react';
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
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') || '';
  const [query, setQuery] = useState(urlQuery);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
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
    mvpService.getCategories()
      .then((rows) => {
        if (!active) return;
        setCategories(rows);
        setCategoriesError(false);
      })
      .catch(() => {
        if (active) setCategoriesError(true);
      });
    mvpService.recordEvent('page_view', { page: 'blocks' });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (categoryId) mvpService.recordEvent('filter', { category_id: categoryId, page: 'blocks' });
  }, [categoryId]);

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
  }, [categoryId, urlQuery]);

  const changeCategory = (nextCategory) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (nextCategory) next.set('category', nextCategory);
      else next.delete('category');
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

  return <div className="min-h-screen bg-ivory pt-[76px]">
    <header className="bg-dark-brown px-6 py-16 text-warm-white"><div className="mx-auto max-w-7xl"><p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-gold">{t('BUOD data library', 'مكتبة بيانات بُعد')}</p><h1 className="text-4xl font-black sm:text-5xl">{t('Construction blocks', 'بلوكات البناء')}</h1><p className="mt-4 max-w-2xl text-sand/75">{t('Search professional construction products and their available BIM and 3D data.', 'ابحث في منتجات البناء الاحترافية وبيانات BIM والمجسمات المتاحة.')}</p></div></header>
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 grid gap-3 rounded-2xl border border-sand bg-white p-4 shadow-card sm:grid-cols-[1fr_280px]">
        <label className="relative"><span className="sr-only">{t('Search blocks', 'البحث عن البلوكات')}</span><Search className="absolute start-4 top-1/2 -translate-y-1/2 text-light-brown" size={18}/><input className="input-field ps-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Name, reference or keyword…', 'الاسم أو المرجع أو كلمة مفتاحية…')}/></label>
        <label className="relative"><span className="sr-only">{t('Category', 'الفئة')}</span><Filter className="absolute start-4 top-1/2 -translate-y-1/2 text-light-brown" size={17}/><select className="input-field appearance-none ps-11" value={categoryId} onChange={(event) => changeCategory(event.target.value)} disabled={categoriesError}><option value="">{categoriesError ? t('Categories unavailable', 'الفئات غير متاحة') : t('All categories', 'جميع الفئات')}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name_en} · {category.name_ar}</option>)}</select></label>
      </div>
      {categoriesError && <div role="status" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{t('Category filters could not be loaded. Product search is still available.', 'تعذّر تحميل فلاتر الفئات. لا يزال البحث في المنتجات متاحاً.')}</div>}

      {loading ? <LoadingState/> : products.length === 0 && error ? <ErrorState/> : products.length === 0 ? <EmptyState title={t('No blocks found', 'لا توجد بلوكات')} description={t('Try a different search or category. New published blocks will appear here.', 'جرّب بحثاً أو فئة مختلفة. ستظهر البلوكات المنشورة الجديدة هنا.')}/> : <>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id || product.slug} product={product}/>)}</div>
        {error && <div className="mt-6"><ErrorState/></div>}
        <div className="mt-10 flex flex-col items-center gap-3">
          {hasMore ? <button type="button" onClick={loadMore} disabled={loadingMore} className="btn-primary min-w-44 justify-center disabled:cursor-not-allowed disabled:opacity-60">{loadingMore && <Loader2 className="animate-spin" size={17}/>} {loadingMore ? t('Loading more…', 'جارٍ تحميل المزيد…') : t('Load more blocks', 'تحميل المزيد من البلوكات')}</button> : <p className="text-sm text-light-brown">{t('You have reached the end of the published blocks.', 'وصلت إلى نهاية البلوكات المنشورة.')}</p>}
        </div>
      </>}
    </main>
  </div>;
}
