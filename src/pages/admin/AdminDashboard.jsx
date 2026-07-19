import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart2, Package, Users, Settings, Home, LogOut,
  ShieldCheck, ClipboardList, Store, Tag, ChevronRight,
  RefreshCw, AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { supabase, SUPABASE_CONFIGURED } from '../../lib/supabase';

// ── Stat card ───────────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, sub, color, loading }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-sand">
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-sand animate-pulse rounded-lg mb-1" />
      ) : (
        <div className="text-2xl font-bold text-dark-brown">{value}</div>
      )}
      <div className="text-sm text-light-brown mt-0.5">{label}</div>
      {sub && <div className="text-xs text-medium-brown mt-1">{sub}</div>}
    </div>
  );
}

// ── User row ────────────────────────────────────────────────────
const ROLE_STYLES = {
  super_admin:  { bg: '#fef3c7', color: '#92400e', label: 'Super Admin'  },
  admin:        { bg: '#dbeafe', color: '#1d4ed8', label: 'Admin'        },
  reviewer:     { bg: '#ede9fe', color: '#6d28d9', label: 'Reviewer'     },
  supplier:     { bg: '#d1fae5', color: '#065f46', label: 'Supplier'     },
  manufacturer: { bg: '#cffafe', color: '#155e75', label: 'Manufacturer' },
  designer:     { bg: '#fce7f3', color: '#9d174d', label: 'Designer'     },
  user:         { bg: '#f3f4f6', color: '#374151', label: 'User'         },
};

function RoleBadge({ role }) {
  const s = ROLE_STYLES[role] || ROLE_STYLES.user;
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ── Main ────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { t, lang }     = useLanguage();
  const { user, logout, isAdmin } = useAuth();
  const navigate        = useNavigate();
  const [tab, setTab]   = useState('overview');

  // Stats
  const [stats, setStats]     = useState({ users: null, products: null, pending: null, suppliers: null });
  const [statsLoading, setSL] = useState(true);

  // Users list
  const [users, setUsers]       = useState([]);
  const [usersLoading, setUL]   = useState(false);
  const [usersError, setUE]     = useState(null);

  // Suppliers list
  const [suppliers, setSuppliers]   = useState([]);
  const [supLoading, setSup]        = useState(false);

  const initial     = (user?.name || user?.email || '?')[0].toUpperCase();
  const displayName = user?.name || user?.email || '';

  // ── Fetch stats ──────────────────────────────────────────────
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) { setSL(false); return; }
    async function load() {
      setSL(true);
      const [u, p, pr, s] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['supplier', 'manufacturer']),
      ]);
      setStats({
        users:     u.count    ?? 0,
        products:  p.count    ?? 0,
        pending:   pr.count   ?? 0,
        suppliers: s.count    ?? 0,
      });
      setSL(false);
    }
    load();
  }, []);

  // ── Fetch users when tab opens ───────────────────────────────
  useEffect(() => {
    if (tab !== 'users' || !SUPABASE_CONFIGURED) return;
    setUL(true);
    setUE(null);
    supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at, company_name')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) setUE(error.message);
        else setUsers(data || []);
        setUL(false);
      });
  }, [tab]);

  // ── Fetch suppliers when tab opens ───────────────────────────
  useEffect(() => {
    if (tab !== 'suppliers' || !SUPABASE_CONFIGURED) return;
    setSup(true);
    supabase
      .from('profiles')
      .select('id, full_name, email, role, company_name, created_at')
      .in('role', ['supplier', 'manufacturer'])
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { setSuppliers(data || []); setSup(false); });
  }, [tab]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { id: 'overview',   icon: BarChart2,    label: t('Overview', 'نظرة عامة')           },
    { id: 'products',   icon: Package,       label: t('Product Reviews', 'مراجعة المنتجات') },
    { id: 'users',      icon: Users,         label: t('Users', 'المستخدمون')              },
    { id: 'suppliers',  icon: Store,         label: t('Suppliers', 'الموردون')            },
    { id: 'categories', icon: Tag,           label: t('Categories', 'الفئات')             },
    { id: 'settings',   icon: Settings,      label: t('Settings', 'الإعدادات')            },
  ];

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1008]">
        <div className="text-center">
          <ShieldCheck size={48} className="text-gold mx-auto mb-4" />
          <p className="text-white font-bold text-xl mb-2">Admin Access Required</p>
          <Link to="/" className="text-gold text-sm hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory flex">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 bg-dark-brown min-h-screen flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-medium-brown/40">
          <Link to="/" className="flex items-center gap-2 mb-5">
            <span className="text-warm-white font-bold text-lg">{lang === 'ar' ? 'بُعد' : 'Buad'}</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-dark-brown flex-shrink-0"
              style={{ background: '#B68D57' }}>
              {initial}
            </div>
            <div className="min-w-0">
              <div className="text-warm-white font-semibold text-sm truncate">{displayName}</div>
              <RoleBadge role={user?.role} />
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                tab === item.id
                  ? 'bg-[#B68D57]/20 text-[#B68D57]'
                  : 'text-light-brown hover:bg-medium-brown/40 hover:text-warm-white'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-medium-brown/40 space-y-1">
          <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-light-brown hover:bg-medium-brown/40 hover:text-warm-white transition-all">
            <Home size={18} />
            {t('Back to Site', 'العودة للموقع')}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-light-brown hover:bg-medium-brown/40 transition-all"
          >
            <LogOut size={18} />
            {t('Sign Out', 'تسجيل الخروج')}
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="bg-white border-b border-sand px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-dark-brown">
              {t('Admin Dashboard', 'لوحة تحكم المدير')}
            </h1>
            <p className="text-xs text-light-brown">
              {navItems.find(n => n.id === tab)?.label}
            </p>
          </div>
          {/* Mobile nav */}
          <div className="lg:hidden flex gap-1 flex-wrap">
            {navItems.slice(0, 4).map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  tab === item.id ? 'bg-dark-brown text-white' : 'bg-sand text-medium-brown'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 flex-1">

          {/* ── Overview ──────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users}      value={stats.users    ?? '—'} label={t('Total Users', 'المستخدمون')}     color="bg-blue-50 text-blue-600"   loading={statsLoading} />
                <StatCard icon={Package}    value={stats.products ?? '—'} label={t('Total Products', 'المنتجات')}    color="bg-purple-50 text-purple-600" loading={statsLoading} />
                <StatCard icon={ClipboardList} value={stats.pending  ?? '—'} label={t('Pending Review', 'قيد المراجعة')} color="bg-amber-50 text-amber-600"  loading={statsLoading}
                  sub={stats.pending > 0 ? t('Needs attention', 'يحتاج مراجعة') : undefined} />
                <StatCard icon={Store}      value={stats.suppliers ?? '—'} label={t('Suppliers', 'الموردون')}         color="bg-green-50 text-green-600"  loading={statsLoading} />
              </div>

              {!SUPABASE_CONFIGURED && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  {t(
                    'Supabase is not configured — stats unavailable.',
                    'Supabase غير متصل — الإحصاءات غير متاحة.'
                  )}
                </div>
              )}

              {/* Quick actions */}
              <div>
                <h2 className="font-bold text-dark-brown mb-4">{t('Quick Actions', 'إجراءات سريعة')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      icon: ClipboardList,
                      title: t('Review Products', 'مراجعة المنتجات'),
                      desc:  t('Approve or reject pending submissions', 'اعتماد أو رفض المنتجات المُرسَلة'),
                      href:  '/admin/products',
                      badge: stats.pending > 0 ? stats.pending : null,
                    },
                    {
                      icon: Users,
                      title: t('Manage Users', 'إدارة المستخدمين'),
                      desc:  t('View all registered users and roles', 'عرض المستخدمين وأدوارهم'),
                      onClick: () => setTab('users'),
                    },
                    {
                      icon: Store,
                      title: t('View Suppliers', 'عرض الموردين'),
                      desc:  t('List of registered suppliers and manufacturers', 'قائمة الموردين والمصنّعين المسجلين'),
                      onClick: () => setTab('suppliers'),
                    },
                    {
                      icon: Tag,
                      title: t('Manage Categories', 'إدارة الفئات'),
                      desc:  t('Add or edit product categories', 'إضافة أو تعديل فئات المنتجات'),
                      href:  '/library-admin',
                    },
                  ].map((action, i) => (
                    action.href ? (
                      <Link key={i} to={action.href}
                        className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-sand hover:border-dark-brown/30 transition-all group">
                        <div className="w-10 h-10 bg-warm-white rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gold/10 transition-colors">
                          <action.icon size={18} className="text-dark-brown" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-dark-brown text-sm">{action.title}</span>
                            {action.badge && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                {action.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-light-brown mt-0.5">{action.desc}</p>
                        </div>
                        <ChevronRight size={16} className="text-light-brown flex-shrink-0 mt-1" />
                      </Link>
                    ) : (
                      <button key={i} onClick={action.onClick}
                        className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-sand hover:border-dark-brown/30 transition-all group text-left w-full">
                        <div className="w-10 h-10 bg-warm-white rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gold/10 transition-colors">
                          <action.icon size={18} className="text-dark-brown" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-dark-brown text-sm block">{action.title}</span>
                          <p className="text-xs text-light-brown mt-0.5">{action.desc}</p>
                        </div>
                        <ChevronRight size={16} className="text-light-brown flex-shrink-0 mt-1" />
                      </button>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Product Reviews ───────────────────────────────── */}
          {tab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-dark-brown">{t('Product Reviews', 'مراجعة المنتجات')}</h2>
                <Link
                  to="/admin/products"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: '#B68D57', color: '#2B1B0E' }}
                >
                  {t('Open Full Review Tool', 'فتح أداة المراجعة الكاملة')}
                  <ChevronRight size={16} />
                </Link>
              </div>
              <div className="bg-white rounded-2xl border border-sand p-8 text-center">
                <ClipboardList size={40} className="text-light-brown mx-auto mb-3" />
                <p className="font-semibold text-dark-brown mb-1">
                  {t('Product Review Tool', 'أداة مراجعة المنتجات')}
                </p>
                <p className="text-sm text-light-brown mb-5">
                  {t(
                    'Use the dedicated review tool to approve, reject, and manage product submissions.',
                    'استخدم أداة المراجعة المتخصصة للاعتماد والرفض وإدارة المنتجات المُرسَلة.'
                  )}
                </p>
                {stats.pending > 0 && (
                  <p className="text-sm font-semibold text-amber-600 mb-4">
                    {stats.pending} {t('product(s) awaiting review', 'منتج/منتجات تنتظر المراجعة')}
                  </p>
                )}
                <Link
                  to="/admin/products"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ background: '#B68D57', color: '#2B1B0E' }}
                >
                  {t('Go to Product Review', 'الذهاب إلى مراجعة المنتجات')}
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          )}

          {/* ── Users ─────────────────────────────────────────── */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-dark-brown">
                  {t('Users', 'المستخدمون')}
                  {users.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-light-brown">({users.length})</span>
                  )}
                </h2>
                <button
                  onClick={() => { setUL(true); setUE(null); setUsers([]); setTab('_'); setTimeout(() => setTab('users'), 10); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-medium-brown hover:bg-sand transition-all"
                >
                  <RefreshCw size={14} />
                  {t('Refresh', 'تحديث')}
                </button>
              </div>

              {!SUPABASE_CONFIGURED ? (
                <div className="bg-white rounded-2xl border border-sand p-8 text-center">
                  <AlertCircle size={36} className="text-amber-400 mx-auto mb-3" />
                  <p className="text-sm text-light-brown">{t('Supabase not configured.', 'Supabase غير متصل.')}</p>
                </div>
              ) : usersLoading ? (
                <div className="bg-white rounded-2xl border border-sand p-8 text-center">
                  <div className="w-6 h-6 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-light-brown">{t('Loading users…', 'جارٍ تحميل المستخدمين…')}</p>
                </div>
              ) : usersError ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
                  {usersError}
                </div>
              ) : users.length === 0 ? (
                <div className="bg-white rounded-2xl border border-sand p-8 text-center">
                  <Users size={36} className="text-light-brown mx-auto mb-3" />
                  <p className="text-sm text-light-brown">{t('No users found.', 'لا يوجد مستخدمون.')}</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-sand overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-warm-white border-b border-sand">
                        <tr>
                          {[t('Name', 'الاسم'), t('Email', 'البريد'), t('Role', 'الدور'), t('Company', 'الشركة'), t('Joined', 'تاريخ الانضمام')].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-medium-brown uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sand">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-warm-white transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-sand flex items-center justify-center text-sm font-bold text-dark-brown flex-shrink-0">
                                  {(u.full_name || u.email || '?')[0].toUpperCase()}
                                </div>
                                <span className="font-medium text-dark-brown truncate max-w-[140px]">
                                  {u.full_name || '—'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-medium-brown truncate max-w-[180px]">{u.email}</td>
                            <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                            <td className="px-4 py-3 text-medium-brown text-xs">{u.company_name || '—'}</td>
                            <td className="px-4 py-3 text-light-brown text-xs">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Suppliers ─────────────────────────────────────── */}
          {tab === 'suppliers' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-dark-brown">
                {t('Suppliers & Manufacturers', 'الموردون والمصنّعون')}
                {suppliers.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-light-brown">({suppliers.length})</span>
                )}
              </h2>

              {!SUPABASE_CONFIGURED ? (
                <div className="bg-white rounded-2xl border border-sand p-8 text-center">
                  <AlertCircle size={36} className="text-amber-400 mx-auto mb-3" />
                  <p className="text-sm text-light-brown">{t('Supabase not configured.', 'Supabase غير متصل.')}</p>
                </div>
              ) : supLoading ? (
                <div className="bg-white rounded-2xl border border-sand p-8 text-center">
                  <div className="w-6 h-6 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : suppliers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-sand p-8 text-center">
                  <Store size={36} className="text-light-brown mx-auto mb-3" />
                  <p className="text-sm text-light-brown">{t('No suppliers found.', 'لا يوجد موردون.')}</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-sand overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-warm-white border-b border-sand">
                        <tr>
                          {[t('Name', 'الاسم'), t('Email', 'البريد'), t('Role', 'الدور'), t('Company', 'الشركة'), t('Joined', 'تاريخ الانضمام')].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-medium-brown uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sand">
                        {suppliers.map(s => (
                          <tr key={s.id} className="hover:bg-warm-white transition-colors">
                            <td className="px-4 py-3 font-medium text-dark-brown">
                              {s.full_name || '—'}
                            </td>
                            <td className="px-4 py-3 text-medium-brown">{s.email}</td>
                            <td className="px-4 py-3"><RoleBadge role={s.role} /></td>
                            <td className="px-4 py-3 text-medium-brown text-xs">{s.company_name || '—'}</td>
                            <td className="px-4 py-3 text-light-brown text-xs">
                              {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Categories ────────────────────────────────────── */}
          {tab === 'categories' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-dark-brown">{t('Categories', 'الفئات')}</h2>
              <div className="bg-white rounded-2xl border border-sand p-8 text-center">
                <Tag size={40} className="text-light-brown mx-auto mb-3" />
                <p className="font-semibold text-dark-brown mb-1">{t('Library & Category Admin', 'إدارة المكتبة والفئات')}</p>
                <p className="text-sm text-light-brown mb-5">
                  {t('Manage library categories from the Library Admin page.', 'إدارة فئات المكتبة من صفحة إدارة المكتبة.')}
                </p>
                <Link
                  to="/library-admin"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ background: '#B68D57', color: '#2B1B0E' }}
                >
                  {t('Go to Library Admin', 'الذهاب إلى إدارة المكتبة')}
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          )}

          {/* ── Settings ──────────────────────────────────────── */}
          {tab === 'settings' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-dark-brown">{t('Settings', 'الإعدادات')}</h2>
              <div className="bg-white rounded-2xl border border-sand p-8 text-center">
                <Settings size={40} className="text-light-brown mx-auto mb-3" />
                <p className="text-sm text-light-brown">
                  {t('Settings panel coming soon.', 'لوحة الإعدادات قادمة قريباً.')}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
