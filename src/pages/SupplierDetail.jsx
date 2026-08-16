import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, ExternalLink, Globe, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '../components/mvp/ProductCard';
import { EmptyState, ErrorState, LoadingState } from '../components/mvp/States';
import { useLanguage } from '../context/LanguageContext';
import { mvpService } from '../services/mvpService';

const pick = (row, ...keys) => keys.map((key) => row?.[key]).find(Boolean);
export default function SupplierDetail() {
  const { slug } = useParams(); const { lang, t } = useLanguage();
  const [supplier, setSupplier] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { mvpService.getSupplier(slug).then((data) => { setSupplier(data); if (data) mvpService.recordEvent('supplier_view', { supplier_id: data.id || data.supplier_id }); }).catch((err) => setError(err.message)).finally(() => setLoading(false)); }, [slug]);
  if (loading) return <div className="min-h-screen bg-ivory pt-24"><LoadingState/></div>;
  if (error || !supplier) return <div className="min-h-screen bg-ivory px-6 pt-28"><ErrorState message={error || t('Supplier not found.', 'المورد غير موجود.')}/></div>;
  const name = lang === 'ar' ? pick(supplier, 'company_name_ar', 'name_ar', 'company_name_en') : pick(supplier, 'company_name_en', 'name_en', 'company_name_ar');
  const otherName = lang === 'ar' ? supplier.company_name_en : supplier.company_name_ar;
  const description = lang === 'ar' ? pick(supplier, 'description_ar', 'description_en') : pick(supplier, 'description_en', 'description_ar');
  const location = pick(supplier, 'location', 'city', 'country');
  return <div className="min-h-screen bg-ivory pb-20 pt-[70px]"><div className="relative h-64 overflow-hidden bg-dark-brown">{supplier.signed_cover_url && <img src={supplier.signed_cover_url} alt="" className="h-full w-full object-cover opacity-55"/>}<div className="absolute inset-0 bg-gradient-to-t from-deep-brown via-deep-brown/30 to-transparent"/></div><main className="mx-auto -mt-20 max-w-7xl px-6"><Link to="/suppliers" className="relative mb-5 inline-flex items-center gap-2 text-sm font-semibold text-warm-white"><ArrowLeft className={lang === 'ar' ? 'rotate-180' : ''} size={16}/>{t('All suppliers', 'جميع الموردين')}</Link><section className="relative rounded-3xl border border-sand bg-white p-7 shadow-brand-lg sm:p-10"><div className="flex flex-col gap-6 sm:flex-row sm:items-start"><div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sand bg-ivory">{supplier.signed_logo_url ? <img src={supplier.signed_logo_url} alt={`${name} logo`} className="h-full w-full object-contain"/> : <Building2 className="text-beige" size={42}/>}</div><div className="flex-1"><h1 className="text-3xl font-black text-dark-brown sm:text-4xl">{name}</h1>{otherName && <p className="mt-1 text-light-brown">{otherName}</p>}<p className="mt-5 max-w-3xl whitespace-pre-line leading-7 text-medium-brown">{description || t('Supplier description unavailable.', 'وصف المورد غير متاح.')}</p><div className="mt-6 flex flex-wrap gap-4 text-sm">{location && <span className="flex items-center gap-2 text-medium-brown"><MapPin className="text-gold" size={17}/>{location}</span>}{supplier.website && <a href={supplier.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold text-gold hover:underline"><Globe size={17}/>{t('Visit website', 'زيارة الموقع')}<ExternalLink size={13}/></a>}</div></div></div></section><section className="mt-14"><h2 className="mb-7 text-2xl font-black text-dark-brown">{t('Published BUOD blocks', 'بلوكات بُعد المنشورة')}</h2>{supplier.products.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{supplier.products.map((product) => <ProductCard key={product.id || product.slug} product={product}/>)}</div> : <EmptyState title={t('No published blocks yet', 'لا توجد بلوكات منشورة حالياً')}/>}</section></main></div>;
}
