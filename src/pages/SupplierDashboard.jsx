import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Package, Download, Eye, TrendingUp, Users, Bell, Settings, Plus, Star, BarChart2, LogOut, Home, X, FileText, Image as ImgIcon, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { blocks } from '../data/mockData';
import { storageService } from '../services/storageService';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';

const MY_STATUS_CFG = {
  draft:             { label: 'Draft',          bg: 'bg-gray-100',   text: 'text-gray-600'   },
  pending_review:    { label: 'Under Review',   bg: 'bg-amber-50',   text: 'text-amber-700'  },
  approved:          { label: 'Approved',       bg: 'bg-green-50',   text: 'text-green-700'  },
  rejected:          { label: 'Rejected',       bg: 'bg-red-50',     text: 'text-red-700'    },
  revision_required: { label: 'Needs Revision', bg: 'bg-purple-50',  text: 'text-purple-700' },
  archived:          { label: 'Archived',       bg: 'bg-gray-100',   text: 'text-gray-500'   },
};

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
  const { t, lang }          = useLanguage();
  const { user, logout }     = useAuth();
  const navigate             = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const companyName  = user?.company_name || user?.name?.split(' ')[0] || 'Supplier';
  const initial      = (user?.company_name || user?.name || user?.email || '?')[0].toUpperCase();

  const handleLogout = async () => { await logout(); navigate('/'); };

  // ── Upload tab state ──────────────────────────────────────────
  const filesInputRef   = useRef(null);
  const imagesInputRef  = useRef(null);

  const [categories,       setCategories]       = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [uploadForm, setUploadForm] = useState({
    productNameEn: '', productNameAr: '', categoryId: '', price: '', description: '', materials: '',
  });

  useEffect(() => {
    setCategoriesLoading(true);
    categoryService.getAllCategories()
      .then(data => setCategories(data || []))
      .catch(err => console.error('Failed to load categories:', err))
      .finally(() => setCategoriesLoading(false));
  }, []);

  // Load real products from DB whenever the products tab becomes active.
  useEffect(() => {
    if (activeTab !== 'products' || !user?.id) return;
    setMyProductsLoading(true);
    setMyProductsError('');
    productService.getMyProducts(user.id)
      .then(data => setMyProducts(data || []))
      .catch(err => setMyProductsError(err.message || 'Failed to load products.'))
      .finally(() => setMyProductsLoading(false));
  }, [activeTab, user?.id]);

  const [selectedFiles,  setSelectedFiles]  = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError,    setUploadError]    = useState('');
  const [uploadSuccess,  setUploadSuccess]  = useState('');

  // My Products tab
  const [myProducts,        setMyProducts]        = useState([]);
  const [myProductsLoading, setMyProductsLoading] = useState(false);
  const [myProductsError,   setMyProductsError]   = useState('');
  const [resubmitting,      setResubmitting]      = useState(null); // productId being resubmitted
  const [editingProduct,    setEditingProduct]    = useState(null); // product being edited

  const handleFilesChange = useCallback((e) => {
    const picked = Array.from(e.target.files || []);
    setSelectedFiles(prev => [
      ...prev,
      ...picked.map(f => ({ file: f, name: f.name, size: f.size })),
    ]);
    e.target.value = '';
  }, []);

  const handleImagesChange = useCallback((e) => {
    const picked = Array.from(e.target.files || []);
    setSelectedImages(prev => [
      ...prev,
      ...picked.map(f => ({ file: f, name: f.name, preview: URL.createObjectURL(f) })),
    ]);
    e.target.value = '';
  }, []);

  const removeFile  = (i) => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i));
  const removeImage = (i) => {
    setSelectedImages(prev => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const fmtSize = (bytes) => {
    if (!bytes) return '';
    if (bytes > 1e6) return ` (${(bytes / 1e6).toFixed(1)} MB)`;
    return ` (${(bytes / 1e3).toFixed(0)} KB)`;
  };

  // Submit or resubmit a product for review using the SECURITY DEFINER RPC.
  // Works for draft → pending_review and revision_required/rejected → pending_review.
  const handleResubmit = async (productId) => {
    setResubmitting(productId);
    setMyProductsError('');
    try {
      await productService.submitProduct(productId);
      const fresh = await productService.getMyProducts(user.id);
      setMyProducts(fresh || []);
    } catch (err) {
      setMyProductsError(err.message || 'Submission failed. Please try again.');
    } finally {
      setResubmitting(null);
    }
  };

  // Prefill the upload form with an existing product's metadata and switch to edit mode.
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setUploadForm({
      productNameEn: product.product_name_en || '',
      productNameAr: product.product_name_ar || '',
      categoryId:    product.category_id     || '',
      price:         product.price != null   ? String(product.price) : '',
      description:   product.short_description_en || '',
      materials:     '',
    });
    setUploadError('');
    setUploadSuccess('');
    setSelectedFiles([]);
    setSelectedImages([]);
    setActiveTab('upload');
  };

  const handleProductSubmit = async (status) => {
    setUploadError('');
    setUploadSuccess('');

    // ── Edit mode: update metadata only, no file uploads ────────────────
    if (editingProduct) {
      if (!uploadForm.productNameEn && !uploadForm.productNameAr) {
        setUploadError(t('Product name is required.', 'اسم المنتج مطلوب.'));
        return;
      }
      setUploading(true);
      try {
        await productService.updateProduct(editingProduct.id, {
          product_name_en:      uploadForm.productNameEn || null,
          product_name_ar:      uploadForm.productNameAr || null,
          category_id:          uploadForm.categoryId    || null,
          short_description_en: uploadForm.description   || null,
          short_description_ar: uploadForm.description   || null,
          is_free:              !uploadForm.price || parseFloat(uploadForm.price) === 0,
          price:                parseFloat(uploadForm.price) || null,
        });
        setUploadSuccess(t('✓ Product updated successfully!', '✓ تم تحديث المنتج بنجاح!'));
        setEditingProduct(null);
        const fresh = await productService.getMyProducts(user?.id);
        setMyProducts(fresh || []);
        setTimeout(() => { setUploadSuccess(''); setActiveTab('products'); }, 1500);
      } catch (err) {
        setUploadError(err.message || t('Update failed. Please try again.', 'فشل التحديث. يرجى المحاولة مجددًا.'));
      } finally {
        setUploading(false);
      }
      return;
    }

    // ── Create mode: validate then upload files + create draft ───────────
    if (!uploadForm.productNameEn && !uploadForm.productNameAr) {
      setUploadError(t('Product name is required.', 'اسم المنتج مطلوب.'));
      return;
    }
    if (status === 'pending_review' && !uploadForm.categoryId) {
      setUploadError(t(
        'Please select a category before submitting for review.',
        'يرجى اختيار التصنيف قبل إرسال المنتج للمراجعة.'
      ));
      return;
    }

    setUploading(true);
    try {
      const uid = user?.id;
      if (!uid) throw new Error('User session not found. Please log in again.');

      // Step 1: Upload files to storage
      setUploadProgress(t('Uploading 3D files…', 'جارٍ رفع الملفات ثلاثية الأبعاد…'));
      const uploadedFiles = await Promise.all(
        selectedFiles.map(({ file }) => storageService.uploadProductFile(uid, file))
      );

      setUploadProgress(t('Uploading images…', 'جارٍ رفع الصور…'));
      const uploadedImages = await Promise.all(
        selectedImages.map(({ file }, i) =>
          storageService.uploadProductImage(uid, file).then(res => ({ ...res, is_primary: i === 0 }))
        )
      );

      // Step 2: Create the draft product row + link files/images
      setUploadProgress(t('Creating product…', 'جارٍ إنشاء المنتج…'));
      const draft = await productService.createDraft(uid, {
        product_name_en:      uploadForm.productNameEn,
        product_name_ar:      uploadForm.productNameAr,
        short_description_en: uploadForm.description,
        short_description_ar: uploadForm.description,
        category_id:          uploadForm.categoryId || null,
        is_free:              !uploadForm.price || parseFloat(uploadForm.price) === 0,
        price:                parseFloat(uploadForm.price) || null,
        currency:             'SAR',
        visibility:           'private',
        featured_image_path:  uploadedImages[0]?.path || null,
        images:               uploadedImages,
        files:                uploadedFiles,
      });

      // Step 3: If submitting for review, call the server-side RPC.
      // The RPC verifies ownership + category + state, then transitions
      // draft → pending_review and generates the BUOD reference atomically.
      // Success is only reported after the DB confirms pending_review.
      if (status === 'pending_review') {
        setUploadProgress(t('Submitting for review…', 'جارٍ الإرسال للمراجعة…'));
        const submitted = await productService.submitProduct(draft.id);
        setUploadSuccess(
          t(
            `✓ Submitted for review! Reference: ${submitted.buod_reference}`,
            `✓ تم الإرسال للمراجعة! المرجع: ${submitted.buod_reference}`
          )
        );
      } else {
        setUploadSuccess(t('✓ Draft saved successfully!', '✓ تم حفظ المسودة بنجاح!'));
      }

      // Reset form only after confirmed success
      setUploadForm({ productNameEn: '', productNameAr: '', categoryId: '', price: '', description: '', materials: '' });
      setSelectedFiles([]);
      setSelectedImages([]);
    } catch (err) {
      setUploadError(err.message || t('Upload failed. Please try again.', 'فشل الرفع. يرجى المحاولة مجددًا.'));
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

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
            <Link to="/" className="block mb-4 text-warm-white font-bold text-lg opacity-80 hover:opacity-100 transition-opacity">
              {lang === 'ar' ? 'بُعد' : 'Buad'}
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-dark-brown flex-shrink-0"
                style={{ background: '#B68D57' }}>
                {initial}
              </div>
              <div className="min-w-0">
                <div className="text-warm-white font-semibold text-sm truncate">{companyName}</div>
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
          <div className="p-4 border-t border-medium-brown space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-light-brown hover:bg-medium-brown transition-all">
              <Settings size={18} />
              {t('Settings', 'الإعدادات')}
            </button>
            <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-light-brown hover:bg-medium-brown transition-all">
              <Home size={18} />
              {t('Back to Site', 'العودة للموقع')}
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-light-brown hover:bg-medium-brown transition-all">
              <LogOut size={18} />
              {t('Sign Out', 'تسجيل الخروج')}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Bar */}
          <div className="bg-white border-b border-sand px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h1 className="text-xl font-bold text-dark-brown">{t('Supplier Dashboard', 'لوحة تحكم المورد')}</h1>
              <p className="text-xs text-light-brown">{companyName}</p>
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

            {/* Products Tab — real data from Supabase */}
            {activeTab === 'products' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-dark-brown">{t('My Products', 'منتجاتي')}</h2>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setUploadForm({ productNameEn: '', productNameAr: '', categoryId: '', price: '', description: '', materials: '' });
                      setActiveTab('upload');
                    }}
                    className="btn-primary py-2.5"
                  >
                    <Plus size={16} /> {t('Add Product', 'إضافة منتج')}
                  </button>
                </div>

                {myProductsError && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 mb-4">
                    {myProductsError}
                  </div>
                )}

                {myProductsLoading ? (
                  <div className="flex items-center justify-center py-16 text-light-brown gap-2">
                    <Loader2 size={22} className="animate-spin" />
                    <span className="text-sm">{t('Loading products…', 'جارٍ تحميل المنتجات…')}</span>
                  </div>
                ) : myProducts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-sand p-12 text-center">
                    <Package size={36} className="text-light-brown mx-auto mb-3" />
                    <p className="text-medium-brown font-medium mb-1">{t('No products yet', 'لا توجد منتجات بعد')}</p>
                    <p className="text-sm text-light-brown">{t('Upload your first product to get started.', 'ارفع منتجك الأول للبدء.')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myProducts.map(product => {
                      const stCfg = MY_STATUS_CFG[product.status] || MY_STATUS_CFG.draft;
                      const catName = product.categories
                        ? (lang === 'ar' ? product.categories.name_ar : product.categories.name_en)
                        : '—';
                      const canEdit     = ['draft', 'rejected', 'revision_required'].includes(product.status);
                      const canSubmit   = ['draft', 'rejected', 'revision_required'].includes(product.status);
                      const submitLabel = product.status === 'draft'
                        ? t('Submit for Review', 'إرسال للمراجعة')
                        : t('Resubmit', 'إعادة الإرسال');
                      const hasNote = ['rejected', 'revision_required'].includes(product.status) &&
                        (product.rejection_reason || product.admin_notes);
                      const noteText  = product.rejection_reason || product.admin_notes;
                      const noteStyle = product.status === 'revision_required'
                        ? { bg: '#ede9fe', border: '#c4b5fd', color: '#5B21B6',
                            label: t('Revision notes:', 'ملاحظات التعديل:') }
                        : { bg: '#fee2e2', border: '#fca5a5', color: '#991B1B',
                            label: t('Rejection reason:', 'سبب الرفض:') };

                      return (
                        <div key={product.id} className="bg-white rounded-2xl border border-sand p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-semibold text-dark-brown text-sm truncate">
                                  {lang === 'ar' ? (product.product_name_ar || product.product_name_en) : (product.product_name_en || product.product_name_ar)}
                                </span>
                                <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${stCfg.bg} ${stCfg.text}`}>
                                  {stCfg.label}
                                </span>
                              </div>
                              <div className="text-xs text-light-brown mb-1">{catName}</div>
                              {product.buod_reference && (
                                <div className="text-xs font-mono font-bold text-gold">{product.buod_reference}</div>
                              )}
                              {hasNote && (
                                <div className="mt-2 px-3 py-2 rounded-lg text-xs border"
                                  style={{ background: noteStyle.bg, borderColor: noteStyle.border, color: noteStyle.color }}>
                                  <span className="font-semibold">{noteStyle.label} </span>{noteText}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {canEdit && (
                                <button
                                  onClick={() => handleEditProduct(product)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-sand text-medium-brown hover:bg-sand transition-colors"
                                >
                                  {t('Edit', 'تعديل')}
                                </button>
                              )}
                              {canSubmit && (
                                <button
                                  onClick={() => handleResubmit(product.id)}
                                  disabled={resubmitting === product.id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-brown text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                  {resubmitting === product.id
                                    ? <Loader2 size={12} className="animate-spin inline" />
                                    : submitLabel}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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

            {/* Upload / Edit Tab */}
            {activeTab === 'upload' && (
              <div className="max-w-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-dark-brown">
                    {editingProduct
                      ? t('Edit Product', 'تعديل المنتج')
                      : t('Upload New Product', 'رفع منتج جديد')}
                  </h2>
                  {editingProduct && (
                    <button
                      type="button"
                      className="btn-secondary text-sm px-4 py-2"
                      onClick={() => { setEditingProduct(null); setActiveTab('products'); }}
                    >
                      {t('← Cancel Edit', '← إلغاء التعديل')}
                    </button>
                  )}
                </div>
                <div className="bg-white rounded-2xl border border-sand p-6 space-y-5">

                  {/* Product names */}
                  <div>
                    <label className="block text-sm font-medium text-dark-brown mb-2">{t('Product Name (English)', 'اسم المنتج (الإنجليزية)')}</label>
                    <input
                      className="input-field"
                      placeholder="e.g. Najdi Column Capital"
                      value={uploadForm.productNameEn}
                      onChange={e => setUploadForm(f => ({ ...f, productNameEn: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-brown mb-2">{t('Product Name (Arabic)', 'اسم المنتج (العربية)')}</label>
                    <input
                      className="input-field text-right"
                      placeholder="مثال: تاج عمود نجدي"
                      dir="rtl"
                      value={uploadForm.productNameAr}
                      onChange={e => setUploadForm(f => ({ ...f, productNameAr: e.target.value }))}
                    />
                  </div>

                  {/* Category + Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-brown mb-2">{t('Category', 'الفئة')}</label>
                      <select
                        className="input-field"
                        disabled={categoriesLoading}
                        value={uploadForm.categoryId}
                        onChange={e => setUploadForm(f => ({ ...f, categoryId: e.target.value }))}
                      >
                        <option value="">
                          {categoriesLoading
                            ? t('Loading categories…', 'جارٍ تحميل التصنيفات…')
                            : `— ${t('Select', 'اختر')} —`}
                        </option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon ? `${cat.icon} ` : ''}{lang === 'ar' ? cat.name_ar : cat.name_en}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-brown mb-2">{t('Price (SAR)', 'السعر (ريال)')}</label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="0"
                        value={uploadForm.price}
                        onChange={e => setUploadForm(f => ({ ...f, price: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-dark-brown mb-2">{t('Description', 'الوصف')}</label>
                    <textarea
                      className="input-field h-24 resize-none"
                      placeholder={t('Describe your product...', 'صف منتجك...')}
                      value={uploadForm.description}
                      onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>

                  {/* ── 3D Files ─────────────────────────────────── */}
                  <div>
                    <label className="block text-sm font-medium text-dark-brown mb-2">{t('3D Files', 'ملفات ثلاثية الأبعاد')}</label>

                    {/* Hidden file input */}
                    <input
                      ref={filesInputRef}
                      type="file"
                      className="hidden"
                      accept=".dwg,.rvt,.skp,.obj,.fbx,.3ds"
                      multiple
                      onChange={handleFilesChange}
                    />

                    {/* Click target */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => filesInputRef.current?.click()}
                      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && filesInputRef.current?.click()}
                      className="border-2 border-dashed border-sand rounded-xl p-8 text-center hover:border-dark-brown transition-colors cursor-pointer select-none"
                    >
                      <Upload size={28} className="text-light-brown mx-auto mb-3" />
                      <p className="text-sm font-medium text-dark-brown mb-1">
                        {t('Drop files here or click to browse', 'اسحب الملفات هنا أو انقر للاستعراض')}
                      </p>
                      <p className="text-xs text-light-brown">{t('Supports: DWG, RVT, SKP, OBJ, FBX, 3DS', 'يدعم: DWG, RVT, SKP, OBJ, FBX, 3DS')}</p>
                    </div>

                    {/* Selected 3D files list */}
                    {selectedFiles.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {selectedFiles.map((f, i) => (
                          <li key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-warm-white border border-sand text-sm">
                            <FileText size={15} className="text-gold flex-shrink-0" />
                            <span className="flex-1 truncate text-dark-brown font-medium">
                              {f.name}<span className="text-light-brown font-normal">{fmtSize(f.size)}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              className="text-light-brown hover:text-red-500 transition-colors flex-shrink-0"
                              aria-label="Remove file"
                            >
                              <X size={15} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* ── Product Images ────────────────────────────── */}
                  <div>
                    <label className="block text-sm font-medium text-dark-brown mb-2">{t('Product Images', 'صور المنتج')}</label>

                    {/* Hidden file input */}
                    <input
                      ref={imagesInputRef}
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleImagesChange}
                    />

                    {/* Click target */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => imagesInputRef.current?.click()}
                      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && imagesInputRef.current?.click()}
                      className="border-2 border-dashed border-sand rounded-xl p-6 text-center hover:border-dark-brown transition-colors cursor-pointer select-none"
                    >
                      <ImgIcon size={26} className="text-light-brown mx-auto mb-2" />
                      <p className="text-sm font-medium text-dark-brown mb-1">
                        {t('Click to upload images', 'انقر لرفع الصور')}
                      </p>
                      <p className="text-xs text-light-brown">{t('JPG, PNG, WEBP — multiple allowed', 'JPG, PNG, WEBP — يمكن رفع أكثر من صورة')}</p>
                    </div>

                    {/* Image thumbnails */}
                    {selectedImages.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {selectedImages.map((img, i) => (
                          <div key={i} className="relative group rounded-xl overflow-hidden border border-sand aspect-square">
                            <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                            {i === 0 && (
                              <span className="absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gold text-white leading-none">
                                {t('Primary', 'رئيسية')}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove image"
                            >
                              <X size={12} />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[9px] px-1.5 py-0.5 truncate">
                              {img.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Materials */}
                  <div>
                    <label className="block text-sm font-medium text-dark-brown mb-2">{t('Materials', 'المواد')}</label>
                    <input
                      className="input-field"
                      placeholder={t('e.g. Limestone, Steel, Gypsum', 'مثال: حجر كلسي، فولاذ، جبس')}
                      value={uploadForm.materials}
                      onChange={e => setUploadForm(f => ({ ...f, materials: e.target.value }))}
                    />
                  </div>

                  {/* Progress / error / success banners */}
                  {uploadProgress && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700">
                      <Loader2 size={16} className="animate-spin flex-shrink-0" />
                      {uploadProgress}
                    </div>
                  )}
                  {uploadError && (
                    <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                      {uploadError}
                    </div>
                  )}
                  {uploadSuccess && (
                    <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700 font-semibold">
                      {uploadSuccess}
                    </div>
                  )}

                  {/* Action buttons */}
                  {editingProduct ? (
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        className="btn-primary flex-1 justify-center py-3.5"
                        disabled={uploading}
                        onClick={() => handleProductSubmit('edit')}
                      >
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : null}
                        {t('Save Changes', 'حفظ التغييرات')}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary px-6"
                        disabled={uploading}
                        onClick={() => { setEditingProduct(null); setActiveTab('products'); }}
                      >
                        {t('Cancel', 'إلغاء')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        className="btn-primary flex-1 justify-center py-3.5"
                        disabled={uploading || categoriesLoading}
                        onClick={() => handleProductSubmit('pending_review')}
                      >
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {t('Submit Product', 'إرسال المنتج')}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary px-6"
                        disabled={uploading}
                        onClick={() => handleProductSubmit('draft')}
                      >
                        {t('Save Draft', 'حفظ كمسودة')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
