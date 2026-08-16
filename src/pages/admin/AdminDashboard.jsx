import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Package, ClipboardList, Store,
  Tag, ChevronRight, AlertCircle, Settings,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SUPABASE_CONFIGURED } from '../../lib/supabase';
import { adminStatsService } from '../../services/adminService';
import AdminLayout, { AdminStatCard } from '../../components/admin/AdminLayout';

const STATUS_DOT = {
  draft: { color: '#6b7280' },
  published: { color: '#16a34a' },
  archived: { color: '#92400e' },
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
    { icon: Package,       value: stats?.products,      label: t('Total Blocks', 'إجمالي البلوكات'),  color: 'bg-purple-50 text-purple-600' },
    { icon: ClipboardList, value: stats?.draft,         label: t('Draft Blocks', 'البلوكات المسودة'), color: 'bg-amber-50 text-amber-600' },
    { icon: Package,       value: stats?.published,     label: t('Published Blocks', 'البلوكات المنشورة'), color: 'bg-green-50 text-green-600' },
    { icon: Package,       value: stats?.archived,      label: t('Archived Blocks', 'البلوكات المؤرشفة'), color: 'bg-gray-100 text-gray-600' },
    { icon: Store,         value: stats?.suppliers,     label: t('Supplier Windows', 'نوافذ الموردين'), color: 'bg-teal-50 text-teal-600' },
    { icon: Tag,           value: stats?.categories,    label: t('Categories', 'الفئات'), color: 'bg-cyan-50 text-cyan-600' },
  ];

  const ACTIONS = [
    { icon: ClipboardList, title: t('Manage Blocks', 'إدارة البلوكات'),
      desc: t('Create product data and manage private assets', 'إنشاء بيانات المنتجات وإدارة الملفات الخاصة'),
      href: '/admin/products' },
    { icon: Users,   title: t('Manage Users', 'إدارة المستخدمين'),
      desc: t('View users and change roles', 'عرض المستخدمين وتغيير الأدوار'), href: '/admin/users' },
    { icon: Store,   title: t('Supplier Windows', 'نوافذ الموردين'),
      desc: t('Create, publish, and verify supplier data', 'إنشاء بيانات الموردين ونشرها والتحقق منها'), href: '/admin/suppliers' },
    { icon: Tag,     title: t('Categories', 'الفئات'),
      desc: t('Manage product categories', 'إدارة فئات المنتجات'), href: '/admin/categories' },
    { icon: Settings, title: t('Settings', 'الإعدادات'),
      desc: t('View MVP configuration', 'عرض إعدادات MVP'), href: '/admin/settings' },
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
            {t('Block publication state', 'حالة نشر البلوكات')}
          </h2>
          <div className="flex flex-wrap gap-5">
            {[
              ['draft', t('Draft', 'مسودة')],
              ['published', t('Published', 'منشور')],
              ['archived', t('Archived', 'مؤرشف')],
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
