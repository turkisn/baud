import { useState, useEffect, useCallback } from 'react';
import { Store, Search, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { supplierAdminService } from '../../services/adminService';
import { SUPABASE_CONFIGURED } from '../../lib/supabase';
import AdminLayout, {
  AdminTable, AdminEmptyState, AdminErrorState, Pagination, VerifyBadge,
} from '../../components/admin/AdminLayout';

const PAGE_SIZE = 25;

function VerifyActions({ supplier, callerRole, onChanged }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);

  if (!['admin', 'super_admin'].includes(callerRole)) return null;

  const set = async (status) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await supplierAdminService.verify(supplier.id, status);
      setSuccess(status);
      onChanged(supplier.id, status);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const BTN = [
    { status: 'verified',   icon: CheckCircle, bg: '#d1fae5', color: '#065f46', label: 'Verify'   },
    { status: 'pending',    icon: Clock,       bg: '#fef3c7', color: '#92400e', label: 'Pending'  },
    { status: 'unverified', icon: XCircle,     bg: '#fee2e2', color: '#991b1b', label: 'Unverify' },
  ].filter(b => b.status !== supplier.verification_status);

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1">
        {BTN.map(b => (
          <button
            key={b.status}
            disabled={loading}
            onClick={() => set(b.status)}
            title={b.label}
            className="p-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: b.bg, color: b.color }}
          >
            <b.icon size={13} />
          </button>
        ))}
      </div>
      {error && <p className="text-[10px] text-red-600 max-w-[180px]">{error}</p>}
      {success && <p className="text-[10px] text-green-600">Updated to {success}</p>}
    </div>
  );
}

export default function AdminSuppliers() {
  const { t }              = useLanguage();
  const { user: me }       = useAuth();
  const [items, setItems]  = useState([]);
  const [count, setCount]  = useState(0);
  const [loading, setL]    = useState(true);
  const [error, setErr]    = useState(null);
  const [page, setPage]    = useState(0);
  const [search, setSrch]  = useState('');
  const [vsFilter, setVsF] = useState('');

  const load = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) { setL(false); return; }
    setL(true); setErr(null);
    try {
      const { data, count: c } = await supplierAdminService.list({
        search, verificationStatus: vsFilter || null, page,
      });
      setItems(data);
      setCount(c);
    } catch (e) {
      setErr(e.message);
    } finally {
      setL(false);
    }
  }, [search, vsFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [search, vsFilter]);

  const handleChanged = (id, newStatus) => {
    setItems(prev => prev.map(s => s.id === id ? { ...s, verification_status: newStatus } : s));
  };

  if (!['admin', 'super_admin'].includes(me?.role)) {
    return (
      <AdminLayout title="Access Denied">
        <p className="text-light-brown">{t('Admin access required.', 'مطلوب صلاحية مدير.')}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={t('Suppliers', 'الموردون')}
      subtitle={`${count} ${t('total', 'إجمالي')}`}
    >
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 left-3 text-light-brown" />
          <input
            value={search}
            onChange={e => setSrch(e.target.value)}
            placeholder={t('Search name or email…', 'بحث بالاسم أو البريد…')}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-dark-brown transition-colors bg-white"
          />
        </div>
        <select
          value={vsFilter}
          onChange={e => setVsF(e.target.value)}
          className="px-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-dark-brown bg-white"
        >
          <option value="">{t('All statuses', 'جميع الحالات')}</option>
          <option value="verified">{t('Verified', 'موثّق')}</option>
          <option value="pending">{t('Pending', 'قيد الانتظار')}</option>
          <option value="unverified">{t('Unverified', 'غير موثّق')}</option>
        </select>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-medium-brown border border-sand hover:bg-sand transition-all">
          <RefreshCw size={14} /> {t('Refresh', 'تحديث')}
        </button>
      </div>

      {!SUPABASE_CONFIGURED && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm mb-4">
          <AlertCircle size={18} className="flex-shrink-0" />
          {t('Supabase not configured.', 'Supabase غير متصل.')}
        </div>
      )}

      {error && <AdminErrorState message={error} onRetry={load} />}

      {!error && (
        <>
          {!loading && items.length === 0 ? (
            <AdminEmptyState icon={Store} message={t('No suppliers found.', 'لا يوجد موردون.')} />
          ) : (
            <AdminTable
              loading={loading}
              headers={[
                t('Company', 'الشركة'),
                t('Contact', 'التواصل'),
                t('Location', 'الموقع'),
                t('Status', 'الحالة'),
                t('Joined', 'تاريخ الانضمام'),
                t('Actions', 'الإجراءات'),
              ]}
            >
              {items.map(s => (
                <tr key={s.id} className="hover:bg-warm-white transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-dark-brown text-sm">{s.company_name_en}</div>
                    <div className="text-xs text-light-brown">{s.company_name_ar}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-medium-brown">{s.email || '—'}</div>
                    <div className="text-xs text-light-brown">{s.phone || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-medium-brown">
                    {[s.city, s.country].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <VerifyBadge status={s.verification_status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-light-brown">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <VerifyActions
                      supplier={s}
                      callerRole={me?.role}
                      onChanged={handleChanged}
                    />
                  </td>
                </tr>
              ))}
            </AdminTable>
          )}
          <Pagination page={page} totalPages={Math.ceil(count / PAGE_SIZE)} onPage={setPage} />
        </>
      )}
    </AdminLayout>
  );
}
