import { useEffect, useState } from 'react';
import { Filter, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/mvp/ProductCard';
import { EmptyState, ErrorState, LoadingState } from '../components/mvp/States';
import { useLanguage } from '../context/LanguageContext';
import { mvpService } from '../services/mvpService';

export default function Blocks() {
  const { lang, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { mvpService.getCategories().then(setCategories).catch(() => setCategories([])); }, []);
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true); setError('');
      try {
        setProducts(await mvpService.searchProducts({ query, categoryId: categoryId || null }));
        if (query) mvpService.recordEvent('search', { query });
        if (categoryId) mvpService.recordEvent('filter', { category_id: categoryId });
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, categoryId]);

  return <div className="min-h-screen bg-ivory pt-[70px]">
    <header className="bg-dark-brown px-6 py-16 text-warm-white"><div className="mx-auto max-w-7xl"><p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-gold">{t('BUOD data library', 'مكتبة بيانات بُعد')}</p><h1 className="text-4xl font-black sm:text-5xl">{t('Construction blocks', 'بلوكات البناء')}</h1><p className="mt-4 max-w-2xl text-sand/75">{t('Search professional construction products and their available BIM and 3D data.', 'ابحث في منتجات البناء الاحترافية وبيانات BIM والمجسمات المتاحة.')}</p></div></header>
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 grid gap-3 rounded-2xl border border-sand bg-white p-4 shadow-card sm:grid-cols-[1fr_280px]">
        <label className="relative"><span className="sr-only">{t('Search blocks', 'البحث عن البلوكات')}</span><Search className={`absolute top-1/2 -translate-y-1/2 text-light-brown ${lang === 'ar' ? 'right-4' : 'left-4'}`} size={18}/><input className={`input-field ${lang === 'ar' ? 'pr-11' : 'pl-11'}`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Name, reference or keyword…', 'الاسم أو المرجع أو كلمة مفتاحية…')}/></label>
        <label className="relative"><span className="sr-only">{t('Category', 'الفئة')}</span><Filter className={`absolute top-1/2 -translate-y-1/2 text-light-brown ${lang === 'ar' ? 'right-4' : 'left-4'}`} size={17}/><select className={`input-field appearance-none ${lang === 'ar' ? 'pr-11' : 'pl-11'}`} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">{t('All categories', 'جميع الفئات')}</option>{categories.map((category) => <option key={category.id} value={category.id}>{lang === 'ar' ? category.name_ar : category.name_en}</option>)}</select></label>
      </div>
      {loading ? <LoadingState/> : error ? <ErrorState message={error}/> : products.length === 0 ? <EmptyState title={t('No blocks found', 'لا توجد بلوكات')} description={t('Try a different search or category. New published blocks will appear here.', 'جرّب بحثاً أو فئة مختلفة. ستظهر البلوكات المنشورة الجديدة هنا.')}/> : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id || product.slug} product={product}/>)}</div>}
    </main>
  </div>;
}
