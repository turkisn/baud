import { Link } from 'react-router-dom';
import { Search, Heart, Download, Package } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function UserDashboard() {
  const { t, lang }   = useLanguage();
  const { user, logout } = useAuth();

  const displayName   = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || '';
  const initial       = (user?.name || user?.email || '?')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-ivory pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: '#B68D57', color: '#2B1B0E' }}
          >
            {initial}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-brown">
              {t('Welcome back,', 'مرحباً،')} {displayName}
            </h1>
            <p className="text-sm text-light-brown mt-0.5">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: Search,
              title: t('Browse Library', 'تصفّح المكتبة'),
              desc:  t('Discover BIM-ready materials and specifications.', 'اكتشف مواد ومواصفات جاهزة لـ BIM.'),
              href:  '/library',
              color: 'bg-blue-50 text-blue-600',
            },
            {
              icon: Package,
              title: t('Marketplace', 'المتجر'),
              desc:  t('Find products from trusted suppliers.', 'تصفّح منتجات الموردين المعتمدين.'),
              href:  '/marketplace',
              color: 'bg-purple-50 text-purple-600',
            },
            {
              icon: Heart,
              title: t('Saved Items', 'المحفوظات'),
              desc:  t('View your bookmarked products and specs.', 'عرض منتجاتك ومواصفاتك المحفوظة.'),
              href:  '/marketplace',
              color: 'bg-rose-50 text-rose-600',
            },
          ].map((card, i) => (
            <Link
              key={i}
              to={card.href}
              className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-sand hover:border-dark-brown/30 transition-all group"
            >
              <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <card.icon size={18} />
              </div>
              <div>
                <div className="font-semibold text-dark-brown text-sm group-hover:text-gold transition-colors">
                  {card.title}
                </div>
                <p className="text-xs text-light-brown mt-0.5 leading-relaxed">{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Info card */}
        <div className="bg-white rounded-2xl border border-sand p-6">
          <h2 className="font-bold text-dark-brown mb-1">
            {t('Your Account', 'حسابك')}
          </h2>
          <p className="text-sm text-light-brown mb-4">
            {t(
              'Manage your profile and preferences.',
              'إدارة ملفك الشخصي وتفضيلاتك.'
            )}
          </p>
          <dl className="text-sm space-y-2">
            <div className="flex gap-2">
              <dt className="text-light-brown w-24 flex-shrink-0">{t('Email', 'البريد')}</dt>
              <dd className="text-dark-brown font-medium">{user?.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-light-brown w-24 flex-shrink-0">{t('Role', 'الدور')}</dt>
              <dd className="text-dark-brown font-medium capitalize">{user?.role || 'user'}</dd>
            </div>
            {user?.company_name && (
              <div className="flex gap-2">
                <dt className="text-light-brown w-24 flex-shrink-0">{t('Company', 'الشركة')}</dt>
                <dd className="text-dark-brown font-medium">{user.company_name}</dd>
              </div>
            )}
          </dl>
        </div>

      </div>
    </div>
  );
}
