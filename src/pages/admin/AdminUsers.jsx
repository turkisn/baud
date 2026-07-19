import { useState, useEffect, useCallback } from 'react';
import { Users, Search, RefreshCw, AlertCircle, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { userAdminService } from '../../services/adminService';
import { SUPABASE_CONFIGURED } from '../../lib/supabase';
import AdminLayout, {
  AdminTable, AdminEmptyState, AdminErrorState, Pagination,
} from '../../components/admin/AdminLayout';

const PAGE_SIZE = 25;

const ALL_ROLES = ['user', 'designer', 'supplier', 'manufacturer', 'reviewer', 'admin', 'super_admin'];

const ROLE_STYLES = {
  super_admin:  { bg: '#fef3c7', color: '#92400e' },
  admin:        { bg: '#dbeafe', color: '#1d4ed8' },
  reviewer:     { bg: '#ede9fe', color: '#6d28d9' },
  supplier:     { bg: '#d1fae5', color: '#065f46' },
  manufacturer: { bg: '#cffafe', color: '#155e75' },
  designer:     { bg: '#fce7f3', color: '#9d174d' },
  user:         { bg: '#f3f4f6', color: '#374151' },
};

function RoleBadge({ role }) {
  const s = ROLE_STYLES[role] || ROLE_STYLES.user;
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: s.bg, color: s.color }}>
      {role?.replace('_', ' ') || 'user'}
    </span>
  );
}

// Which roles a caller can assign (mirrors DB logic client-side for UX only;
// the DB RPC is the authoritative enforcement layer).
function assignableRoles(callerRole) {
  if (callerRole === 'super_admin') return ALL_ROLES;
  if (callerRole === 'admin') return ['user', 'designer', 'supplier', 'manufacturer', 'reviewer'];
  return [];
}

function RoleDropdown({ currentRole, userId, callerRole, callerUserId, onChanged }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const allowed = assignableRoles(callerRole).filter(r => r !== currentRole);
  const canChange = allowed.length > 0 && userId !== callerUserId;

  if (!canChange) return <RoleBadge role={currentRole} />;

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
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
        style={{ ...ROLE_STYLES[currentRole] || ROLE_STYLES.user }}
      >
        {currentRole?.replace('_', ' ') || 'user'}
        {loading
          ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          : <ChevronDown size={10} />}
      </button>

      {open && (
        <div className="absolute z-30 mt-1 left-0 bg-white border border-sand rounded-xl shadow-lg overflow-hidden min-w-[150px]">
          {allowed.map(role => (
            <button
              key={role}
              onClick={() => handleSelect(role)}
              className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-warm-white transition-colors"
              style={{ color: ROLE_STYLES[role]?.color || '#374151' }}
            >
              {role.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="absolute z-40 left-0 mt-1 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 min-w-[240px] shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

export default function AdminUsers() {
  const { t }             = useLanguage();
  const { user: me }      = useAuth();
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setL]   = useState(true);
  const [error, setErr]   = useState(null);
  const [page, setPage]   = useState(0);
  const [search, setSrch] = useState('');
  const [roleFilter, setRF] = useState('');

  const load = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) { setL(false); return; }
    setL(true);
    setErr(null);
    try {
      const { data, count: c } = await userAdminService.list({ role: roleFilter || null, search, page });
      setUsers(data);
      setCount(c);
    } catch (e) {
      setErr(e.message);
    } finally {
      setL(false);
    }
  }, [roleFilter, search, page]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => { setPage(0); }, [search, roleFilter]);

  const handleRoleChanged = (userId, newRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const totalPages = Math.ceil(count / PAGE_SIZE);

  if (!['admin', 'super_admin'].includes(me?.role)) {
    return (
      <AdminLayout title="Access Denied">
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
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 left-3 text-light-brown" />
          <input
            value={search}
            onChange={e => setSrch(e.target.value)}
            placeholder={t('Search name, email, company…', 'بحث بالاسم أو البريد…')}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-dark-brown transition-colors bg-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRF(e.target.value)}
          className="px-4 py-2.5 text-sm border border-sand rounded-xl outline-none focus:border-dark-brown bg-white transition-colors"
        >
          <option value="">{t('All roles', 'جميع الأدوار')}</option>
          {ALL_ROLES.map(r => (
            <option key={r} value={r}>{r.replace('_', ' ')}</option>
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
                t('Role', 'الدور'),
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
                          <span className="ml-1 text-[10px] font-normal text-light-brown">(you)</span>
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
                      onChanged={handleRoleChanged}
                    />
                  </td>
                  <td className="px-4 py-3 text-medium-brown text-xs">{u.company_name || '—'}</td>
                  <td className="px-4 py-3 text-light-brown text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
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
