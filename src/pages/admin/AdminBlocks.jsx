import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive, ArrowDown, ArrowUp, Box, CheckCircle2, FileBox, Image, Loader2,
  Pencil, Plus, RefreshCw, Save, Search, Send, Trash2, Upload, X,
} from 'lucide-react';
import AdminLayout, {
  AdminEmptyState, AdminErrorState, AdminTable, Pagination,
} from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  ADMIN_PAGE_SIZE, mvpAdminService, PRODUCT_FILE_FORMATS, SPECIFICATION_DATA_TYPES,
} from '../../services/mvpAdminService';

const EMPTY_PRODUCT = {
  product_name_ar: '', product_name_en: '', slug: '', category_id: '', subcategory_id: '',
  supplier_id: '', brand_name: '', model_number: '', country_of_origin: '', unit: '',
  short_description_ar: '', short_description_en: '', full_description_ar: '',
  full_description_en: '', price: '', currency: 'SAR', supplier_product_url: '', source_url: '',
  is_featured: false, sort_order: 0, rights_confirmed: false, publication_state: 'draft',
  specifications: [], images: [], files: [],
};

const nullable = (value) => value === '' ? null : value;
const BLOCK_FILE_ACCEPT = PRODUCT_FILE_FORMATS.map((format) => `.${format.toLowerCase()}`).join(',');
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const validHttpUrl = (value) => {
  if (!value) return true;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

function productEditorState(record = {}) {
  return {
    ...EMPTY_PRODUCT,
    ...record,
    price: record.price ?? '',
    specifications: (record.specifications || []).map((item) => ({
      ...item,
      data_type: SPECIFICATION_DATA_TYPES.includes(item.data_type) ? item.data_type : 'text',
    })),
  };
}

function Field({ label, required, className = '', ...props }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-xs font-semibold text-medium-brown">{label}{required && ' *'}</span><input {...props} required={required} className="input-field bg-white"/></label>;
}

function Textarea({ label, className = '', ...props }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-xs font-semibold text-medium-brown">{label}</span><textarea {...props} className="input-field min-h-28 resize-y bg-white"/></label>;
}

function SelectField({ label, required, children, className = '', ...props }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-xs font-semibold text-medium-brown">{label}{required && ' *'}</span><select {...props} required={required} className="input-field bg-white">{children}</select></label>;
}

function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-sand text-medium-brown',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-200 text-gray-700',
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.draft}`}>{status || 'draft'}</span>;
}

function SpecificationsEditor({ items, onChange, disabled, t }) {
  const add = () => {
    if (items.length >= 100) return;
    onChange([...items, {
      specification_name_ar: '', specification_name_en: '', specification_code: '',
      value: '', unit: '', data_type: 'text',
    }]);
  };
  const update = (index, field, value) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  const move = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  };

  return <section className="rounded-2xl border border-sand bg-white p-5"><div className="mb-4 flex items-center justify-between gap-4"><div><h3 className="font-bold text-dark-brown">{t('Structured specifications', 'المواصفات المنظمة')}</h3><p className="mt-1 text-xs text-light-brown">{items.length}/100</p></div><button type="button" onClick={add} disabled={disabled || items.length >= 100} className="admin-secondary-button"><Plus size={14}/>{t('Add row', 'إضافة صف')}</button></div>
    {items.length === 0 ? <p className="rounded-xl border border-dashed border-sand p-6 text-center text-sm text-light-brown">{t('No specifications added.', 'لم تتم إضافة مواصفات.')}</p> : <div className="space-y-3">{items.map((item, index) => <div key={item.id || index} className="grid gap-2 rounded-xl border border-sand bg-warm-white p-3 sm:grid-cols-2 lg:grid-cols-6">
      <input aria-label="Specification name English" value={item.specification_name_en || ''} onChange={(event) => update(index, 'specification_name_en', event.target.value)} placeholder="Name EN" className="input-field bg-white" disabled={disabled}/>
      <input aria-label="Specification name Arabic" value={item.specification_name_ar || ''} onChange={(event) => update(index, 'specification_name_ar', event.target.value)} placeholder="الاسم AR" className="input-field bg-white" disabled={disabled}/>
      <input aria-label="Specification code" value={item.specification_code || ''} onChange={(event) => update(index, 'specification_code', event.target.value)} placeholder="Code" className="input-field bg-white" disabled={disabled}/>
      <input aria-label="Specification value" value={item.value || ''} onChange={(event) => update(index, 'value', event.target.value)} placeholder="Value" className="input-field bg-white" disabled={disabled}/>
      <div className="grid grid-cols-2 gap-2"><input aria-label="Specification unit" value={item.unit || ''} onChange={(event) => update(index, 'unit', event.target.value)} placeholder="Unit" className="input-field bg-white" disabled={disabled}/><select aria-label="Specification data type" value={item.data_type || 'text'} onChange={(event) => update(index, 'data_type', event.target.value)} className="input-field bg-white" disabled={disabled}>{SPECIFICATION_DATA_TYPES.map((dataType) => <option key={dataType} value={dataType}>{dataType}</option>)}</select></div>
      <div className="flex items-center justify-end gap-1"><button type="button" aria-label="Move specification up" onClick={() => move(index, -1)} disabled={disabled || index === 0} className="admin-icon-button"><ArrowUp size={14}/></button><button type="button" aria-label="Move specification down" onClick={() => move(index, 1)} disabled={disabled || index === items.length - 1} className="admin-icon-button"><ArrowDown size={14}/></button><button type="button" aria-label="Remove specification" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} disabled={disabled} className="admin-icon-button text-red-600"><Trash2 size={14}/></button></div>
    </div>)}</div>}
  </section>;
}

function ProductAssets({ product, onRefresh, disabled, t }) {
  const [imageFile, setImageFile] = useState(null);
  const [imageMeta, setImageMeta] = useState({ image_type: 'render', alt_text_ar: '', alt_text_en: '', sort_order: 0, is_primary: false });
  const [assetFile, setAssetFile] = useState(null);
  const [fileMeta, setFileMeta] = useState({ file_type: 'block', file_format: 'RFA', software_name: '', software_version: '', is_primary: false });
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const uploadImage = async (event) => {
    event.preventDefault();
    if (!imageFile) return;
    setUploading('image'); setError(''); setSuccess('');
    try {
      await mvpAdminService.uploadProductImage(product.id, imageFile, imageMeta);
      setImageFile(null);
      setSuccess(t('Image uploaded and registered.', 'تم رفع الصورة وتسجيلها.'));
      await onRefresh();
    } catch (uploadError) { setError(uploadError.message); }
    finally { setUploading(''); }
  };

  const uploadFile = async (event) => {
    event.preventDefault();
    if (!assetFile) return;
    setUploading('file'); setError(''); setSuccess('');
    try {
      await mvpAdminService.uploadProductFile(product.id, assetFile, fileMeta);
      setAssetFile(null);
      setSuccess(t('File uploaded and registered.', 'تم رفع الملف وتسجيله.'));
      await onRefresh();
    } catch (uploadError) { setError(uploadError.message); }
    finally { setUploading(''); }
  };

  if (!product.id) return <section className="rounded-2xl border border-dashed border-beige bg-white p-8 text-center text-sm text-light-brown">{t('Save the product as a draft before uploading images or files.', 'احفظ المنتج كمسودة قبل رفع الصور أو الملفات.')}</section>;

  return <section className="space-y-5 rounded-2xl border border-sand bg-white p-5"><div><h3 className="font-bold text-dark-brown">{t('Private product assets', 'ملفات المنتج الخاصة')}</h3><p className="mt-1 text-xs text-light-brown">{t('Uploads use private buckets. Public visitors only receive short-lived signed image reads and safe file metadata.', 'تستخدم عمليات الرفع حاويات خاصة. يحصل الزوار فقط على صور موقعة مؤقتاً وبيانات ملفات آمنة.')}</p></div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}{success && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}
    <div className="grid gap-5 xl:grid-cols-2">
      <form onSubmit={uploadImage} className="space-y-3 rounded-xl border border-sand bg-warm-white p-4"><div className="flex items-center gap-2 font-semibold text-dark-brown"><Image size={17} className="text-gold"/>{t('Product image', 'صورة المنتج')}</div><input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] || null)} disabled={disabled || uploading} className="block w-full text-xs text-medium-brown"/><div className="grid gap-2 sm:grid-cols-2"><input value={imageMeta.alt_text_en} onChange={(event) => setImageMeta((meta) => ({ ...meta, alt_text_en: event.target.value }))} placeholder="Alt text EN" className="input-field bg-white"/><input value={imageMeta.alt_text_ar} onChange={(event) => setImageMeta((meta) => ({ ...meta, alt_text_ar: event.target.value }))} placeholder="النص البديل AR" className="input-field bg-white"/><select value={imageMeta.image_type} onChange={(event) => setImageMeta((meta) => ({ ...meta, image_type: event.target.value }))} className="input-field bg-white"><option value="render">Render</option><option value="dimension">Dimension</option><option value="material">Material</option><option value="catalogue">Catalogue</option><option value="lifestyle">Lifestyle</option><option value="other">Other</option></select><input type="number" value={imageMeta.sort_order} onChange={(event) => setImageMeta((meta) => ({ ...meta, sort_order: event.target.value }))} placeholder="Sort order" className="input-field bg-white"/></div><label className="flex items-center gap-2 text-xs text-medium-brown"><input type="checkbox" checked={imageMeta.is_primary} onChange={(event) => setImageMeta((meta) => ({ ...meta, is_primary: event.target.checked }))}/>{t('Register as primary image', 'تسجيل كصورة رئيسية')}</label><button type="submit" disabled={!imageFile || disabled || uploading} className="admin-primary-button">{uploading === 'image' ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} {t('Upload image', 'رفع الصورة')}</button></form>
      <form onSubmit={uploadFile} className="space-y-3 rounded-xl border border-sand bg-warm-white p-4"><div className="flex items-center gap-2 font-semibold text-dark-brown"><FileBox size={17} className="text-gold"/>{t('BIM / 3D or datasheet', 'ملف BIM / 3D أو ورقة بيانات')}</div><select value={fileMeta.file_type} onChange={(event) => { setAssetFile(null); setFileMeta((meta) => ({ ...meta, file_type: event.target.value })); }} className="input-field bg-white"><option value="block">BIM / 3D block</option><option value="datasheet">Datasheet PDF</option></select><input key={fileMeta.file_type} type="file" accept={fileMeta.file_type === 'datasheet' ? '.pdf,application/pdf' : BLOCK_FILE_ACCEPT} onChange={(event) => { const file = event.target.files?.[0] || null; setAssetFile(file); if (file && fileMeta.file_type === 'block') { const format = file.name.split('.').pop()?.toUpperCase(); if (PRODUCT_FILE_FORMATS.includes(format)) setFileMeta((meta) => ({ ...meta, file_format: format })); } }} disabled={disabled || uploading} className="block w-full text-xs text-medium-brown"/><p className="text-[11px] leading-5 text-light-brown">{fileMeta.file_type === 'datasheet' ? t('PDF only, up to 20 MB.', 'PDF فقط، بحد أقصى 20 ميجابايت.') : t(`${PRODUCT_FILE_FORMATS.join(', ')} · up to 100 MB.`, `${PRODUCT_FILE_FORMATS.join('، ')} · بحد أقصى 100 ميجابايت.`)}</p>{fileMeta.file_type === 'block' && <div className="grid gap-2 sm:grid-cols-3"><select value={fileMeta.file_format} onChange={(event) => setFileMeta((meta) => ({ ...meta, file_format: event.target.value }))} className="input-field bg-white">{PRODUCT_FILE_FORMATS.map((format) => <option key={format}>{format}</option>)}</select><input value={fileMeta.software_name} onChange={(event) => setFileMeta((meta) => ({ ...meta, software_name: event.target.value }))} placeholder="Software" className="input-field bg-white"/><input value={fileMeta.software_version} onChange={(event) => setFileMeta((meta) => ({ ...meta, software_version: event.target.value }))} placeholder="Version" className="input-field bg-white"/></div>}<label className="flex items-center gap-2 text-xs text-medium-brown"><input type="checkbox" checked={fileMeta.is_primary} onChange={(event) => setFileMeta((meta) => ({ ...meta, is_primary: event.target.checked }))}/>{t('Register as primary file', 'تسجيل كملف رئيسي')}</label><button type="submit" disabled={!assetFile || disabled || uploading} className="admin-primary-button">{uploading === 'file' ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} {t('Upload file', 'رفع الملف')}</button></form>
    </div>
    <div className="grid gap-5 xl:grid-cols-2"><div><h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-medium-brown">{t('Registered images', 'الصور المسجلة')}</h4>{product.images?.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{product.images.map((image) => <div key={image.id} className="overflow-hidden rounded-xl border border-sand bg-warm-white"><div className="flex aspect-square items-center justify-center bg-sand/30">{image.signed_url ? <img src={image.signed_url} alt={image.alt_text_en || image.alt_text_ar || ''} className="h-full w-full object-cover"/> : <span className="px-2 text-center text-xs text-red-600">{t('Unavailable / signing failed', 'غير متاحة / فشل التوقيع')}</span>}</div><div className="p-2 text-[11px] text-medium-brown">{image.image_type}{image.is_primary ? ` · ${t('Primary', 'رئيسية')}` : ''}</div></div>)}</div> : <p className="text-sm text-light-brown">{t('No images registered.', 'لا توجد صور مسجلة.')}</p>}</div><div><h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-medium-brown">{t('Registered files', 'الملفات المسجلة')}</h4>{product.files?.length ? <div className="space-y-2">{product.files.map((file) => <div key={file.id} className="rounded-xl border border-sand bg-warm-white p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="min-w-0 truncate font-semibold text-dark-brown">{file.original_file_name || file.file_format}</span><span className={`shrink-0 text-xs ${file.is_available === false ? 'text-red-600' : 'text-green-700'}`}>{file.is_available === false ? t('Unavailable', 'غير متاح') : t('Available', 'متاح')}</span></div><p className="mt-1 text-xs text-light-brown">{[file.file_type, file.file_format, file.software_name, file.software_version].filter(Boolean).join(' · ')}</p></div>)}</div> : <p className="text-sm text-light-brown">{t('No files registered.', 'لا توجد ملفات مسجلة.')}</p>}</div></div>
  </section>;
}

function ProductEditor({ initial, categories, supplierOptions, onClose, onSaved, t }) {
  const [product, setProduct] = useState(() => productEditorState(initial));
  const [subcategories, setSubcategories] = useState([]);
  const [supplierQuery, setSupplierQuery] = useState('');
  const [availableSuppliers, setAvailableSuppliers] = useState(supplierOptions);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    if (!product.category_id) { setSubcategories([]); return () => { active = false; }; }
    mvpAdminService.listSubcategories(product.category_id).then((rows) => { if (active) setSubcategories(rows); }).catch(() => { if (active) setSubcategories([]); });
    return () => { active = false; };
  }, [product.category_id]);

  useEffect(() => {
    if (!supplierQuery.trim()) {
      setAvailableSuppliers(supplierOptions);
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      mvpAdminService.searchSupplierOptions(supplierQuery).then((rows) => {
        if (active) setAvailableSuppliers(rows);
      }).catch(() => { if (active) setAvailableSuppliers([]); });
    }, 350);
    return () => { active = false; window.clearTimeout(timer); };
  }, [supplierOptions, supplierQuery]);

  const set = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setProduct((current) => ({ ...current, [field]: value }));
  };

  const refresh = async () => {
    if (!product.id) return;
    const fresh = await mvpAdminService.getProduct(product.id);
    setProduct((current) => ({
      ...current,
      images: fresh.images || [],
      files: fresh.files || [],
      updated_at: fresh.updated_at,
    }));
    onSaved(fresh);
  };

  const save = async (publicationState) => {
    setError(''); setSuccess('');
    if (!product.product_name_en.trim() || !product.product_name_ar.trim()) {
      setError(t('Arabic and English product names are required.', 'اسما المنتج بالعربية والإنجليزية مطلوبان.'));
      return;
    }
    if (publicationState === 'published' && (!product.category_id || !product.supplier_id)) {
      setError(t('Category and supplier are required before publishing.', 'الفئة والمورد مطلوبان قبل النشر.'));
      return;
    }
    if (!validHttpUrl(product.supplier_product_url) || !validHttpUrl(product.source_url)) {
      setError(t('Supplier and source links must use http or https.', 'يجب أن تستخدم روابط المورد والمصدر http أو https.'));
      return;
    }
    if (product.price !== '' && (!Number.isFinite(Number(product.price)) || Number(product.price) < 0)) {
      setError(t('Product price must be a valid non-negative number.', 'يجب أن يكون سعر المنتج رقماً صحيحاً غير سالب.'));
      return;
    }
    const normalizedCurrency = product.currency.trim().toUpperCase();
    if (normalizedCurrency && !CURRENCY_PATTERN.test(normalizedCurrency)) {
      setError(t('Currency must be a three-letter code such as SAR or USD.', 'يجب أن تكون العملة رمزاً من ثلاثة أحرف مثل SAR أو USD.'));
      return;
    }
    if ((product.specifications || []).some((item) => !SPECIFICATION_DATA_TYPES.includes(item.data_type))) {
      setError(t('Choose a valid data type for every specification.', 'اختر نوع بيانات صالحاً لكل مواصفة.'));
      return;
    }
    setSaving(publicationState);
    try {
      const saved = await mvpAdminService.saveProduct(product.id, {
        product_name_ar: product.product_name_ar.trim(),
        product_name_en: product.product_name_en.trim(),
        slug: nullable(product.slug.trim()),
        category_id: nullable(product.category_id),
        subcategory_id: nullable(product.subcategory_id),
        supplier_id: nullable(product.supplier_id),
        brand_name: nullable(product.brand_name.trim()),
        model_number: nullable(product.model_number.trim()),
        country_of_origin: nullable(product.country_of_origin.trim()),
        unit: nullable(product.unit.trim()),
        short_description_ar: nullable(product.short_description_ar.trim()),
        short_description_en: nullable(product.short_description_en.trim()),
        full_description_ar: nullable(product.full_description_ar.trim()),
        full_description_en: nullable(product.full_description_en.trim()),
        price: product.price === '' ? null : Number(product.price),
        currency: nullable(normalizedCurrency),
        supplier_product_url: nullable(product.supplier_product_url.trim()),
        source_url: nullable(product.source_url.trim()),
        is_featured: Boolean(product.is_featured),
        sort_order: Number(product.sort_order) || 0,
        rights_confirmed: Boolean(product.rights_confirmed),
        publication_state: publicationState,
      });
      const productId = saved?.id || product.id;
      if (!productId) throw new Error('The backend did not return the saved product ID.');
      setProduct((current) => ({ ...current, id: productId }));
      await mvpAdminService.replaceSpecifications(productId, product.specifications || []);
      const fresh = await mvpAdminService.getProduct(productId);
      setProduct(productEditorState(fresh));
      setSuccess(t('Product and specifications saved.', 'تم حفظ المنتج والمواصفات.'));
      onSaved(fresh);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving('');
    }
  };

  const categoryOptions = useMemo(() => categories.filter((category) => category.is_active !== false || category.id === product.category_id), [categories, product.category_id]);
  const supplierChoices = useMemo(() => {
    const choices = [...availableSuppliers];
    if (product.supplier_id && !choices.some((supplier) => supplier.id === product.supplier_id)) {
      choices.unshift({ id: product.supplier_id, company_name_en: 'Current supplier', company_name_ar: 'المورد الحالي' });
    }
    return choices;
  }, [availableSuppliers, product.supplier_id]);

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-deep-brown/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={t('Block editor', 'محرر البلوك')}><div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-ivory shadow-2xl"><header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-sand bg-white px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-wider text-gold">{product.id ? t('Edit block', 'تعديل البلوك') : t('New block', 'بلوك جديد')}</p><h2 className="mt-1 text-xl font-black text-dark-brown">{product.product_name_en || t('Untitled product', 'منتج بدون عنوان')}</h2>{product.buod_reference && <p className="mt-1 font-mono text-xs text-light-brown">{product.buod_reference}</p>}</div><button type="button" onClick={onClose} aria-label={t('Close editor', 'إغلاق المحرر')} className="admin-icon-button"><X/></button></header>
    <div className="space-y-6 p-5 sm:p-7">{error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}{success && <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700"><CheckCircle2 size={17}/>{success}</div>}
      <section className="rounded-2xl border border-sand bg-white p-5"><h3 className="mb-4 font-bold text-dark-brown">{t('Identity and classification', 'الهوية والتصنيف')}</h3><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Field label="Product name (English)" required value={product.product_name_en} onChange={set('product_name_en')}/><Field label="اسم المنتج (العربية)" required dir="rtl" value={product.product_name_ar} onChange={set('product_name_ar')}/><Field label="Slug" value={product.slug} onChange={set('slug')}/><Field label={t('Brand', 'العلامة التجارية')} value={product.brand_name} onChange={set('brand_name')}/><SelectField label={t('Category', 'الفئة')} required={product.publication_state === 'published'} value={product.category_id} onChange={(event) => setProduct((current) => ({ ...current, category_id: event.target.value, subcategory_id: '' }))}><option value="">{t('Select category', 'اختر الفئة')}</option>{categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name_en} · {category.name_ar}</option>)}</SelectField><SelectField label={t('Subcategory', 'الفئة الفرعية')} value={product.subcategory_id} onChange={set('subcategory_id')} disabled={!product.category_id}><option value="">{t('No subcategory', 'بدون فئة فرعية')}</option>{subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name_en} · {subcategory.name_ar}</option>)}</SelectField><Field label={t('Find supplier', 'ابحث عن مورد')} value={supplierQuery} onChange={(event) => setSupplierQuery(event.target.value)}/><SelectField label={t('Supplier', 'المورد')} required={product.publication_state === 'published'} value={product.supplier_id} onChange={set('supplier_id')}><option value="">{t('Select supplier', 'اختر المورد')}</option>{supplierChoices.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.company_name_en} · {supplier.company_name_ar}</option>)}</SelectField><Field label={t('Model number', 'رقم الطراز')} value={product.model_number} onChange={set('model_number')}/><Field label={t('Country of origin', 'بلد المنشأ')} value={product.country_of_origin} onChange={set('country_of_origin')}/><Field label={t('Unit', 'الوحدة')} value={product.unit} onChange={set('unit')}/></div></section>
      <section className="rounded-2xl border border-sand bg-white p-5"><h3 className="mb-4 font-bold text-dark-brown">{t('Descriptions', 'الأوصاف')}</h3><div className="grid gap-4 md:grid-cols-2"><Textarea label="Short description (English)" value={product.short_description_en} onChange={set('short_description_en')}/><Textarea label="الوصف المختصر (العربية)" dir="rtl" value={product.short_description_ar} onChange={set('short_description_ar')}/><Textarea label="Full description (English)" value={product.full_description_en} onChange={set('full_description_en')}/><Textarea label="الوصف الكامل (العربية)" dir="rtl" value={product.full_description_ar} onChange={set('full_description_ar')}/></div></section>
      <section className="rounded-2xl border border-sand bg-white p-5"><h3 className="mb-4 font-bold text-dark-brown">{t('Commercial and display data', 'البيانات التجارية والعرض')}</h3><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Field label={t('Product price', 'سعر المنتج')} type="number" min="0" step="0.01" value={product.price} onChange={set('price')}/><Field label={t('Currency', 'العملة')} value={product.currency} maxLength={3} pattern="[A-Za-z]{3}" placeholder="SAR" onChange={(event) => setProduct((current) => ({ ...current, currency: event.target.value.toUpperCase().slice(0, 3) }))}/><Field label={t('Supplier product URL', 'رابط المنتج لدى المورد')} type="url" value={product.supplier_product_url} onChange={set('supplier_product_url')} className="xl:col-span-2"/><Field label={t('Source URL', 'رابط المصدر')} type="url" value={product.source_url} onChange={set('source_url')} className="xl:col-span-2"/><Field label={t('Sort order', 'ترتيب العرض')} type="number" value={product.sort_order} onChange={set('sort_order')}/><label className="flex items-end gap-2 pb-3 text-sm font-medium text-medium-brown"><input type="checkbox" checked={Boolean(product.is_featured)} onChange={set('is_featured')}/>{t('Featured product', 'منتج مميز')}</label></div><div className="mt-5 rounded-xl border border-gold/30 bg-gold/5 p-4"><label className="flex items-start gap-3 text-sm font-semibold text-dark-brown"><input type="checkbox" className="mt-1" checked={Boolean(product.rights_confirmed)} onChange={set('rights_confirmed')}/><span>{t('Rights are confirmed for this product data and its uploaded assets.', 'تم تأكيد حقوق بيانات هذا المنتج وملفاته المرفوعة.')}</span></label></div></section>
      <SpecificationsEditor items={product.specifications || []} onChange={(items) => setProduct((current) => ({ ...current, specifications: items }))} disabled={Boolean(saving)} t={t}/>
      <ProductAssets product={product} onRefresh={refresh} disabled={Boolean(saving)} t={t}/>
    </div>
    <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-sand bg-white px-5 py-4"><div className="flex items-center gap-2"><StatusBadge status={product.publication_state}/>{product.updated_at && <span className="text-xs text-light-brown">{t('Updated', 'آخر تحديث')} {new Date(product.updated_at).toLocaleString()}</span>}</div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => save('draft')} disabled={Boolean(saving)} className="admin-secondary-button">{saving === 'draft' ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} {t('Save draft', 'حفظ كمسودة')}</button><button type="button" onClick={() => save('archived')} disabled={Boolean(saving) || !product.id} className="admin-secondary-button text-red-700"><Archive size={14}/>{t('Archive', 'أرشفة')}</button><button type="button" onClick={() => save('published')} disabled={Boolean(saving)} className="admin-primary-button">{saving === 'published' ? <Loader2 className="animate-spin" size={14}/> : <Send size={14}/>} {t('Publish', 'نشر')}</button></div></footer>
  </div></div>;
}

export default function AdminBlocks() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [publicationState, setPublicationState] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [supplierLabels, setSupplierLabels] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(null);
  const [editorLoading, setEditorLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    mvpAdminService.listCategories().then(setCategories).catch((loadError) => setError(loadError.message));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      mvpAdminService.searchSupplierOptions(supplierSearch).then(setSupplierOptions).catch(() => setSupplierOptions([]));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [supplierSearch]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await mvpAdminService.listProducts({
        search: debouncedSearch, publicationState, categoryId, supplierId, page,
      });
      setItems(result.data);
      setCount(result.count);
      const labels = await mvpAdminService.getSupplierLabels(result.data.map((item) => item.supplier_id));
      setSupplierLabels(Object.fromEntries(labels.map((supplier) => [supplier.id, supplier])));
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }, [categoryId, debouncedSearch, page, publicationState, supplierId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [debouncedSearch, publicationState, categoryId, supplierId]);

  const openProduct = async (productId) => {
    if (!productId) { setEditor({ ...EMPTY_PRODUCT }); return; }
    setEditorLoading(true); setError('');
    try {
      const product = await mvpAdminService.getProduct(productId);
      if (product.supplier_id) {
        const labels = await mvpAdminService.getSupplierLabels([product.supplier_id]);
        setSupplierOptions((current) => [...labels, ...current.filter((supplier) => !labels.some((label) => label.id === supplier.id))]);
      }
      setEditor({ ...EMPTY_PRODUCT, ...product, price: product.price ?? '' });
    } catch (loadError) { setError(loadError.message); }
    finally { setEditorLoading(false); }
  };

  const categoryLabels = useMemo(() => Object.fromEntries(categories.map((category) => [category.id, category])), [categories]);

  if (!['admin', 'super_admin'].includes(user?.role)) return <AdminLayout title={t('Access denied', 'الوصول مرفوض')}><p className="text-light-brown">{t('Strict administrator access is required.', 'مطلوب وصول مدير صارم.')}</p></AdminLayout>;

  return <AdminLayout title={t('Blocks', 'البلوكات')} subtitle={`${count} ${t('database records', 'سجلات قاعدة البيانات')}`}><div className="mb-5 flex flex-wrap items-center gap-3"><div className="relative min-w-64 flex-1"><Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-light-brown"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Search name, slug or BUOD reference…', 'ابحث بالاسم أو الرابط أو مرجع BUOD…')} className="input-field bg-white ps-9"/></div><select value={publicationState} onChange={(event) => setPublicationState(event.target.value)} className="input-field w-auto min-w-36 bg-white"><option value="">{t('All states', 'كل الحالات')}</option><option value="draft">{t('Draft', 'مسودة')}</option><option value="published">{t('Published', 'منشور')}</option><option value="archived">{t('Archived', 'مؤرشف')}</option></select><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="input-field w-auto min-w-44 bg-white"><option value="">{t('All categories', 'كل الفئات')}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name_en} · {category.name_ar}</option>)}</select><input value={supplierSearch} onChange={(event) => setSupplierSearch(event.target.value)} placeholder={t('Find supplier…', 'ابحث عن مورد…')} className="input-field w-40 bg-white"/><select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="input-field w-auto max-w-56 bg-white"><option value="">{t('All suppliers', 'كل الموردين')}</option>{supplierOptions.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.company_name_en} · {supplier.company_name_ar}</option>)}</select><button type="button" onClick={load} className="admin-secondary-button"><RefreshCw size={14}/>{t('Refresh', 'تحديث')}</button><button type="button" onClick={() => openProduct(null)} className="admin-primary-button"><Plus size={15}/>{t('Create block', 'إنشاء بلوك')}</button></div>
    {error && <div className="mb-4"><AdminErrorState message={error} onRetry={load}/></div>}
    {!error && !loading && items.length === 0 ? <AdminEmptyState icon={Box} message={t('No blocks match these filters.', 'لا توجد بلوكات تطابق هذه المرشحات.')}/> : <AdminTable loading={loading} headers={[t('Product', 'المنتج'), t('Supplier', 'المورد'), t('Category', 'الفئة'), t('State', 'الحالة'), t('Rights', 'الحقوق'), t('Updated', 'التحديث'), t('Action', 'الإجراء')]}>{items.map((item) => { const supplier = supplierLabels[item.supplier_id]; const category = categoryLabels[item.category_id]; return <tr key={item.id} className="hover:bg-warm-white"><td className="px-4 py-3"><p className="font-semibold text-dark-brown">{item.product_name_en}</p><p className="text-xs text-light-brown">{item.product_name_ar}</p>{item.buod_reference && <p className="mt-1 font-mono text-[10px] text-gold">{item.buod_reference}</p>}</td><td className="px-4 py-3 text-xs text-medium-brown">{supplier ? `${supplier.company_name_en} · ${supplier.company_name_ar}` : '—'}</td><td className="px-4 py-3 text-xs text-medium-brown">{category ? `${category.name_en} · ${category.name_ar}` : '—'}</td><td className="px-4 py-3"><StatusBadge status={item.publication_state}/></td><td className="px-4 py-3 text-xs">{item.rights_confirmed ? <span className="text-green-700">{t('Confirmed', 'مؤكدة')}</span> : <span className="text-amber-700">{t('Pending', 'غير مؤكدة')}</span>}</td><td className="px-4 py-3 text-xs text-light-brown">{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—'}</td><td className="px-4 py-3"><button type="button" onClick={() => openProduct(item.id)} className="admin-secondary-button"><Pencil size={13}/>{t('Edit', 'تعديل')}</button></td></tr>; })}</AdminTable>}
    <Pagination page={page} totalPages={Math.ceil(count / ADMIN_PAGE_SIZE)} onPage={setPage}/>
    {editorLoading && <div className="fixed inset-0 z-50 grid place-items-center bg-deep-brown/70"><Loader2 className="animate-spin text-gold" size={36}/></div>}{editor && <ProductEditor key={editor.id || 'new'} initial={editor} categories={categories} supplierOptions={supplierOptions} onClose={() => setEditor(null)} onSaved={() => load()} t={t}/>}
  </AdminLayout>;
}
