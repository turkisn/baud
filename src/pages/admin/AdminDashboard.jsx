import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Package, ClipboardList, Store,
  Factory, Tag, ChevronRight, AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SUPABASE_CONFIGURED } from '../../lib/supabase';
import { adminStatsService } from '../../services/adminService';
import AdminLayout, { AdminStatCard } from '../../components/admin/AdminLayout';

const STATUS_DOT = {
  pending:  { color: '#d97706' },
  approved: { color: '#16a34a' },
  rejected: { color: '#ef4444' },
  revision: { color: '#7c3aed' },
  draft:    { color: '#6b7280' },
};

export default function AdminDashboard() {
  const { t }             = useLanguage();
  const { isAdmin }       = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setL]   = useState(true);
  const [error, setErr]   = useState(null);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) { setL(false); return; }
    adminStatsService.getOverviewStats()
      .then(s => { setStats(s); setL(false); })
      .catch(e => { setErr(e.message); setL(false); });
  }, []);

  if (!isAdmin()) return null;

  const STAT_CARDS = [
    { icon: Users,         value: stats?.users,        label: t('Total Users', 'إجمالي المستخدمين'),  color: 'bg-blue-50 text-blue-600'    },
    { icon: Package,       value: stats?.products,      label: t('Total Products', 'إجمالي المنتجات'), color: 'bg-purple-50 text-purple-600' },
    { icon: ClipboardList, value: stats?.pending,       label: t('Pending Review', 'قيد المراجعة'),    color: 'bg-amber-50 text-amber-600',
      sub: stats?.pending > 0 ? t('Needs attention', 'يحتاج مراجعة') : undefined },
    { icon: Package,       value: stats?.approved,      label: t('Approved', 'معتمد'),                 color: 'bg-green-50 text-green-600'   },
    { icon: Package,       value: stats?.rejected,      label: t('Rejected', 'مرفوض'),                 color: 'bg-red-50 text-red-600'      },
    { icon: ClipboardList, value: stats?.revision,      label: t('Needs Revision', 'يحتاج تعديل'),     color: 'bg-violet-50 text-violet-600' },
    { icon: Store,         value: stats?.suppliers,     label: t('Suppliers', 'الموردون'),              color: 'bg-teal-50 text-teal-600'    },
    { icon: Factory,       value: stats?.manufacturers, label: t('Manufacturers', 'المصنّعون'),         color: 'bg-cyan-50 text-cyan-600'    },
  ];

  const ACTIONS = [
    { icon: ClipboardList, title: t('Product Reviews', 'مراجعة المنتجات'),
      desc: t('Approve, reject, or request revision', 'اعتماد أو رفض أو طلب تعديل'),
      href: '/admin/products', badge: (!loading && stats?.pending > 0) ? stats.pending : null },
    { icon: Users,   title: t('Manage Users', 'إدارة المستخدمين'),
      desc: t('View users and change roles', 'عرض المستخدمين وتغيير الأدوار'), href: '/admin/users' },
    { icon: Store,   title: t('Suppliers', 'الموردون'),
      desc: t('Verify and manage suppliers', 'التحقق وإدارة الموردين'), href: '/admin/suppliers' },
    { icon: Factory, title: t('Manufacturers', 'المصنّعون'),
      desc: t('Verify and manage manufacturers', 'التحقق وإدارة المصنّعين'), href: '/admin/manufacturers' },
    { icon: Tag,     title: t('Categories', 'الفئات'),
      desc: t('Manage product categories', 'إدارة فئات المنتجات'), href: '/admin/categories' },
  ];

  return (
    <AdminLayout
      title={t('Admin Dashboard', 'لوحة تحكم المدير')}
      subtitle={t('Platform overview', 'نظرة عامة على المنصة')}
    >
      {!SUPABASE_CONFIGURED && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm mb-6">
          <AlertCircle size={18} className="flex-shrink-0" />
          {t('Supabase not configured — stats unavailable.', 'Supabase غير متصل.')}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">
          <AlertCircle size={18} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((c, i) => <AdminStatCard key={i} {...c} loading={loading} />)}
      </div>

      {!loading && stats && (
        <div className="bg-white rounded-2xl border border-sand p-5 mb-8">
          <h2 className="text-xs font-bold text-medium-brown uppercase tracking-wider mb-3">
            {t('Product Status', 'حالات المنتجات')}
          </h2>
          <div className="flex flex-wrap gap-5">
            {[
              ['pending',  t('Pending', 'قيد المراجعة')],
              ['approved', t('Approved', 'معتمد')      ],
              ['rejected', t('Rejected', 'مرفوض')      ],
              ['revision', t('Revision', 'يحتاج تعديل')],
              ['draft',    t('Draft', 'مسودة')          ],
            ].map(([key, lbl]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_DOT[key].color }} />
                <span className="text-sm text-medium-brown">{lbl}</span>
                <span className="text-sm font-bold text-dark-brown">{stats[key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-bold text-dark-brown mb-4">{t('Quick Actions', 'إجراءات سريعة')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ACTIONS.map((a, i) => (
          <Link key={i} to={a.href}
            className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-sand hover:border-dark-brown/30 transition-all group">
            <div className="w-10 h-10 bg-warm-white rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gold/10 transition-colors">
              <a.icon size={18} className="text-dark-brown" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-dark-brown text-sm">{a.title}</span>
                {a.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                    {a.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-light-brown mt-0.5">{a.desc}</p>
            </div>
            <ChevronRight size={16} className="text-light-brown flex-shrink-0 mt-1" />
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}
