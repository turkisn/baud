import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Star, Package, Building, Phone, Mail, Globe, CheckCircle, ChevronRight, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { blocks, suppliers } from '../data/mockData';
import BlockCard from '../components/BlockCard';

const FormatBadge = ({ fmt }) => (
  <span className="bg-sand text-medium-brown px-3 py-1.5 rounded-lg text-sm font-mono font-medium border border-beige">
    {fmt}
  </span>
);

export default function BlockDetails() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const block = blocks.find(b => b.id === id) || blocks[0];
  const supplier = suppliers.find(s => s.name === block.supplier) || suppliers[0];
  const similar = blocks.filter(b => b.id !== block.id && b.category === block.category).slice(0, 4);

  const categoryIcons = {
    'Architectural Elements': '🏛️',
    'Decorative Screens': '🔲',
    'Landscape': '🌴',
    'Doors & Windows': '🚪',
    'Furniture': '🛋️',
    'Ceilings': '✨',
    'Structural': '🧱',
    'Lighting': '💡',
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-sand px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-light-brown">
          <Link to="/" className="hover:text-gold transition-colors">{t('Home', 'الرئيسية')}</Link>
          <ChevronRight size={14} />
          <Link to="/library" className="hover:text-gold transition-colors">{t('Library', 'المكتبة')}</Link>
          <ChevronRight size={14} />
          <span className="text-dark-brown font-medium truncate">{lang === 'ar' ? block.nameAr : block.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Preview + Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Preview */}
            <div className="bg-gradient-to-br from-sand to-beige rounded-3xl h-72 sm:h-96 flex flex-col items-center justify-center relative overflow-hidden">
              <span className="text-8xl mb-4">{categoryIcons[block.category] || '📦'}</span>
              <div className="grid grid-cols-4 gap-1 opacity-15 absolute bottom-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-5 h-5 bg-dark-brown rounded" />
                ))}
              </div>
              {/* SVG pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 400">
                <polygon points="200,50 350,200 200,350 50,200" stroke="#3D2B1F" strokeWidth="1" fill="none"/>
                <polygon points="200,100 300,200 200,300 100,200" stroke="#C9A84C" strokeWidth="0.7" fill="none"/>
              </svg>
              {block.new && (
                <span className="absolute top-4 left-4 bg-dark-brown text-white text-sm font-semibold px-3 py-1 rounded-full">
                  {t('New', 'جديد')}
                </span>
              )}
            </div>

            {/* Title + Meta */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-3xl font-bold text-dark-brown mb-1">
                    {lang === 'ar' ? block.nameAr : block.name}
                  </h1>
                  <p className="text-light-brown">{lang === 'ar' ? block.categoryAr : block.category}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-2 border border-sand">
                  <Star size={16} fill="#C9A84C" className="text-gold" />
                  <span className="font-bold text-dark-brown">{block.rating}</span>
                  <span className="text-light-brown text-sm">/ 5</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-light-brown">
                <span className="flex items-center gap-1.5">
                  <Download size={14} />
                  {block.downloads} {t('downloads', 'تحميل')}
                </span>
                <span className="text-beige">|</span>
                <span>SKU: {block.sku}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-bold text-dark-brown mb-3">{t('Description', 'الوصف')}</h2>
              <p className="text-medium-brown leading-relaxed">
                {lang === 'ar' ? block.descriptionAr : block.description}
              </p>
            </div>

            {/* Specs */}
            <div>
              <h2 className="text-lg font-bold text-dark-brown mb-4">{t('Specifications', 'المواصفات')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: t('Width', 'العرض'), value: `${block.dimensions.width} ${block.dimensions.unit}` },
                  { label: t('Height', 'الارتفاع'), value: `${block.dimensions.height} ${block.dimensions.unit}` },
                  { label: t('Depth', 'العمق'), value: `${block.dimensions.depth} ${block.dimensions.unit}` },
                  { label: t('Material', 'المادة'), value: lang === 'ar' ? block.materialAr : block.material },
                  { label: t('Weight', 'الوزن'), value: block.weight },
                  { label: t('Lead Time', 'مدة التوريد'), value: block.leadTime },
                ].map((spec, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-sand">
                    <div className="text-xs text-light-brown mb-1">{spec.label}</div>
                    <div className="font-semibold text-dark-brown text-sm">{spec.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formats */}
            <div>
              <h2 className="text-lg font-bold text-dark-brown mb-3">{t('Available Formats', 'الصيغ المتاحة')}</h2>
              <div className="flex flex-wrap gap-2">
                {block.formats.map(fmt => <FormatBadge key={fmt} fmt={fmt} />)}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h2 className="text-lg font-bold text-dark-brown mb-3">{t('Tags', 'الوسوم')}</h2>
              <div className="flex flex-wrap gap-2">
                {block.tags.map(tag => (
                  <span key={tag} className="bg-light-green/30 text-gold px-3 py-1 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Actions + Supplier */}
          <div className="space-y-6">
            {/* Price + Download CTA */}
            <div className="bg-white rounded-2xl p-6 border border-sand shadow-sm sticky top-24">
              <div className="mb-4">
                <div className="text-3xl font-bold text-dark-brown">
                  {block.price.toLocaleString()}
                  <span className="text-base font-normal text-light-brown ml-1">SAR</span>
                </div>
                <p className="text-xs text-light-brown mt-1">{t('Price per unit', 'السعر للوحدة')}</p>
              </div>
              <button className="w-full btn-primary justify-center py-4 text-base mb-3">
                <Download size={18} />
                {t('Download 3D Block', 'تحميل الكتلة ثلاثية الأبعاد')}
              </button>
              <button className="w-full btn-secondary justify-center py-3">
                {t('Request Quote', 'طلب عرض سعر')}
              </button>
              <p className="text-center text-xs text-light-brown mt-3">
                {t('Free for registered users', 'مجاني للمستخدمين المسجلين')}
              </p>
            </div>

            {/* Supplier Card */}
            <div className="bg-white rounded-2xl p-6 border border-sand">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-dark-brown">
                    {lang === 'ar' ? supplier.nameAr : supplier.name}
                  </h3>
                  <p className="text-sm text-light-brown">{lang === 'ar' ? supplier.categoryAr : supplier.category}</p>
                </div>
                {supplier.verified && (
                  <div className="flex items-center gap-1 bg-green-50 text-gold text-xs font-medium px-2 py-1 rounded-full">
                    <CheckCircle size={12} />
                    {t('Verified', 'موثق')}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill={i < Math.floor(supplier.rating) ? '#C9A84C' : 'none'} className="text-gold" />
                  ))}
                </div>
                <span className="text-sm font-medium text-dark-brown">{supplier.rating}</span>
                <span className="text-xs text-light-brown">({supplier.products} {t('products', 'منتج')})</span>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-light-brown">
                  <Building size={14} className="flex-shrink-0" />
                  <span>{lang === 'ar' ? supplier.cityAr : supplier.city}, KSA</span>
                </div>
                <div className="flex items-center gap-2 text-light-brown">
                  <Phone size={14} className="flex-shrink-0" />
                  <span>{supplier.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-light-brown">
                  <Mail size={14} className="flex-shrink-0" />
                  <span>{supplier.email}</span>
                </div>
              </div>

              <Link to="/suppliers" className="mt-4 w-full btn-secondary text-sm justify-center py-2.5">
                {t('View Supplier Profile', 'عرض ملف المورد')} <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Similar Blocks */}
        {similar.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-dark-brown mb-6">{t('Similar Blocks', 'كتل مشابهة')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similar.map(b => <BlockCard key={b.id} block={b} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
