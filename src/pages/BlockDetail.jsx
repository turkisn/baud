import { useEffect, useState } from 'react';
import {
  ArrowLeft, BadgeCheck, Box, CheckCircle2, Download, ExternalLink, FileText,
  ImageOff, Layers3, LockKeyhole, PackageCheck, Share2, ShieldCheck, XCircle,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductCard from '../components/mvp/ProductCard';
import { ErrorState, LoadingState } from '../components/mvp/States';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { mvpService } from '../services/mvpService';

const pick = (row, ...keys) => keys.map((key) => row?.[key]).find((value) => value !== null && value !== undefined && value !== '');
const formatBytes = (bytes) => !bytes ? null : `${(bytes / 1024 / 1024).toFixed(bytes > 10485760 ? 0 : 1)} MB`;
const safeExternalUrl = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch { return null; }
};

function DataValue({ label, value, href, to }) {
  let content = value;
  if (value && href) content = <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline">{value}<ExternalLink size={12}/></a>;
  if (value && to) content = <Link to={to} className="inline-flex items-center gap-1 text-gold hover:underline">{value}</Link>;
  return <div className="border-b border-sand/70 py-3"><dt className="text-xs font-semibold uppercase tracking-wider text-light-brown">{label}</dt><dd className="mt-1 text-sm font-medium text-dark-brown">{value ? content : <span className="font-normal text-light-brown/70">—</span>}</dd></div>;
}

function SectionError({ children }) {
  return <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{children}</div>;
}

function Permit({ label, allowed, t }) {
  const known = typeof allowed === 'boolean';
  return <div className="flex items-center justify-between gap-4 rounded-xl bg-ivory px-4 py-3 text-sm"><span className="text-medium-brown">{label}</span><span className={`inline-flex items-center gap-1 font-semibold ${allowed ? 'text-green-700' : known ? 'text-red-700' : 'text-light-brown'}`}>{allowed ? <CheckCircle2 size={15}/> : known ? <XCircle size={15}/> : null}{allowed ? t('Allowed', 'مسموح') : known ? t('Not allowed', 'غير مسموح') : '—'}</span></div>;
}

export default function BlockDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [shareNotice, setShareNotice] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setProduct(null);
    setRelated([]);
    setActiveImage(0);
    mvpService.recordEvent('page_view', { page: 'block_detail' });
    mvpService.getProduct(slug).then((data) => {
      if (!active) return;
      setProduct(data);
      if (data) mvpService.recordEvent('product_view', { product_id: data.id || data.product_id });
    }).catch(() => {
      if (active) setError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    let active = true;
    if (!product?.category_id || !product?.id) return () => { active = false; };
    mvpService.searchProducts({ categoryId: product.category_id, limit: 5 })
      .then((rows) => {
        if (active) setRelated(rows.filter((row) => row.id !== product.id).slice(0, 4));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [product?.category_id, product?.id]);

  async function download(file, eventName) {
    if (!user) { navigate('/login', { state: { from: { pathname: `/blocks/${slug}` } } }); return; }
    setDownloadError('');
    try {
      const url = await mvpService.createDownloadUrl(file);
      if (!url) {
        setDownloadError(t('This file is unavailable or your session has expired.', 'هذا الملف غير متاح أو انتهت جلستك.'));
        return;
      }
      void mvpService.recordEvent(eventName, { product_id: product.id || product.product_id, file_id: file.id });
      window.location.assign(url);
    } catch {
      setDownloadError(t('The download could not be prepared. Please try again.', 'تعذّر تجهيز التحميل. يرجى المحاولة مجدداً.'));
    }
  }

  async function sharePage() {
    const shareData = { title: product?.product_name_en || product?.product_name_ar || 'BUOD', url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        setShareNotice(t('Link copied', 'تم نسخ الرابط'));
        window.setTimeout(() => setShareNotice(''), 1800);
      }
    } catch {
      // Closing the native share sheet is not an application error.
    }
  }

  if (loading) return <div className="min-h-screen bg-ivory pt-[76px]"><div className="py-8"><LoadingState/></div></div>;
  if (error) return <div className="min-h-screen bg-ivory px-6 pt-[108px]"><ErrorState/></div>;
  if (!product) return <div className="min-h-screen bg-ivory px-6 pt-[108px]"><ErrorState message={t('Block not found.', 'البلوك غير موجود.')}/></div>;

  const name = lang === 'ar' ? pick(product, 'product_name_ar', 'product_name_en') : pick(product, 'product_name_en', 'product_name_ar');
  const otherName = lang === 'ar' ? product.product_name_en : product.product_name_ar;
  const description = lang === 'ar' ? pick(product, 'full_description_ar', 'short_description_ar', 'full_description_en', 'short_description_en') : pick(product, 'full_description_en', 'short_description_en', 'full_description_ar', 'short_description_ar');
  const category = lang === 'ar' ? pick(product, 'category_name_ar', 'category_name_en') : pick(product, 'category_name_en', 'category_name_ar');
  const subcategory = lang === 'ar' ? pick(product, 'subcategory_name_ar', 'subcategory_name_en') : pick(product, 'subcategory_name_en', 'subcategory_name_ar');
  const supplierName = lang === 'ar' ? pick(product, 'supplier_name_ar', 'company_name_ar', 'supplier_name_en') : pick(product, 'supplier_name_en', 'company_name_en', 'supplier_name_ar');
  const images = product.product_images || [];
  const files = (product.product_files || []).filter((file) => file.is_available !== false);
  const blocks = files.filter((file) => file.file_type === 'block');
  const datasheets = files.filter((file) => file.file_type === 'datasheet');
  const materials = product.product_materials || [];
  const formats = [...new Set(blocks.map((file) => file.file_format).filter(Boolean))];
  const software = [...new Set(blocks.map((file) => file.software_name).filter(Boolean))];
  const displayImage = images[activeImage]?.signed_url || product.signed_image_url;
  const productUrl = safeExternalUrl(product.supplier_product_url);
  const detailErrors = product.detail_errors || {};
  const price = product.price !== null && product.price !== undefined ? new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-SA', { style: 'currency', currency: product.currency || 'SAR', maximumFractionDigits: 0 }).format(Number(product.price)) : null;
  const verificationLabel = {
    verified: t('BUOD verified', 'موثق من بُعد'),
    manufacturer_verified: t('Manufacturer verified', 'موثق من المصنع'),
    supplier_verified: t('Supplier verified', 'موثق من المورد'),
  }[product.verification_status];

  return <div className="min-h-screen bg-ivory pb-20 pt-[76px]">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-8">
      <Link to="/blocks" className="inline-flex items-center gap-2 text-sm font-semibold text-medium-brown hover:text-gold"><ArrowLeft className={lang === 'ar' ? 'rotate-180' : ''} size={16}/>{t('Back to blocks', 'العودة إلى البلوكات')}</Link>
      <div className="flex items-center gap-3"><span role="status" className="text-xs text-green-700">{shareNotice}</span><button type="button" onClick={sharePage} className="digital-panel inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-medium-brown transition hover:border-gold"><Share2 size={15}/>{t('Share', 'مشاركة')}</button></div>
    </div>

    <main className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.1fr_.9fr]">
      <section><div className="digital-panel flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl">{displayImage ? <img src={displayImage} alt={name} className="h-full w-full object-contain"/> : <div className="text-center text-light-brown"><ImageOff className="mx-auto mb-3" size={38}/>{t('Product image unavailable', 'صورة المنتج غير متاحة')}</div>}</div>{detailErrors.images && <div className="mt-3"><SectionError>{t('Some product images could not be loaded.', 'تعذّر تحميل بعض صور المنتج.')}</SectionError></div>}{images.length > 1 && <div className="mt-3 flex gap-3 overflow-auto">{images.map((image, index) => <button type="button" key={image.id} onClick={() => setActiveImage(index)} className={`h-20 w-24 flex-none overflow-hidden rounded-xl border-2 bg-white ${activeImage === index ? 'border-gold' : 'border-transparent'}`} aria-label={t(`View image ${index + 1}`, `عرض الصورة ${index + 1}`)}><img src={image.signed_url} alt={lang === 'ar' ? image.alt_text_ar : image.alt_text_en} className="h-full w-full object-cover"/></button>)}</div>}</section>

      <section>
        <div className="mb-4 flex flex-wrap gap-2">{product.buod_reference && <span className="badge-gold">{product.buod_reference}</span>}{category && <span className="badge-brown">{category}{subcategory ? ` / ${subcategory}` : ''}</span>}{verificationLabel && <span className="badge-green"><BadgeCheck size={14}/>{verificationLabel}</span>}{product.rights_confirmed && <span className="badge-green"><ShieldCheck size={14}/>{t('Rights confirmed', 'الحقوق مؤكدة')}</span>}</div>
        <h1 className="text-4xl font-black leading-tight text-dark-brown">{name}</h1>{otherName && <p className="mt-2 text-lg text-light-brown" dir={lang === 'ar' ? 'ltr' : 'rtl'}>{otherName}</p>}
        <p className="mt-6 whitespace-pre-line leading-8 text-medium-brown">{description || t('Description unavailable.', 'الوصف غير متاح.')}</p>
        {formats.length > 0 && <div className="mt-6"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-light-brown">{t('Available formats', 'الصيغ المتاحة')}</p><div className="flex flex-wrap gap-2">{formats.map((format) => <span key={format} className="rounded-lg border border-gold/25 bg-gold/10 px-3 py-1.5 font-mono text-xs font-bold text-dark-brown">{format}</span>)}</div></div>}
        <dl className="mt-8 grid grid-cols-2 gap-x-6"><DataValue label={t('Supplier', 'المورد')} value={supplierName} to={product.supplier_slug ? `/suppliers/${product.supplier_slug}` : null}/><DataValue label={t('Brand', 'العلامة التجارية')} value={product.brand_name}/><DataValue label={t('Product type', 'نوع المنتج')} value={product.product_type}/><DataValue label={t('Model number', 'رقم الطراز')} value={product.model_number}/><DataValue label={t('Country of origin', 'بلد المنشأ')} value={product.country_of_origin}/><DataValue label={t('Price', 'السعر')} value={price}/><DataValue label={t('Availability', 'التوفر')} value={typeof product.in_stock === 'boolean' ? (product.in_stock ? t('In stock', 'متوفر') : t('Out of stock', 'غير متوفر')) : null}/><DataValue label={t('Lead time', 'مدة التوريد')} value={product.lead_time}/><DataValue label={t('Minimum order', 'الحد الأدنى للطلب')} value={product.min_order_qty ? `${product.min_order_qty} ${product.unit || ''}`.trim() : null}/><DataValue label={t('File version', 'إصدار الملف')} value={product.version_number}/><DataValue label={t('Software', 'البرامج')} value={software.join(' · ')}/><DataValue label={t('Product page', 'صفحة المنتج')} value={productUrl ? t('Open supplier link', 'فتح رابط المورد') : null} href={productUrl}/></dl>
      </section>
    </main>

    <div className="mx-auto mt-14 grid max-w-7xl gap-8 px-6 lg:grid-cols-2">
      <section className="digital-panel rounded-3xl p-7"><h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-dark-brown"><Box className="text-gold"/>{t('Specifications', 'المواصفات')}</h2>{detailErrors.specifications ? <SectionError>{t('Specifications could not be loaded.', 'تعذّر تحميل المواصفات.')}</SectionError> : product.product_specifications.length ? <dl>{product.product_specifications.map((spec) => <DataValue key={spec.id} label={lang === 'ar' ? spec.specification_name_ar || spec.specification_name_en : spec.specification_name_en || spec.specification_name_ar} value={[spec.value, spec.unit].filter(Boolean).join(' ')}/>)}</dl> : <p className="text-sm text-light-brown">{t('Specifications unavailable.', 'المواصفات غير متاحة.')}</p>}</section>
      <section className="space-y-6">{downloadError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{downloadError}</div>}{detailErrors.files ? <SectionError>{t('Files could not be loaded. Please try again later.', 'تعذّر تحميل الملفات. يرجى المحاولة لاحقاً.')}</SectionError> : <><FileSection title={t('BIM & 3D files', 'ملفات BIM وثلاثية الأبعاد')} icon={<Layers3 className="text-gold"/>} files={blocks} user={user} onDownload={(file) => download(file, 'block_download')} t={t}/><FileSection title={t('Datasheet PDFs', 'ملفات PDF التعريفية')} icon={<FileText className="text-gold"/>} files={datasheets} user={user} onDownload={(file) => download(file, 'datasheet_download')} t={t}/></>}</section>
    </div>

    <div className="mx-auto mt-8 grid max-w-7xl gap-8 px-6 lg:grid-cols-2">
      <section className="digital-panel rounded-3xl p-7"><h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-dark-brown"><PackageCheck className="text-gold"/>{t('Materials and finishes', 'المواد والتشطيبات')}</h2>{detailErrors.materials ? <SectionError>{t('Materials could not be loaded.', 'تعذّر تحميل بيانات المواد.')}</SectionError> : materials.length ? <div className="grid gap-3 sm:grid-cols-2">{materials.map((material) => { const materialName = lang === 'ar' ? material.material_name_ar || material.material_name_en : material.material_name_en || material.material_name_ar; return <div key={material.id} className="rounded-xl bg-ivory p-4"><p className="font-semibold text-dark-brown">{materialName}</p><p className="mt-1 text-xs text-light-brown">{[material.material_type, material.finish, material.color].filter(Boolean).join(' · ') || t('Material details unavailable', 'تفاصيل المادة غير متاحة')}</p></div>; })}</div> : <p className="text-sm text-light-brown">{t('No material information is available yet.', 'لا توجد معلومات مواد متاحة حتى الآن.')}</p>}</section>
      <section className="digital-panel rounded-3xl p-7"><h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-dark-brown"><ShieldCheck className="text-gold"/>{t('Usage license', 'ترخيص الاستخدام')}</h2><p className="mb-5 text-sm text-light-brown">{product.license_type || t('License type not specified', 'نوع الترخيص غير محدد')}</p><div className="grid gap-3 sm:grid-cols-2"><Permit label={t('Download files', 'تحميل الملفات')} allowed={product.license_download} t={t}/><Permit label={t('Commercial use', 'الاستخدام التجاري')} allowed={product.license_commercial} t={t}/><Permit label={t('Modify files', 'تعديل الملفات')} allowed={product.license_modify} t={t}/><Permit label={t('Redistribute', 'إعادة التوزيع')} allowed={product.license_redistribute} t={t}/></div></section>
    </div>

    {related.length > 0 && <section className="mx-auto mt-16 max-w-7xl px-6"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">{t('Continue exploring', 'تابع الاستكشاف')}</p><h2 className="mt-2 text-2xl font-black text-dark-brown">{t('Related construction blocks', 'بلوكات مشابهة')}</h2></div><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <ProductCard key={item.id || item.slug} product={item}/>)}</div></section>}
  </div>;
}

function FileSection({ title, icon, files, user, onDownload, t }) {
  return <div className="digital-panel rounded-3xl p-7"><h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-dark-brown">{icon}{title}</h2>{files.length ? <div className="space-y-3">{files.map((file) => <div key={file.id} className="flex items-center justify-between gap-4 rounded-xl bg-ivory p-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-dark-brown">{file.original_file_name || file.file_format || t('File', 'ملف')}</p><p className="mt-1 text-xs text-light-brown">{[file.software_name, file.software_version, file.file_format, formatBytes(file.file_size)].filter(Boolean).join(' · ') || t('File details unavailable', 'تفاصيل الملف غير متاحة')}</p></div><button type="button" onClick={() => onDownload(file)} className="btn-primary shrink-0 px-4 py-2 text-xs">{user ? <Download size={14}/> : <LockKeyhole size={14}/>} {user ? t('Download', 'تحميل') : t('Sign in', 'تسجيل الدخول')}</button></div>)}</div> : <p className="text-sm text-light-brown">{t('No files are currently available.', 'لا توجد ملفات متاحة حالياً.')}</p>}</div>;
}
