import { useState } from 'react';
import { Upload, Package, Download, Eye, TrendingUp, Users, Bell, Settings, Plus, MoreVertical, CheckCircle, Clock, Star, BarChart2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { blocks } from '../data/mockData';

const mockLeads = [
  { name: 'Eng. Ahmad Al-Shehri', company: 'Dar Al-Omran Architects', product: 'Najdi Arch Column', date: '2025-05-12', status: 'hot' },
  { name: 'Sarah Al-Ghamdi', company: 'Design Studio KSA', product: 'Islamic Mashrabiya Screen', date: '2025-05-11', status: 'warm' },
  { name: 'Mohammed Al-Qahtani', company: 'ROSHN Group', product: 'LED Arabesque Light Panel', date: '2025-05-10', status: 'hot' },
  { name: 'Fatima Al-Zahrani', company: 'Emaar KSA', product: 'Najdi Arch Column', date: '2025-05-09', status: 'cold' },
  { name: 'Khalid Al-Dosari', company: 'MBC Group Projects', product: 'Islamic Mashrabiya Screen', date: '2025-05-08', status: 'warm' },
];

const StatCard = ({ icon: Icon, value, label, change, color }) => (
  <div className="bg-white rounded-2xl p-5 border border-sand">
    <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-3`}>
      <Icon size={20} />
    </div>
    <div className="text-2xl font-bold text-dark-brown">{value}</div>
    <div className="text-sm text-light-brown mt-0.5">{label}</div>
    {change && (
      <div className="flex items-center gap-1 mt-2 text-xs font-medium text-gold">
        <TrendingUp size={11} />
        {change}
      </div>
    )}
  </div>
);

export default function SupplierDashboard() {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadModal, setUploadModal] = useState(false);

  const tabs = [
    { id: 'overview', label: t('Overview', 'نظرة عامة') },
    { id: 'products', label: t('My Products', 'منتجاتي') },
    { id: 'leads', label: t('Leads', 'العملاء المحتملون') },
    { id: 'upload', label: t('Upload Product', 'رفع منتج') },
  ];

  return (
    <div className="min-h-screen bg-ivory">
      {/* Sidebar + Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 bg-dark-brown min-h-screen flex-col sticky top-0 h-screen overflow-y-auto">
          <div className="p-6 border-b border-medium-brown">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
                <span className="font-bold text-dark-brown">ر</span>
              </div>
              <div>
                <div className="text-warm-white font-semibold text-sm">Al-Rajhi Materials</div>
                <div className="text-light-brown text-xs">{t('Verified Supplier', 'مورد موثق')}</div>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {[
              { id: 'overview', icon: BarChart2, label: t('Overview', 'نظرة عامة') },
              { id: 'products', icon: Package, label: t('Products', 'المنتجات') },
              { id: 'leads', icon: Users, label: t('Leads', 'العملاء') },
              { id: 'upload', icon: Upload, label: t('Upload', 'رفع') },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-dark-brown text-white'
                    : 'text-light-brown hover:bg-medium-brown hover:text-warm-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-medium-brown">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-light-brown hover:bg-medium-brown transition-all">
              <Settings size={18} />
              {t('Settings', 'الإعدادات')}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar */}
          <div className="bg-white border-b border-sand px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-bold text-dark-brown">{t('Supplier Dashboard', 'لوحة تحكم المورد')}</h1>
              <p className="text-xs text-light-brown">{t('Al-Rajhi Building Materials', 'الراجحي لمواد البناء')}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg text-light-brown hover:bg-sand">
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full" />
              </button>
              {/* Mobile tabs */}
              <div className="lg:hidden flex gap-1">
                {tabs.slice(0, 3).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === tab.id ? 'bg-dark-brown text-white' : 'bg-sand text-medium-brown'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Package} value="45" label={t('Total Products', 'المنتجات الإجمالية')} change="+3 this month" color="bg-blue-50 text-blue-600" />
                  <StatCard icon={Download} value="2,847" label={t('Total Downloads', 'إجمالي التحميلات')} change="+18% vs last month" color="bg-green-50 text-gold" />
                  <StatCard icon={Eye} value="18,420" label={t('Profile Views', 'مشاهدات الملف')} change="+24% vs last month" color="bg-purple-50 text-purple-600" />
                  <StatCard icon={Users} value="94" label={t('New Leads', 'عملاء جدد')} change="+12 this week" color="bg-amber-50 text-amber-600" />
                </div>

                {/* Chart Placeholder */}
                <div className="bg-white rounded-2xl border border-sand p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-dark-brown">{t('Download Analytics', 'تحليلات التحميل')}</h2>
                    <select className="text-sm border border-sand rounded-lg px-3 py-1.5 text-medium-brown">
                      <option>{t('Last 30 days', 'آخر 30 يوم')}</option>
                      <option>{t('Last 90 days', 'آخر 90 يوم')}</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2 h-36">
                    {[45, 72, 58, 90, 68, 95, 82, 110, 88, 125, 98, 140].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-gold/15 rounded-t-sm hover:bg-dark-brown/40 transition-colors"
                          style={{ height: `${(val / 140) * 100}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-light-brown mt-2">
                    <span>{t('May 1', '1 مايو')}</span>
                    <span>{t('May 30', '30 مايو')}</span>
                  </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-2xl border border-sand p-6">
                  <h2 className="font-bold text-dark-brown mb-4">{t('Top Performing Products', 'أفضل المنتجات أداءً')}</h2>
                  <div className="space-y-3">
                    {blocks.slice(0, 3).map((block, i) => (
                      <div key={block.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-warm-white transition-colors">
                        <div className="w-8 h-8 bg-sand rounded-lg flex items-center justify-center text-dark-brown font-bold text-sm">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-dark-brown truncate">
                            {lang === 'ar' ? block.nameAr : block.name}
                          </div>
                          <div className="text-xs text-light-brown">{block.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-dark-brown">{block.downloads}</div>
                          <div className="text-xs text-light-brown">{t('downloads', 'تحميل')}</div>
                        </div>
                        <div className="flex items-center gap-1 text-gold">
                          <Star size={12} fill="currentColor" />
                          <span className="text-xs text-medium-brown">{block.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-dark-brown">{t('My Products', 'منتجاتي')}</h2>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="btn-primary py-2.5"
                  >
                    <Plus size={16} /> {t('Add Product', 'إضافة منتج')}
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-sand overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-warm-white border-b border-sand">
                        <tr>
                          {[t('Product', 'المنتج'), t('Category', 'الفئة'), t('Downloads', 'التحميلات'), t('Rating', 'التقييم'), t('Price', 'السعر'), t('Status', 'الحالة'), ''].map((h, i) => (
                            <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-medium-brown uppercase tracking-wider">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sand">
                        {blocks.slice(0, 5).map(block => (
                          <tr key={block.id} className="hover:bg-warm-white transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-sand rounded-lg flex items-center justify-center text-lg">
                                  {block.category === 'Landscape' ? '🌴' : block.category === 'Lighting' ? '💡' : '📦'}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-dark-brown">{lang === 'ar' ? block.nameAr : block.name}</div>
                                  <div className="text-xs text-light-brown">{block.sku}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-medium-brown">{lang === 'ar' ? block.categoryAr : block.category}</td>
                            <td className="px-4 py-4 text-sm text-medium-brown">{block.downloads}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1">
                                <Star size={12} fill="#C9A84C" className="text-gold" />
                                <span className="text-sm text-medium-brown">{block.rating}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-dark-brown">{block.price.toLocaleString()} SAR</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                                block.featured ? 'bg-green-50 text-gold' : 'bg-sand text-medium-brown'
                              }`}>
                                {block.featured ? <CheckCircle size={10} /> : <Clock size={10} />}
                                {block.featured ? t('Active', 'نشط') : t('Draft', 'مسودة')}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <button className="p-1.5 rounded-lg text-light-brown hover:bg-sand hover:text-dark-brown transition-colors">
                                <MoreVertical size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Leads Tab */}
            {activeTab === 'leads' && (
              <div>
                <h2 className="text-xl font-bold text-dark-brown mb-6">{t('Recent Leads', 'العملاء المحتملون الأخيرون')}</h2>
                <div className="space-y-3">
                  {mockLeads.map((lead, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-sand p-5 flex items-center gap-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-sand to-beige rounded-xl flex items-center justify-center text-lg font-bold text-dark-brown flex-shrink-0">
                        {lead.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-dark-brown text-sm">{lead.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            lead.status === 'hot' ? 'bg-red-50 text-red-600' :
                            lead.status === 'warm' ? 'bg-amber-50 text-amber-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {lead.status === 'hot' ? '🔥 Hot' : lead.status === 'warm' ? '☀️ Warm' : '❄️ Cold'}
                          </span>
                        </div>
                        <div className="text-xs text-light-brown">{lead.company}</div>
                        <div className="text-xs text-medium-brown mt-1">
                          {t('Interested in:', 'مهتم بـ:')} <span className="font-medium">{lead.product}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-light-brown mb-2">{lead.date}</div>
                        <button className="btn-primary text-xs py-2 px-3">
                          {t('Reply', 'رد')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-bold text-dark-brown mb-6">{t('Upload New Product', 'رفع منتج جديد')}</h2>
                <div className="bg-white rounded-2xl border border-sand p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-dark-brown mb-2">{t('Product Name (English)', 'اسم المنتج (الإنجليزية)')}</label>
                    <input className="input-field" placeholder="e.g. Najdi Column Capital" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-brown mb-2">{t('Product Name (Arabic)', 'اسم المنتج (العربية)')}</label>
                    <input className="input-field text-right" placeholder="مثال: تاج عمود نجدي" dir="rtl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-brown mb-2">{t('Category', 'الفئة')}</label>
                      <select className="input-field">
                        <option>Architectural Elements</option>
                        <option>Decorative Screens</option>
                        <option>Furniture</option>
                        <option>Landscape</option>
                        <option>Lighting</option>
                        <option>Structural</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-brown mb-2">{t('Price (SAR)', 'السعر (ريال)')}</label>
                      <input type="number" className="input-field" placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-brown mb-2">{t('Description', 'الوصف')}</label>
                    <textarea className="input-field h-24 resize-none" placeholder={t('Describe your product...', 'صف منتجك...')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-brown mb-2">{t('3D Files', 'ملفات ثلاثية الأبعاد')}</label>
                    <div className="border-2 border-dashed border-sand rounded-xl p-8 text-center hover:border-dark-brown transition-colors cursor-pointer">
                      <Upload size={28} className="text-light-brown mx-auto mb-3" />
                      <p className="text-sm font-medium text-dark-brown mb-1">
                        {t('Drop files here or click to browse', 'اسحب الملفات هنا أو انقر للاستعراض')}
                      </p>
                      <p className="text-xs text-light-brown">{t('Supports: DWG, RVT, SKP, OBJ, FBX, 3DS', 'يدعم: DWG, RVT, SKP, OBJ, FBX, 3DS')}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-brown mb-2">{t('Product Images', 'صور المنتج')}</label>
                    <div className="border-2 border-dashed border-sand rounded-xl p-6 text-center hover:border-dark-brown transition-colors cursor-pointer">
                      <p className="text-sm text-light-brown">{t('Upload product renders or photos', 'ارفع صور أو مجسمات المنتج')}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-brown mb-2">{t('Materials', 'المواد')}</label>
                    <input className="input-field" placeholder={t('e.g. Limestone, Steel, Gypsum', 'مثال: حجر كلسي، فولاذ، جبس')} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button className="btn-primary flex-1 justify-center py-3.5">
                      <Upload size={16} />
                      {t('Submit Product', 'إرسال المنتج')}
                    </button>
                    <button className="btn-secondary px-6">
                      {t('Save Draft', 'حفظ كمسودة')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
