import { useEffect, useState } from 'react';
import { ArrowLeft, Box, Download, ExternalLink, FileText, ImageOff, LockKeyhole } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/mvp/States';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { mvpService } from '../services/mvpService';

const pick = (row, ...keys) => keys.map((key) => row?.[key]).find((value) => value !== null && value !== undefined && value !== '');
const formatBytes = (bytes) => !bytes ? null : `${(bytes / 1024 / 1024).toFixed(bytes > 10485760 ? 0 : 1)} MB`;

function DataValue({ label, value, href }) {
  return <div className="border-b border-sand/70 py-3"><dt className="text-xs font-semibold uppercase tracking-wider text-light-brown">{label}</dt><dd className="mt-1 text-sm font-medium text-dark-brown">{value ? (href ? <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline">{value}<ExternalLink size={12}/></a> : value) : <span className="font-normal text-light-brown/70">—</span>}</dd></div>;
}

export default function BlockDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setLoading(true);
    mvpService.getProduct(slug).then((data) => { setProduct(data); if (data) mvpService.recordEvent('product_view', { product_id: data.id || data.product_id }); }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [slug]);

  async function download(file, eventName) {
    if (!user) { navigate('/login', { state: { from: { pathname: `/blocks/${slug}` } } }); return; }
    const url = await mvpService.createDownloadUrl(file);
    if (url) {
      await mvpService.recordEvent(eventName, { product_id: product.id || product.product_id, file_id: file.id });
      window.location.assign(url);
    }
  }

  if (loading) return <div className="min-h-screen bg-ivory pt-24"><LoadingState/></div>;
  if (error) return <div className="min-h-screen bg-ivory px-6 pt-28"><ErrorState message={error}/></div>;
  if (!product) return <div className="min-h-screen bg-ivory px-6 pt-28"><ErrorState message={t('Block not found.', 'البلوك غير موجود.')}/></div>;

  const name = lang === 'ar' ? pick(product, 'product_name_ar', 'product_name_en') : pick(product, 'product_name_en', 'product_name_ar');
  const otherName = lang === 'ar' ? product.product_name_en : product.product_name_ar;
  const description = lang === 'ar' ? pick(product, 'full_description_ar', 'short_description_ar', 'full_description_en', 'short_description_en') : pick(product, 'full_description_en', 'short_description_en', 'full_description_ar', 'short_description_ar');
  const category = lang === 'ar' ? pick(product, 'category_name_ar', 'category_ar') : pick(product, 'category_name_en', 'category_en');
  const subcategory = lang === 'ar' ? pick(product, 'subcategory_name_ar', 'subcategory_ar') : pick(product, 'subcategory_name_en', 'subcategory_en');
  const supplierName = lang === 'ar' ? pick(product, 'supplier_name_ar', 'company_name_ar', 'supplier_name_en') : pick(product, 'supplier_name_en', 'company_name_en', 'supplier_name_ar');
  const images = product.product_images || [];
  const files = (product.product_files || []).filter((file) => file.is_available !== false);
  const blocks = files.filter((file) => file.file_type === 'block');
  const datasheets = files.filter((file) => file.file_type === 'datasheet');
  const displayImage = images[activeImage]?.signed_url || product.signed_image_url;

  return <div className="min-h-screen bg-ivory pb-20 pt-[70px]">
    <div className="mx-auto max-w-7xl px-6 py-8"><Link to="/blocks" className="inline-flex items-center gap-2 text-sm font-semibold text-medium-brown hover:text-gold"><ArrowLeft className={lang === 'ar' ? 'rotate-180' : ''} size={16}/>{t('Back to blocks', 'العودة إلى البلوكات')}</Link></div>
    <main className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.1fr_.9fr]">
      <section><div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-sand bg-white">{displayImage ? <img src={displayImage} alt={name} className="h-full w-full object-contain"/> : <div className="text-center text-light-brown"><ImageOff className="mx-auto mb-3" size={38}/>{t('Product image unavailable', 'صورة المنتج غير متاحة')}</div>}</div>{images.length > 1 && <div className="mt-3 flex gap-3 overflow-auto">{images.map((image, index) => <button key={image.id} onClick={() => setActiveImage(index)} className={`h-20 w-24 flex-none overflow-hidden rounded-xl border-2 bg-white ${activeImage === index ? 'border-gold' : 'border-transparent'}`} aria-label={t(`View image ${index + 1}`, `عرض الصورة ${index + 1}`)}><img src={image.signed_url} alt={lang === 'ar' ? image.alt_text_ar : image.alt_text_en} className="h-full w-full object-cover"/></button>)}</div>}</section>
      <section><div className="mb-4 flex flex-wrap gap-2">{product.buod_reference && <span className="badge-gold">{product.buod_reference}</span>}{category && <span className="badge-brown">{category}{subcategory ? ` / ${subcategory}` : ''}</span>}</div><h1 className="text-4xl font-black leading-tight text-dark-brown">{name}</h1>{otherName && <p className="mt-2 text-lg text-light-brown" dir={lang === 'ar' ? 'ltr' : 'rtl'}>{otherName}</p>}<p className="mt-6 whitespace-pre-line leading-8 text-medium-brown">{description || t('Description unavailable.', 'الوصف غير متاح.')}</p>
        <dl className="mt-8 grid grid-cols-2 gap-x-6"><DataValue label={t('Supplier', 'المورد')} value={supplierName}/><DataValue label={t('Brand', 'العلامة التجارية')} value={product.brand_name}/><DataValue label={t('Model number', 'رقم الطراز')} value={product.model_number}/><DataValue label={t('Country of origin', 'بلد المنشأ')} value={product.country_of_origin}/><DataValue label={t('Price', 'السعر')} value={product.price !== null && product.price !== undefined ? `${product.price} ${product.currency || ''}` : null}/><DataValue label={t('Price updated', 'تحديث السعر')} value={product.price_last_updated_at ? new Date(product.price_last_updated_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB') : null}/><DataValue label={t('Product page', 'صفحة المنتج')} value={product.supplier_product_url ? t('Open supplier link', 'فتح رابط المورد') : null} href={product.supplier_product_url}/></dl>
      </section>
    </main>
    <div className="mx-auto mt-14 grid max-w-7xl gap-8 px-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-sand bg-white p-7"><h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-dark-brown"><Box className="text-gold"/>{t('Specifications', 'المواصفات')}</h2>{product.product_specifications.length ? <dl>{product.product_specifications.map((spec) => <DataValue key={spec.id} label={lang === 'ar' ? spec.specification_name_ar || spec.specification_name_en : spec.specification_name_en || spec.specification_name_ar} value={[spec.value, spec.unit].filter(Boolean).join(' ')}/>)}</dl> : <p className="text-sm text-light-brown">{t('Specifications unavailable.', 'المواصفات غير متاحة.')}</p>}</section>
      <section className="space-y-6"><FileSection title={t('BIM & 3D files', 'ملفات BIM وثلاثية الأبعاد')} files={blocks} user={user} onDownload={(file) => download(file, 'block_download')} t={t}/><FileSection title={t('Datasheet PDFs', 'ملفات PDF التعريفية')} files={datasheets} user={user} onDownload={(file) => download(file, 'datasheet_download')} t={t}/></section>
    </div>
  </div>;
}

function FileSection({ title, files, user, onDownload, t }) {
  return <div className="rounded-3xl border border-sand bg-white p-7"><h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-dark-brown"><FileText className="text-gold"/>{title}</h2>{files.length ? <div className="space-y-3">{files.map((file) => <div key={file.id} className="flex items-center justify-between gap-4 rounded-xl bg-ivory p-4"><div><p className="text-sm font-semibold text-dark-brown">{file.original_file_name || file.file_format || t('File', 'ملف')}</p><p className="mt-1 text-xs text-light-brown">{[file.software_name, file.software_version, file.file_format, formatBytes(file.file_size)].filter(Boolean).join(' · ') || t('File details unavailable', 'تفاصيل الملف غير متاحة')}</p></div><button onClick={() => onDownload(file)} className="btn-primary shrink-0 px-4 py-2 text-xs">{user ? <Download size={14}/> : <LockKeyhole size={14}/>} {user ? t('Download', 'تحميل') : t('Sign in', 'تسجيل الدخول')}</button></div>)}</div> : <p className="text-sm text-light-brown">{t('No files are currently available.', 'لا توجد ملفات متاحة حالياً.')}</p>}</div>;
}
