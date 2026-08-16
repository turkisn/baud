import { useCallback, useEffect, useState } from 'react';
import {
  Building2, CheckCircle2, Image, Loader2, Pencil, Plus, RefreshCw, Save,
  Search, Send, Upload, X,
} from 'lucide-react';
import AdminLayout, {
  AdminEmptyState, AdminErrorState, AdminTable, Pagination, VerifyBadge,
} from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ADMIN_PAGE_SIZE, mvpAdminService } from '../../services/mvpAdminService';

const EMPTY_SUPPLIER = {
  company_name_ar: '', company_name_en: '', slug: '', commercial_name: '',
  description_ar: '', description_en: '', website: '', country: '', city: '',
  logo_path: '', cover_image_path: '', sort_order: 0, is_published: false,
  verification_status: 'unverified',
};

const nullable = (value) => value === '' ? null : value;
const validHttpUrl = (value) => {
  if (!value) return true;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); }
  catch { return false; }
};

function Field({ label, required, className = '', ...props }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-xs font-semibold text-medium-brown">{label}{required && ' *'}</span><input {...props} required={required} className="input-field bg-white"/></label>;
}

function Textarea({ label, ...props }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-medium-brown">{label}</span><textarea {...props} className="input-field min-h-32 resize-y bg-white"/></label>;
}

function SupplierEditor({ initial, onClose, onSaved, t }) {
  const [supplier, setSupplier] = useState(() => ({ ...EMPTY_SUPPLIER, ...initial }));
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const set = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSupplier((current) => ({ ...current, [field]: value }));
  };

  const payload = (isPublished = supplier.is_published) => ({
    company_name_ar: supplier.company_name_ar.trim(),
    company_name_en: supplier.company_name_en.trim(),
    slug: nullable(supplier.slug.trim()),
    commercial_name: nullable(supplier.commercial_name.trim()),
    description_ar: nullable(supplier.description_ar.trim()),
    description_en: nullable(supplier.description_en.trim()),
    website: nullable(supplier.website.trim()),
    country: nullable(supplier.country.trim()),
    city: nullable(supplier.city.trim()),
    logo_path: nullable(supplier.logo_path),
    cover_image_path: nullable(supplier.cover_image_path),
    sort_order: Number(supplier.sort_order) || 0,
    is_published: Boolean(isPublished),
    verification_status: supplier.verification_status,
  });

  const save = async (isPublished) => {
    setError(''); setSuccess('');
    if (!supplier.company_name_en.trim() || !supplier.company_name_ar.trim()) {
      setError(t('Arabic and English company names are required.', 'اسما الشركة بالعربية والإنجليزية مطلوبان.'));
      return;
    }
    if (!validHttpUrl(supplier.website)) {
      setError(t('Website must use http or https.', 'يجب أن يستخدم الموقع http أو https.'));
      return;
    }
    setSaving(isPublished ? 'publish' : 'draft');
    try {
      const saved = await mvpAdminService.saveSupplier(supplier.id, payload(isPublished));
      const supplierId = saved?.id || supplier.id;
      if (!supplierId) throw new Error('The backend did not return the saved supplier ID.');
      setSupplier((current) => ({ ...current, id: supplierId, is_published: isPublished }));
      const fresh = await mvpAdminService.getSupplier(supplierId);
      setSupplier({ ...EMPTY_SUPPLIER, ...fresh });
      setSuccess(isPublished ? t('Supplier Window published.', 'تم نشر نافذة المورد.') : t('Supplier draft saved.', 'تم حفظ مسودة المورد.'));
      onSaved(fresh);
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(''); }
  };

  const uploadAsset = async (kind) => {
    const file = kind === 'logo' ? logoFile : coverFile;
    if (!supplier.id || !file) return;
    setSaving(kind); setError(''); setSuccess('');
    let uploaded;
    try {
      uploaded = await mvpAdminService.uploadSupplierAsset(supplier.id, file);
      const field = kind === 'logo' ? 'logo_path' : 'cover_image_path';
      const next = { ...supplier, [field]: uploaded.path };
      const saved = await mvpAdminService.saveSupplier(supplier.id, {
        ...payload(supplier.is_published),
        [field]: uploaded.path,
      });
      const fresh = await mvpAdminService.getSupplier(saved?.id || supplier.id);
      setSupplier({ ...EMPTY_SUPPLIER, ...next, ...fresh });
      if (kind === 'logo') setLogoFile(null);
      else setCoverFile(null);
      setSuccess(kind === 'logo' ? t('Logo uploaded and registered.', 'تم رفع الشعار وتسجيله.') : t('Cover uploaded and registered.', 'تم رفع الغلاف وتسجيله.'));
      onSaved(fresh);
    } catch (uploadError) {
      if (uploaded) await mvpAdminService.removeUploadedObject(uploaded.bucket, uploaded.path);
      setError(uploadError.message);
    } finally { setSaving(''); }
  };

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-deep-brown/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={t('Supplier editor', 'محرر المورد')}><div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-ivory shadow-2xl"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-sand bg-white px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-wider text-gold">{supplier.id ? t('Edit Supplier Window', 'تعديل نافذة المورد') : t('New Supplier Window', 'نافذة مورد جديدة')}</p><h2 className="mt-1 text-xl font-black text-dark-brown">{supplier.company_name_en || t('Untitled supplier', 'مورد بدون عنوان')}</h2></div><button type="button" onClick={onClose} aria-label={t('Close editor', 'إغلاق المحرر')} className="admin-icon-button"><X/></button></header>
    <div className="space-y-6 p-5 sm:p-7">{error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}{success && <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700"><CheckCircle2 size={17}/>{success}</div>}
      <section className="rounded-2xl border border-sand bg-white p-5"><h3 className="mb-4 font-bold text-dark-brown">{t('Supplier data', 'بيانات المورد')}</h3><div className="grid gap-4 md:grid-cols-2"><Field label="Company name (English)" required value={supplier.company_name_en} onChange={set('company_name_en')}/><Field label="اسم الشركة (العربية)" required dir="rtl" value={supplier.company_name_ar} onChange={set('company_name_ar')}/><Field label="Slug" value={supplier.slug} onChange={set('slug')}/><Field label={t('Commercial name', 'الاسم التجاري')} value={supplier.commercial_name} onChange={set('commercial_name')}/><Textarea label="Description (English)" value={supplier.description_en} onChange={set('description_en')}/><Textarea label="الوصف (العربية)" dir="rtl" value={supplier.description_ar} onChange={set('description_ar')}/><Field label={t('Website', 'الموقع الإلكتروني')} type="url" value={supplier.website} onChange={set('website')} className="md:col-span-2"/><Field label={t('Country', 'الدولة')} value={supplier.country} onChange={set('country')}/><Field label={t('City', 'المدينة')} value={supplier.city} onChange={set('city')}/><Field label={t('Sort order', 'ترتيب العرض')} type="number" value={supplier.sort_order} onChange={set('sort_order')}/><label className="block"><span className="mb-1.5 block text-xs font-semibold text-medium-brown">{t('Verification status', 'حالة التحقق')}</span><select value={supplier.verification_status} onChange={set('verification_status')} className="input-field bg-white"><option value="unverified">{t('Unverified', 'غير موثق')}</option><option value="pending">{t('Pending', 'قيد المراجعة')}</option><option value="verified">{t('Verified', 'موثق')}</option></select></label></div></section>
      <section className="rounded-2xl border border-sand bg-white p-5"><div className="mb-4"><h3 className="font-bold text-dark-brown">{t('Private supplier assets', 'ملفات المورد الخاصة')}</h3><p className="mt-1 text-xs text-light-brown">{t('Save the supplier draft first. Logo and cover reads use short-lived signed URLs.', 'احفظ مسودة المورد أولاً. تستخدم قراءة الشعار والغلاف روابط موقعة مؤقتاً.')}</p></div><div className="grid gap-5 md:grid-cols-2"><div className="rounded-xl border border-sand bg-warm-white p-4"><div className="mb-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-white">{supplier.signed_logo_url ? <img src={supplier.signed_logo_url} alt="Supplier logo" className="h-full w-full object-contain"/> : <Image className="text-beige" size={34}/>}</div><label className="mb-2 block text-xs font-semibold text-medium-brown">{t('Logo image', 'صورة الشعار')}</label><input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => setLogoFile(event.target.files?.[0] || null)} disabled={!supplier.id || Boolean(saving)} className="block w-full text-xs text-medium-brown"/><button type="button" onClick={() => uploadAsset('logo')} disabled={!supplier.id || !logoFile || Boolean(saving)} className="admin-secondary-button mt-3">{saving === 'logo' ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} {t('Upload logo', 'رفع الشعار')}</button></div><div className="rounded-xl border border-sand bg-warm-white p-4"><div className="mb-3 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl bg-white">{supplier.signed_cover_url ? <img src={supplier.signed_cover_url} alt="Supplier cover" className="h-full w-full object-cover"/> : <Image className="text-beige" size={34}/>}</div><label className="mb-2 block text-xs font-semibold text-medium-brown">{t('Cover image', 'صورة الغلاف')}</label><input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => setCoverFile(event.target.files?.[0] || null)} disabled={!supplier.id || Boolean(saving)} className="block w-full text-xs text-medium-brown"/><button type="button" onClick={() => uploadAsset('cover')} disabled={!supplier.id || !coverFile || Boolean(saving)} className="admin-secondary-button mt-3">{saving === 'cover' ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>} {t('Upload cover', 'رفع الغلاف')}</button></div></div></section>
    </div>
    <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-sand bg-white px-5 py-4"><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${supplier.is_published ? 'bg-green-100 text-green-800' : 'bg-sand text-medium-brown'}`}>{supplier.is_published ? t('Published', 'منشور') : t('Unpublished', 'غير منشور')}</span>{supplier.verification_status && <VerifyBadge status={supplier.verification_status}/>}</div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => save(false)} disabled={Boolean(saving)} className="admin-secondary-button">{saving === 'draft' ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} {supplier.id ? t('Save / unpublish', 'حفظ / إلغاء النشر') : t('Save draft', 'حفظ كمسودة')}</button><button type="button" onClick={() => save(true)} disabled={Boolean(saving)} className="admin-primary-button">{saving === 'publish' ? <Loader2 className="animate-spin" size={14}/> : <Send size={14}/>} {t('Publish', 'نشر')}</button></div></footer>
  </div></div>;
}

export default function AdminSuppliers() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [publication, setPublication] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(null);
  const [editorLoading, setEditorLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await mvpAdminService.listSuppliers({ search: debouncedSearch, verificationStatus, publication, page });
      setItems(result.data); setCount(result.count);
    } catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }, [debouncedSearch, page, publication, verificationStatus]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [debouncedSearch, publication, verificationStatus]);

  const openSupplier = async (supplierId) => {
    if (!supplierId) { setEditor({ ...EMPTY_SUPPLIER }); return; }
    setEditorLoading(true); setError('');
    try { setEditor({ ...EMPTY_SUPPLIER, ...await mvpAdminService.getSupplier(supplierId) }); }
    catch (loadError) { setError(loadError.message); }
    finally { setEditorLoading(false); }
  };

  if (!['admin', 'super_admin'].includes(user?.role)) return <AdminLayout title={t('Access denied', 'الوصول مرفوض')}><p className="text-light-brown">{t('Strict administrator access is required.', 'مطلوب وصول مدير صارم.')}</p></AdminLayout>;

  return <AdminLayout title={t('Supplier Windows', 'نوافذ الموردين')} subtitle={`${count} ${t('database records', 'سجلات قاعدة البيانات')}`}><div className="mb-5 flex flex-wrap items-center gap-3"><div className="relative min-w-64 flex-1"><Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-light-brown"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Search supplier name or slug…', 'ابحث باسم المورد أو الرابط…')} className="input-field bg-white ps-9"/></div><select value={publication} onChange={(event) => setPublication(event.target.value)} className="input-field w-auto min-w-40 bg-white"><option value="">{t('All publication states', 'كل حالات النشر')}</option><option value="published">{t('Published', 'منشور')}</option><option value="unpublished">{t('Unpublished', 'غير منشور')}</option></select><select value={verificationStatus} onChange={(event) => setVerificationStatus(event.target.value)} className="input-field w-auto min-w-40 bg-white"><option value="">{t('All verification states', 'كل حالات التحقق')}</option><option value="verified">{t('Verified', 'موثق')}</option><option value="pending">{t('Pending', 'قيد المراجعة')}</option><option value="unverified">{t('Unverified', 'غير موثق')}</option></select><button type="button" onClick={load} className="admin-secondary-button"><RefreshCw size={14}/>{t('Refresh', 'تحديث')}</button><button type="button" onClick={() => openSupplier(null)} className="admin-primary-button"><Plus size={15}/>{t('Create Supplier Window', 'إنشاء نافذة مورد')}</button></div>
    {error && <div className="mb-4"><AdminErrorState message={error} onRetry={load}/></div>}
    {!error && !loading && items.length === 0 ? <AdminEmptyState icon={Building2} message={t('No Supplier Windows match these filters.', 'لا توجد نوافذ موردين تطابق هذه المرشحات.')}/> : <AdminTable loading={loading} headers={[t('Supplier', 'المورد'), t('Location', 'الموقع'), t('Publication', 'النشر'), t('Verification', 'التحقق'), t('Updated', 'التحديث'), t('Action', 'الإجراء')]}>{items.map((supplier) => <tr key={supplier.id} className="hover:bg-warm-white"><td className="px-4 py-3"><p className="font-semibold text-dark-brown">{supplier.company_name_en}</p><p className="text-xs text-light-brown">{supplier.company_name_ar}</p><p className="mt-1 font-mono text-[10px] text-gold">{supplier.slug || '—'}</p></td><td className="px-4 py-3 text-xs text-medium-brown">{[supplier.city, supplier.country].filter(Boolean).join(', ') || '—'}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${supplier.is_published ? 'bg-green-100 text-green-800' : 'bg-sand text-medium-brown'}`}>{supplier.is_published ? t('Published', 'منشور') : t('Unpublished', 'غير منشور')}</span></td><td className="px-4 py-3"><VerifyBadge status={supplier.verification_status}/></td><td className="px-4 py-3 text-xs text-light-brown">{supplier.updated_at ? new Date(supplier.updated_at).toLocaleDateString() : '—'}</td><td className="px-4 py-3"><button type="button" onClick={() => openSupplier(supplier.id)} className="admin-secondary-button"><Pencil size={13}/>{t('Edit', 'تعديل')}</button></td></tr>)}</AdminTable>}
    <Pagination page={page} totalPages={Math.ceil(count / ADMIN_PAGE_SIZE)} onPage={setPage}/>
    {editorLoading && <div className="fixed inset-0 z-50 grid place-items-center bg-deep-brown/70"><Loader2 className="animate-spin text-gold" size={36}/></div>}{editor && <SupplierEditor key={editor.id || 'new'} initial={editor} onClose={() => setEditor(null)} onSaved={() => load()} t={t}/>}
  </AdminLayout>;
}
