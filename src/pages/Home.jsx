import { useEffect, useState } from 'react';
import { ArrowRight, Box, Building2, Database, FileBox, Layers3, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/mvp/ProductCard';
import { EmptyState, ErrorState, LoadingState } from '../components/mvp/States';
import { useLanguage } from '../context/LanguageContext';
import { mvpService } from '../services/mvpService';

export default function Home() {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [productState, setProductState] = useState({ loading: true, error: '' });
  const [categoryState, setCategoryState] = useState({ loading: true, error: '' });
  const [supplierState, setSupplierState] = useState({ loading: true, error: '' });

  useEffect(() => {
    let active = true;
    mvpService.recordEvent('page_view', { page: 'home' });

    mvpService.getLatestProducts(8)
      .then((rows) => { if (active) setProducts(rows); })
      .catch((error) => { if (active) setProductState({ loading: false, error: error.message }); })
      .finally(() => { if (active) setProductState((state) => ({ ...state, loading: false })); });

    mvpService.getCategories()
      .then((rows) => { if (active) setCategories(rows); })
      .catch((error) => { if (active) setCategoryState({ loading: false, error: error.message }); })
      .finally(() => { if (active) setCategoryState((state) => ({ ...state, loading: false })); });

    mvpService.getSuppliers({ limit: 4 })
      .then((rows) => { if (active) setSuppliers(rows); })
      .catch((error) => { if (active) setSupplierState({ loading: false, error: error.message }); })
      .finally(() => { if (active) setSupplierState((state) => ({ ...state, loading: false })); });

    return () => { active = false; };
  }, []);

  const submit = (event) => {
    event.preventDefault();
    navigate(`/blocks${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  };

  return (
    <div className="bg-ivory">
      <section className="relative overflow-hidden bg-deep-brown px-6 pb-20 pt-32 text-warm-white sm:pb-24 sm:pt-40">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(201,168,76,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,.18) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_45%,rgba(201,168,76,0.16),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[.28em] text-gold">
              <span className="h-px w-8 bg-gold" />
              {t('Construction product data library', 'مكتبة بيانات منتجات البناء')}
            </p>
            <h1 className="max-w-4xl text-4xl font-black leading-[1.12] sm:text-5xl lg:text-[64px]">
              {t(
                'Construction products. BIM & 3D blocks. One professional library.',
                'منتجات البناء. بلوكات BIM و3D. مكتبة احترافية واحدة.'
              )}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-sand/75 sm:text-lg">
              {t(
                'Search structured product information, technical specifications, supplier data and available design files from one focused source.',
                'ابحث في بيانات المنتجات المنظمة والمواصفات الفنية وبيانات الموردين وملفات التصميم المتاحة من مصدر واحد متخصص.'
              )}
            </p>
            <form onSubmit={submit} className="mt-9 flex max-w-2xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/[.07] p-3 backdrop-blur sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">{t('Search the library', 'البحث في المكتبة')}</span>
                <Search className={`absolute top-1/2 -translate-y-1/2 text-light-brown ${lang === 'ar' ? 'right-4' : 'left-4'}`} size={19} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className={`h-14 w-full rounded-xl bg-warm-white text-dark-brown outline-none ring-gold focus:ring-2 ${lang === 'ar' ? 'pl-4 pr-12' : 'pl-12 pr-4'}`} placeholder={t('Product, BUOD reference or category…', 'منتج أو مرجع BUOD أو فئة…')} />
              </label>
              <button className="btn-gold h-14 justify-center px-7">
                {t('Search library', 'ابحث في المكتبة')}
                <ArrowRight className={lang === 'ar' ? 'rotate-180' : ''} size={17} />
              </button>
            </form>
          </div>

          <div className="relative hidden min-h-[440px] lg:block" aria-hidden="true">
            <div className="absolute inset-8 rotate-3 rounded-[32px] border border-gold/20" />
            <div className="absolute inset-x-0 top-5 overflow-hidden rounded-3xl border border-white/10 bg-[#F8F5EF] p-5 text-dark-brown shadow-2xl">
              <div className="flex items-center justify-between border-b border-sand pb-4">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-dark-brown text-gold"><Box size={19} /></span><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-light-brown">BUOD / PRODUCT DATA</p><p className="mt-1 text-sm font-bold">{t('Technical product record', 'سجل منتج فني')}</p></div></div>
                <span className="rounded-md border border-gold/30 bg-gold/10 px-2 py-1 font-mono text-[10px] text-gold">BUOD-REF</span>
              </div>
              <div className="grid grid-cols-[1.05fr_.95fr] gap-4 py-5">
                <div className="relative grid min-h-48 place-items-center overflow-hidden rounded-2xl bg-sand/45">
                  <svg viewBox="0 0 190 150" className="h-40 w-full">
                    <path d="m95 20 58 32v64l-58 32-58-32V52l58-32Z" fill="#D6C5AE" fillOpacity=".55" stroke="#6A5744" />
                    <path d="m37 52 58 32 58-32M95 84v64" fill="none" stroke="#6A5744" />
                    <path d="M52 61v47l43 24M138 61v47l-43 24" fill="none" stroke="#C9A84C" strokeDasharray="3 3" />
                  </svg>
                  <span className="absolute bottom-3 start-3 rounded-md bg-white/90 px-2 py-1 font-mono text-[9px] text-medium-brown">3D PREVIEW</span>
                </div>
                <div className="space-y-3">
                  {[['01', t('Product identity', 'هوية المنتج')], ['02', t('Specifications', 'المواصفات')], ['03', t('Supplier data', 'بيانات المورد')], ['04', 'BIM / 3D']].map(([number, label]) => <div key={number} className="flex items-center gap-3 rounded-xl border border-sand bg-white p-3"><span className="font-mono text-[10px] text-gold">{number}</span><span className="text-xs font-semibold">{label}</span></div>)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 border-t border-sand pt-4 text-[10px] font-semibold uppercase tracking-wider text-medium-brown">
                <span className="flex items-center gap-2"><Database size={13} className="text-gold" />{t('Structured', 'منظمة')}</span>
                <span className="flex items-center gap-2"><Layers3 size={13} className="text-gold" />BIM / 3D</span>
                <span className="flex items-center gap-2"><FileBox size={13} className="text-gold" />{t('Files', 'ملفات')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <SectionHeading eyebrow={t('Browse the library', 'تصفح المكتبة')} title={t('Product categories', 'فئات المنتجات')} link="/blocks" t={t} lang={lang} />
        {categoryState.loading ? <LoadingState /> : categoryState.error ? <ErrorState message={categoryState.error} /> : categories.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 8).map((category, index) => <Link key={category.id} to={`/blocks?category=${category.id}`} className="group flex min-h-28 items-end justify-between rounded-2xl border border-sand bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-gold/60"><div><span className="font-mono text-[10px] text-gold">{String(index + 1).padStart(2, '0')}</span><h3 className="mt-3 font-bold text-dark-brown">{lang === 'ar' ? category.name_ar : category.name_en}</h3></div><span className="text-2xl text-gold">{category.icon || '◇'}</span></Link>)}
          </div>
        ) : <EmptyState title={t('No categories are available yet', 'لا توجد فئات متاحة حالياً')} description={t('Published database categories will appear here.', 'ستظهر فئات قاعدة البيانات المنشورة هنا.')} />}
      </section>

      <section className="border-y border-sand/70 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading eyebrow={t('Product library', 'مكتبة المنتجات')} title={t('Featured / Latest Blocks', 'البلوكات المميزة / الأحدث')} link="/blocks" t={t} lang={lang} />
          {productState.loading ? <LoadingState /> : productState.error ? <ErrorState message={productState.error} /> : products.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id || product.slug} product={product} />)}</div> : <EmptyState title={t('No published blocks yet', 'لا توجد بلوكات منشورة حالياً')} description={t('Published database records will appear here when available.', 'ستظهر سجلات قاعدة البيانات المنشورة هنا عند توفرها.')} />}
        </div>
      </section>

      <section className="bg-[#EEE6DA] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading eyebrow={t('From the source', 'من المصدر')} title={t('Supplier Windows', 'نوافذ الموردين')} link="/suppliers" t={t} lang={lang} />
          {supplierState.loading ? <LoadingState /> : supplierState.error ? <ErrorState message={supplierState.error} /> : suppliers.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {suppliers.map((supplier) => {
                const name = lang === 'ar' ? supplier.company_name_ar || supplier.name_ar : supplier.company_name_en || supplier.name_en;
                return <Link key={supplier.id || supplier.slug} to={`/suppliers/${supplier.slug}`} className="group rounded-2xl border border-beige/80 bg-ivory p-5 transition hover:border-gold hover:bg-white"><div className="mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-sand bg-white">{supplier.signed_logo_url ? <img src={supplier.signed_logo_url} alt={`${name || t('Supplier', 'المورد')} logo`} className="h-full w-full object-contain" /> : <Building2 className="text-beige" />}</div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-gold">{t('Supplier window', 'نافذة مورد')}</p><h3 className="mt-2 font-bold text-dark-brown group-hover:text-gold">{name || t('Supplier name unavailable', 'اسم المورد غير متاح')}</h3></Link>;
              })}
            </div>
          ) : <EmptyState title={t('No supplier windows are available yet', 'لا توجد نوافذ موردين متاحة حالياً')} description={t('Published supplier database records will appear here.', 'ستظهر سجلات الموردين المنشورة في قاعدة البيانات هنا.')} />}
        </div>
      </section>

      <section className="bg-ivory px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-3xl border border-sand bg-white p-8 shadow-card sm:p-12 lg:grid-cols-[1fr_auto]">
          <div><p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-gold">{t('Your professional library', 'مكتبتك الاحترافية')}</p><h2 className="text-3xl font-black text-dark-brown">{t('Access available BIM, 3D and datasheet files.', 'ادخل إلى ملفات BIM و3D وملفات البيانات المتاحة.')}</h2><p className="mt-4 max-w-2xl leading-7 text-light-brown">{t('Create an account to securely download the product assets available in the BUOD library.', 'أنشئ حساباً لتحميل ملفات المنتجات المتاحة في مكتبة BUOD بأمان.')}</p></div>
          <Link to="/login?mode=signup" className="btn-gold justify-center px-8 py-4">{t('Create account', 'إنشاء حساب')}<ArrowRight className={lang === 'ar' ? 'rotate-180' : ''} size={17} /></Link>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ eyebrow, title, link, t, lang }) {
  return <div className="mb-9 flex items-end justify-between gap-5"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.22em] text-gold">{eyebrow}</p><h2 className="text-3xl font-black text-dark-brown">{title}</h2></div><Link to={link} className="hidden items-center gap-2 text-sm font-bold text-medium-brown transition hover:text-gold sm:flex">{t('View all', 'عرض الكل')}<ArrowRight className={lang === 'ar' ? 'rotate-180' : ''} size={15} /></Link></div>;
}
