import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Search, RefreshCw, AlertCircle, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { userAdminService } from '../../services/adminService';
import { SUPABASE_CONFIGURED } from '../../lib/supabase';
import AdminLayout, {
  AdminTable, AdminEmptyState, AdminErrorState, Pagination,
} from '../../components/admin/AdminLayout';
import { formatAdminDate } from '../../utils/date';

const PAGE_SIZE = 25;

const AUTHORIZATION_ROLES = [
  { id: 'user', en: 'User', ar: 'مستخدم' },
  { id: 'reviewer', en: 'Reviewer', ar: 'مراجع' },
  { id: 'admin', en: 'Admin', ar: 'مدير' },
  { id: 'super_admin', en: 'Super admin', ar: 'مدير أعلى' },
];

const USER_TYPES = [
  { id: 'general_user', en: 'General user', ar: 'مستخدم عام' },
  { id: 'interior_designer', en: 'Interior designer', ar: 'مصمم داخلي' },
  { id: 'architect', en: 'Architect', ar: 'معماري' },
  { id: 'engineer', en: 'Engineer', ar: 'مهندس' },
  { id: 'design_office', en: 'Design office', ar: 'مكتب تصميم' },
  { id: 'engineering_office', en: 'Engineering office', ar: 'مكتب هندسي' },
  { id: 'contractor', en: 'Contractor', ar: 'مقاول' },
  { id: 'developer', en: 'Developer', ar: 'مطور' },
  { id: 'student', en: 'Student', ar: 'طالب' },
  { id: 'supplier_representative', en: 'Supplier representative', ar: 'ممثل مورد' },
  { id: 'manufacturer_representative', en: 'Manufacturer representative', ar: 'ممثل مصنّع' },
  { id: 'other', en: 'Other', ar: 'أخرى' },
];

const ROLE_IDS = AUTHORIZATION_ROLES.map(({ id }) => id);

const ROLE_STYLES = {
  super_admin:  { bg: '#fef3c7', color: '#92400e' },
  admin:        { bg: '#dbeafe', color: '#1d4ed8' },
  reviewer:     { bg: '#ede9fe', color: '#6d28d9' },
  user:         { bg: '#f3f4f6', color: '#374151' },
};

function localizedLabel(options, value, lang) {
  const option = options.find(({ id }) => id === value);
  return option ? option[lang === 'ar' ? 'ar' : 'en'] : value?.replaceAll('_', ' ') || '—';
}

function RoleBadge({ role, lang }) {
  const s = ROLE_STYLES[role] || ROLE_STYLES.user;
  return (
    <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {localizedLabel(AUTHORIZATION_ROLES, role || 'user', lang)}
    </span>
  );
}

function UserTypeBadge({ userType, lang }) {
  return <span className="inline-block rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800">{localizedLabel(USER_TYPES, userType || 'general_user', lang)}</span>;
}

// Which roles a caller can assign (mirrors DB logic client-side for UX only;
// the DB RPC is the authoritative enforcement layer).
function assignableRoles(callerRole, currentRole) {
  if (callerRole === 'super_admin') return ROLE_IDS;
  if (callerRole === 'admin' && ['user', 'reviewer'].includes(currentRole)) return ['user', 'reviewer'];
  return [];
}

function RoleDropdown({ currentRole, userId, callerRole, callerUserId, lang, onChanged }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const allowed = assignableRoles(callerRole, currentRole).filter(r => r !== currentRole);
  const canChange = allowed.length > 0 && userId !== callerUserId;

  if (!canChange) return <RoleBadge role={currentRole} lang={lang} />;

  const handleSelect = async (newRole) => {
    setOpen(false);
    setLoading(true);
    setError(null);
    try {
      await userAdminService.setRole(userId, newRole);
      onChanged(userId, newRole);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
        style={ROLE_STYLES[currentRole] || ROLE_STYLES.user}
      >
        {localizedLabel(AUTHORIZATION_ROLES, currentRole || 'user', lang)}
        {loading
          ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          : <ChevronDown size={10} />}
      </button>

      {open && (
        <div role="menu" className="absolute start-0 z-30 mt-1 min-w-[150px] overflow-hidden rounded-xl border border-sand bg-white shadow-lg">
          {allowed.map(role => (
            <button
              type="button"
              role="menuitem"
              key={role}
              onClick={() => handleSelect(role)}
              className="w-full px-4 py-2.5 text-start text-xs font-medium transition-colors hover:bg-warm-white"
              style={{ color: ROLE_STYLES[role]?.color || '#374151' }}
            >
              {localizedLabel(AUTHORIZATION_ROLES, role, lang)}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="absolute start-0 z-40 mt-1 min-w-[240px] rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

export default function AdminUsers() {
  const { lang, t }       = useLanguage();
  const { user: me }      = useAuth();
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setL]   = useState(true);
  const [error, setErr]   = useState(null);
  const [page, setPage]   = useState(0);
  const [search, setSrch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRF] = useState('');
  const requestVersion = useRef(0);

  const load = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) { setL(false); return; }
    const version = ++requestVersion.current;
    setL(true);
    setErr(null);
    try {
      const { data, count: c } = await userAdminService.list({ role: roleFilter || null, search: debouncedSearch, page });
      if (version !== requestVersion.current) return;
      setUsers(data);
      setCount(c);
    } catch (e) {
      if (version === requestVersion.current) setErr(e.message);
    } finally {
      if (version === requestVersion.current) setL(false);
    }
  }, [debouncedSearch, roleFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => { requestVersion.current += 1; }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(0);
      setDebouncedSearch(search.trim());
    }, 450);
    return () => window.clearTimeout(timer);
  }, [search]);

  const handleRoleChanged = (userId, newRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const totalPages = Math.ceil(count / PAGE_SIZE);

  if (!['admin', 'super_admin'].includes(me?.role)) {
    return (
      <AdminLayout title={t('Access denied', 'الوصول مرفوض')}>
        <p className="text-light-brown">{t('You do not have permission to view this page.', 'ليس لديك صلاحية لعرض هذه الصفحة.')}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={t('Users', 'المستخدمون')}
      subtitle={`${count} ${t('total', 'إجمالي')}`}
    >
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-light-brown" />
          <input
            value={search}
            onChange={e => setSrch(e.target.value)}
            placeholder={t('Search name, email, company…', 'بحث بالاسم أو البريد…')}
            className="w-full rounded-xl border border-sand bg-white py-2.5 pe-4 ps-9 text-sm outline-none transition-colors focus:border-dark-brown"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRF(e.target.value); setPage(0); }}
          className="px-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-dark-brown bg-white transition-colors"
        >
          <option value="">{t('All roles', 'جميع الأدوار')}</option>
          {AUTHORIZATION_ROLES.map(role => (
            <option key={role.id} value={role.id}>{role[lang === 'ar' ? 'ar' : 'en']}</option>
          ))}
        </select>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-medium-brown border border-sand hover:bg-sand transition-all"
        >
          <RefreshCw size={14} />
          {t('Refresh', 'تحديث')}
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
          {!loading && users.length === 0 ? (
            <AdminEmptyState icon={Users} message={t('No users found.', 'لا يوجد مستخدمون.')} />
          ) : (
            <AdminTable
              loading={loading}
              headers={[
                t('User', 'المستخدم'),
                t('Email', 'البريد'),
                t('Authorization role', 'دور الصلاحية'),
                t('User type', 'نوع المستخدم'),
                t('Company', 'الشركة'),
                t('Joined', 'تاريخ الانضمام'),
              ]}
            >
              {users.map(u => (
                <tr key={u.id} className="hover:bg-warm-white transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sand flex items-center justify-center text-sm font-bold text-dark-brown flex-shrink-0">
                        {(u.full_name || u.email || '?')[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-dark-brown truncate max-w-[160px]">
                        {u.full_name || '—'}
                        {u.id === me?.id && (
                          <span className="ms-1 text-[10px] font-normal text-light-brown">({t('you', 'أنت')})</span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-medium-brown text-sm">{u.email}</td>
                  <td className="px-4 py-3">
                    <RoleDropdown
                      currentRole={u.role}
                      userId={u.id}
                      callerRole={me?.role}
                      callerUserId={me?.id}
                      lang={lang}
                      onChanged={handleRoleChanged}
                    />
                  </td>
                  <td className="px-4 py-3"><UserTypeBadge userType={u.user_type} lang={lang} /></td>
                  <td className="px-4 py-3 text-medium-brown text-xs">{u.company_name || '—'}</td>
                  <td className="px-4 py-3 text-light-brown text-xs">
                    {u.created_at ? <time dateTime={u.created_at} dir="ltr">{formatAdminDate(u.created_at)}</time> : '—'}
                  </td>
                </tr>
              ))}
            </AdminTable>
          )}
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}
    </AdminLayout>
  );
}
