import { useEffect, useState } from 'react';
import {
  ArrowRight, BadgeCheck, Box, Boxes, Building2, Database, GitBranch,
  FileBox, FileText, Layers3, PackageCheck, Search, ShieldCheck, Sparkles,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BrandMark from '../components/layout/BrandMark';
import ProductCard from '../components/mvp/ProductCard';
import { EmptyState, ErrorState, LoadingState } from '../components/mvp/States';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { mvpService } from '../services/mvpService';

const pick = (row, ...keys) => keys.map((key) => row?.[key]).find(Boolean);
const NETWORK_GLYPHS = [
  Box, FileBox, Database, Layers3, Building2, FileText,
  GitBranch, PackageCheck, Boxes, ShieldCheck, FileBox, Database,
  Box, Layers3, Building2, PackageCheck, FileText, GitBranch,
];

export default function Home() {
  const { lang, t } = useLanguage();
  const { user, isAdmin } = useAuth();
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
      .catch(() => { if (active) setProductState({ loading: false, error: true }); })
      .finally(() => { if (active) setProductState((state) => ({ ...state, loading: false })); });

    mvpService.getCategories()
      .then((rows) => { if (active) setCategories(rows); })
      .catch(() => { if (active) setCategoryState({ loading: false, error: true }); })
      .finally(() => { if (active) setCategoryState((state) => ({ ...state, loading: false })); });

    mvpService.getSuppliers({ limit: 4 })
      .then((rows) => { if (active) setSuppliers(rows); })
      .catch(() => { if (active) setSupplierState({ loading: false, error: true }); })
      .finally(() => { if (active) setSupplierState((state) => ({ ...state, loading: false })); });

    return () => { active = false; };
  }, []);

  const submit = (event) => {
    event.preventDefault();
    navigate(`/blocks${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  };

  return (
    <div className="bg-ivory">
      <section className="digital-hero relative overflow-hidden px-5 pb-10 pt-28 text-warm-white sm:px-6 sm:pb-14 sm:pt-36">
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[.06] px-4 py-2 text-[10px] font-bold uppercase tracking-[.25em] text-light-gold sm:text-xs">
              <Sparkles size={14} />
              {t('The digital identity of construction products', 'الهوية الرقمية لمنتجات البناء')}
            </p>
            <h1 className="text-4xl font-black leading-[1.18] sm:text-6xl lg:text-[72px]">
              <span className="bg-gradient-to-b from-[#F5D98C] via-[#D2A24A] to-[#8E5F22] bg-clip-text text-transparent">
                {t('Every product…', 'كل منتج...')}
              </span>
              <span className="mt-1 block text-[#F8F3E9]">{t('has a digital identity.', 'له هوية رقمية.')}</span>
            </h1>
            <p className="mt-5 text-sm font-semibold tracking-wide text-[#D1A94E] sm:text-base">
              {t('Precise data · Smart classification · Direct supplier connection', 'بيانات دقيقة · تصنيف ذكي · ربط مباشر بالموردين')}
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-sand/55 sm:text-base">
              {t(
                'A professional Saudi construction library connecting verified product information, supplier data and design resources in one living network.',
                'مكتبة بناء سعودية احترافية تربط معلومات المنتج الموثقة وبيانات المورد وموارد التصميم في شبكة رقمية واحدة.'
              )}
            </p>
            <form onSubmit={submit} className="digital-panel mx-auto mt-7 flex max-w-2xl flex-col gap-2 rounded-2xl p-2 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">{t('Search the library', 'البحث في المكتبة')}</span>
                <Search className={`absolute top-1/2 -translate-y-1/2 text-gold/65 ${lang === 'ar' ? 'right-4' : 'left-4'}`} size={18} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className={`h-14 w-full rounded-xl border border-gold/10 bg-black/65 text-warm-white outline-none transition placeholder:text-sand/30 focus:border-gold/50 ${lang === 'ar' ? 'pl-4 pr-12' : 'pl-12 pr-4'}`} placeholder={t('Product, BUOD reference or category…', 'منتج أو مرجع BUOD أو فئة…')} />
              </label>
              <button className="btn-gold h-14 justify-center px-7">
                {t('Search library', 'ابحث في المكتبة')}
                <ArrowRight className={lang === 'ar' ? 'rotate-180' : ''} size={17} />
              </button>
            </form>
          </div>

          <ProductConstellation products={products.slice(0, 6)} lang={lang} t={t} />

          <div className="digital-panel relative z-10 grid overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-5">
            <DigitalMetric icon={<Box />} title={t('Unified identity', 'هوية رقمية موحدة')} text={t('One record per market product', 'لكل منتج في السوق')} />
            <DigitalMetric icon={<Boxes />} title={t('Smart classification', 'تصنيف ذكي')} text={t('Built around professional standards', 'وفق المعايير المهنية')} />
            <DigitalMetric icon={<GitBranch />} title={t('Direct connection', 'ربط مباشر')} text={t('With verified suppliers', 'بالموردين المعتمدين')} />
            <DigitalMetric icon={<Database />} title={t('Precise data', 'بيانات دقيقة')} text={t('Structured and continuously updated', 'تحديث مستمر وآلي')} />
            <DigitalMetric icon={<ShieldCheck />} title={t('Project ready', 'جاهز للمشاريع')} text={t('From design to delivery', 'من التصميم إلى التنفيذ')} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <SectionHeading eyebrow={t('Navigate the data network', 'تصفح شبكة البيانات')} title={t('Product categories', 'فئات المنتجات')} link="/blocks" t={t} lang={lang} />
        {categoryState.loading ? <LoadingState /> : categoryState.error ? <ErrorState /> : categories.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 8).map((category, index) => <Link key={category.id} to={`/blocks?category=${category.id}`} className="digital-panel group flex min-h-32 items-end justify-between rounded-2xl p-5 transition hover:-translate-y-1 hover:border-gold/55"><div><span className="font-mono text-[10px] text-gold/70">NODE / {String(index + 1).padStart(2, '0')}</span><h3 className="mt-3 font-bold text-warm-white">{lang === 'ar' ? category.name_ar : category.name_en}</h3></div><span className="text-2xl text-gold transition group-hover:scale-110">{category.icon || '◇'}</span></Link>)}
          </div>
        ) : <EmptyState title={t('No categories are available yet', 'لا توجد فئات متاحة حالياً')} description={t('Published database categories will appear here.', 'ستظهر فئات قاعدة البيانات المنشورة هنا.')} />}
      </section>

      <section className="border-y border-gold/10 bg-black/35 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading eyebrow={t('Connected product records', 'سجلات المنتجات المترابطة')} title={t('Featured / latest products', 'المنتجات المميزة / الأحدث')} link="/blocks" t={t} lang={lang} />
          {productState.loading ? <LoadingState /> : productState.error ? <ErrorState /> : products.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id || product.slug} product={product} />)}</div> : <EmptyState title={t('No published products yet', 'لا توجد منتجات منشورة حالياً')} description={t('Published database records will appear here when available.', 'ستظهر سجلات قاعدة البيانات المنشورة هنا عند توفرها.')} />}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading eyebrow={t('Connected to the source', 'مرتبط بالمصدر')} title={t('Supplier network', 'شبكة الموردين')} link="/suppliers" t={t} lang={lang} />
          {supplierState.loading ? <LoadingState /> : supplierState.error ? <ErrorState /> : suppliers.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {suppliers.map((supplier) => {
                const name = lang === 'ar' ? pick(supplier, 'company_name_ar', 'name_ar', 'company_name_en') : pick(supplier, 'company_name_en', 'name_en', 'company_name_ar');
                return <Link key={supplier.id || supplier.slug} to={`/suppliers/${supplier.slug}`} className="digital-panel group rounded-2xl p-5 transition hover:-translate-y-1 hover:border-gold/55"><div className="mb-5 flex h-20 items-center justify-center overflow-hidden rounded-xl border border-gold/15 bg-[#11100d] p-2">{supplier.signed_logo_url ? <img src={supplier.signed_logo_url} alt={`${name || t('Supplier', 'المورد')} logo`} className="h-full w-full object-contain" /> : <Building2 className="text-gold/40" />}</div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-gold"><BadgeCheck size={13} />{t('Verified supplier node', 'مورد مرتبط بالمنصة')}</p><h3 className="mt-2 font-bold text-warm-white transition group-hover:text-light-gold">{name || t('Supplier name unavailable', 'اسم المورد غير متاح')}</h3></Link>;
              })}
            </div>
          ) : <EmptyState title={t('No supplier windows are available yet', 'لا توجد نوافذ موردين متاحة حالياً')} description={t('Published supplier database records will appear here.', 'ستظهر سجلات الموردين المنشورة في قاعدة البيانات هنا.')} />}
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="digital-panel mx-auto grid max-w-7xl items-center gap-8 rounded-3xl p-8 sm:p-12 lg:grid-cols-[1fr_auto]">
          <div><p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-gold">{t('Enter the network', 'ادخل إلى الشبكة')}</p><h2 className="text-3xl font-black text-warm-white">{t('Access available BIM, 3D and datasheet files.', 'ادخل إلى ملفات BIM و3D وملفات البيانات المتاحة.')}</h2><p className="mt-4 max-w-2xl leading-7 text-sand/55">{user ? t('Continue to the library and access the product resources available to your account.', 'تابع إلى المكتبة للوصول إلى موارد المنتجات المتاحة لحسابك.') : t('Create an account to securely download the product assets available in the BUOD library.', 'أنشئ حساباً لتحميل ملفات المنتجات المتاحة في مكتبة بُعد بأمان.')}</p></div>
          <Link to={user ? (isAdmin() ? '/admin/dashboard' : '/blocks') : '/login?mode=signup'} className="btn-gold justify-center px-8 py-4">{user ? (isAdmin() ? t('Go to dashboard', 'الذهاب للوحة التحكم') : t('Browse library', 'تصفح المكتبة')) : t('Create account', 'إنشاء حساب')}<ArrowRight className={lang === 'ar' ? 'rotate-180' : ''} size={17} /></Link>
        </div>
      </section>
    </div>
  );
}

function ProductConstellation({ products, lang, t }) {
  return (
    <div className="constellation-stage mx-auto mt-2 max-w-6xl" aria-label={t('Connected product data network', 'شبكة بيانات المنتجات المترابطة')}>
      <div className="constellation-flow" aria-hidden="true" />
      <div className="network-glyphs" aria-hidden="true">
        {NETWORK_GLYPHS.map((Icon, index) => <span key={index} className={`network-glyph network-glyph-${index + 1}`}><Icon /></span>)}
      </div>
      {products.map((product) => {
        const name = lang === 'ar' ? pick(product, 'product_name_ar', 'product_name_en') : pick(product, 'product_name_en', 'product_name_ar');
        const category = lang === 'ar' ? pick(product, 'category_name_ar', 'category_name_en') : pick(product, 'category_name_en', 'category_name_ar');
        return (
          <Link key={product.id || product.slug} to={`/blocks/${product.slug}`} className="constellation-item">
            {product.signed_image_url ? <img src={product.signed_image_url} alt="" /> : <span className="grid h-[58px] w-[58px] flex-none place-items-center rounded-lg bg-gold/10 text-gold"><Box /></span>}
            <span className="min-w-0"><strong className="block truncate text-xs">{name}</strong><span className="mt-1 block truncate text-[9px] text-gold/75">{category || t('Product data', 'بيانات منتج')}</span><span className="mt-1 block truncate font-mono text-[8px] text-sand/35">{product.buod_reference}</span></span>
          </Link>
        );
      })}
      <div className="constellation-core"><BrandMark className="h-full w-full" title={t('BUOD digital network', 'شبكة بُعد الرقمية')} /></div>
    </div>
  );
}

function DigitalMetric({ icon, title, text }) {
  return <div className="digital-metric flex items-center gap-3 px-5 py-5"><span className="text-gold [&>svg]:h-6 [&>svg]:w-6">{icon}</span><span><strong className="block text-sm text-warm-white">{title}</strong><span className="mt-1 block text-[10px] text-sand/40">{text}</span></span></div>;
}

function SectionHeading({ eyebrow, title, link, t, lang }) {
  return <div className="mb-9 flex items-end justify-between gap-5"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.22em] text-gold">{eyebrow}</p><h2 className="text-3xl font-black text-warm-white">{title}</h2></div><Link to={link} className="hidden items-center gap-2 text-sm font-bold text-sand/55 transition hover:text-gold sm:flex">{t('View all', 'عرض الكل')}<ArrowRight className={lang === 'ar' ? 'rotate-180' : ''} size={15} /></Link></div>;
}
