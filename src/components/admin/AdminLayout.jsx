import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart2, ClipboardList, Users, Store, Factory,
  Tag, Settings, Home, LogOut, ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/admin/dashboard',     icon: BarChart2,     en: 'Overview',          ar: 'نظرة عامة',        roles: ['admin', 'super_admin', 'reviewer'] },
  { path: '/admin/products',      icon: ClipboardList,  en: 'Product Reviews',   ar: 'مراجعة المنتجات',   roles: ['admin', 'super_admin', 'reviewer'] },
  { path: '/admin/users',         icon: Users,          en: 'Users',             ar: 'المستخدمون',        roles: ['admin', 'super_admin'] },
  { path: '/admin/suppliers',     icon: Store,          en: 'Suppliers',         ar: 'الموردون',          roles: ['admin', 'super_admin'] },
  { path: '/admin/manufacturers', icon: Factory,        en: 'Manufacturers',     ar: 'المصنّعون',         roles: ['admin', 'super_admin'] },
  { path: '/admin/categories',    icon: Tag,            en: 'Categories',        ar: 'الفئات',            roles: ['admin', 'super_admin'] },
  { path: '/admin/settings',      icon: Settings,       en: 'Settings',          ar: 'الإعدادات',         roles: ['admin', 'super_admin'] },
];

const ROLE_STYLES = {
  super_admin:  { bg: '#fef3c7', color: '#92400e', label: 'Super Admin' },
  admin:        { bg: '#dbeafe', color: '#1d4ed8', label: 'Admin'       },
  reviewer:     { bg: '#ede9fe', color: '#6d28d9', label: 'Reviewer'    },
};

function RoleBadge({ role }) {
  const s = ROLE_STYLES[role] || { bg: '#f3f4f6', color: '#374151', label: role };
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export default function AdminLayout({ children, title, subtitle }) {
  const { lang, t }        = useLanguage();
  const { user, logout }   = useAuth();
  const location           = useLocation();
  const navigate           = useNavigate();

  const initial     = (user?.name || user?.email || '?')[0].toUpperCase();
  const displayName = user?.name || user?.email || '';
  const role        = user?.role ?? '';

  const visible = NAV.filter(n => n.roles.includes(role));

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-ivory flex">
      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 bg-dark-brown min-h-screen flex-col sticky top-0 h-screen overflow-y-auto flex-shrink-0">
        {/* Identity */}
        <div className="p-6 border-b border-medium-brown/40">
          <Link to="/" className="block mb-5 text-warm-white font-bold text-lg hover:text-gold transition-colors">
            {lang === 'ar' ? 'بُعد' : 'Buad'}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-dark-brown flex-shrink-0"
              style={{ background: '#B68D57' }}>
              {initial}
            </div>
            <div className="min-w-0">
              <div className="text-warm-white font-semibold text-sm truncate">{displayName}</div>
              <RoleBadge role={role} />
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-0.5">
          {visible.map(item => {
            const active = location.pathname === item.path ||
              (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-[#B68D57]/20 text-[#B68D57]'
                    : 'text-light-brown hover:bg-medium-brown/40 hover:text-warm-white'
                }`}
              >
                <item.icon size={17} />
                {lang === 'ar' ? item.ar : item.en}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-medium-brown/40 space-y-0.5">
          <Link to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-light-brown hover:bg-medium-brown/40 hover:text-warm-white transition-all">
            <Home size={17} />
            {t('Back to Site', 'العودة للموقع')}
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-light-brown hover:bg-medium-brown/40 transition-all">
            <LogOut size={17} />
            {t('Sign Out', 'تسجيل الخروج')}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="bg-white border-b border-sand px-6 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div>
              {title && <h1 className="text-lg font-bold text-dark-brown">{title}</h1>}
              {subtitle && <p className="text-xs text-light-brown mt-0.5">{subtitle}</p>}
            </div>
            {/* Mobile nav */}
            <div className="lg:hidden flex flex-wrap gap-1">
              {visible.slice(0, 4).map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    location.pathname === item.path ? 'bg-dark-brown text-white' : 'bg-sand text-medium-brown'
                  }`}
                >
                  {lang === 'ar' ? item.ar : item.en}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Shared UI atoms used across admin pages ───────────────────

export function AdminStatCard({ icon: Icon, value, label, sub, color, loading }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-sand">
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-sand animate-pulse rounded-lg mb-1" />
      ) : (
        <div className="text-2xl font-bold text-dark-brown">{value ?? '—'}</div>
      )}
      <div className="text-sm text-light-brown mt-0.5">{label}</div>
      {sub && <div className="text-xs text-medium-brown mt-1">{sub}</div>}
    </div>
  );
}

export function AdminEmptyState({ icon: Icon, message }) {
  return (
    <div className="bg-white rounded-2xl border border-sand p-12 text-center">
      <Icon size={40} className="text-sand mx-auto mb-3" />
      <p className="text-sm text-light-brown">{message}</p>
    </div>
  );
}

export function AdminErrorState({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-700 flex items-start gap-3">
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-semibold underline underline-offset-2 flex-shrink-0">
          Retry
        </button>
      )}
    </div>
  );
}

export function AdminTable({ headers, children, loading, colSpan }) {
  return (
    <div className="bg-white rounded-2xl border border-sand overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-warm-white border-b border-sand">
            <tr>
              {headers.map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-medium-brown uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {loading ? (
              <tr>
                <td colSpan={colSpan || headers.length} className="py-16 text-center">
                  <div className="w-6 h-6 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-medium-brown">
      <button
        disabled={page === 0}
        onClick={() => onPage(page - 1)}
        className="px-4 py-2 rounded-lg bg-white border border-sand disabled:opacity-40 hover:bg-sand transition-all"
      >
        ← Prev
      </button>
      <span>Page {page + 1} of {totalPages}</span>
      <button
        disabled={page >= totalPages - 1}
        onClick={() => onPage(page + 1)}
        className="px-4 py-2 rounded-lg bg-white border border-sand disabled:opacity-40 hover:bg-sand transition-all"
      >
        Next →
      </button>
    </div>
  );
}

export function VerifyBadge({ status }) {
  const map = {
    verified:   { bg: '#d1fae5', color: '#065f46', label: 'Verified'   },
    pending:    { bg: '#fef3c7', color: '#92400e', label: 'Pending'    },
    unverified: { bg: '#f3f4f6', color: '#374151', label: 'Unverified' },
  };
  const s = map[status] || map.unverified;
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}
