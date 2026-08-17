import { Info } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SUPABASE_CONFIGURED } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';

const ALLOWED_FORMATS = ['RFA', 'RVT', 'MAX', 'FBX', 'OBJ', 'SKP', 'DWG', 'IFC', 'ZIP', '3DS'];
const ALLOWED_IMAGE_FORMATS = ['JPG', 'JPEG', 'PNG', 'WEBP'];

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-sand last:border-0 text-sm">
      <span className="text-light-brown w-48 flex-shrink-0">{label}</span>
      <span className="font-medium text-dark-brown text-right flex-1">{value}</span>
    </div>
  );
}

export default function AdminSettings() {
  const { t }       = useLanguage();
  const { user: me } = useAuth();

  if (!['admin', 'super_admin'].includes(me?.role)) {
    return (
      <AdminLayout title="Access Denied">
        <p className="text-light-brown">{t('Admin access required.', 'مطلوب صلاحية مدير.')}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={t('Settings', 'الإعدادات')}
      subtitle={t('Platform configuration overview', 'نظرة عامة على إعدادات المنصة')}
    >
      <div className="max-w-2xl space-y-6">

        {/* Platform info */}
        <section className="bg-white rounded-2xl border border-sand p-5">
          <h2 className="font-bold text-dark-brown mb-1">{t('Platform Info', 'معلومات المنصة')}</h2>
          <p className="text-xs text-light-brown mb-4">{t('Read-only. Contact super_admin to change.', 'للقراءة فقط.')}</p>
          <InfoRow label="Platform"     value="BUOD — Building Unified Object Data" />
          <InfoRow label="Stack"        value="React 18 + Vite + Supabase + Vercel" />
          <InfoRow label="Supabase"     value={SUPABASE_CONFIGURED ? '✓ Connected' : '✗ Not configured'} />
          <InfoRow label="Environment"  value={import.meta.env.MODE} />
        </section>

        {/* Upload limits */}
        <section className="bg-white rounded-2xl border border-sand p-5">
          <h2 className="font-bold text-dark-brown mb-4">{t('File Upload Limits', 'حدود رفع الملفات')}</h2>
          <InfoRow label={t('3D File formats', 'صيغ الملفات ثلاثية الأبعاد')} value={ALLOWED_FORMATS.join(', ')} />
          <InfoRow label={t('BIM / 3D file limit', 'حد ملفات BIM / 3D')} value="100 MB per file" />
          <InfoRow label={t('Image formats', 'صيغ الصور')}   value={ALLOWED_IMAGE_FORMATS.join(', ')} />
          <InfoRow label={t('Image / datasheet limit', 'حد الصور / أوراق البيانات')} value="20 MB per file" />
          <InfoRow label={t('Datasheets', 'أوراق البيانات')} value="PDF only" />
        </section>

        {/* Publication workflow */}
        <section className="bg-white rounded-2xl border border-sand p-5">
          <h2 className="font-bold text-dark-brown mb-4">{t('MVP data workflow', 'سير عمل بيانات MVP')}</h2>
          <InfoRow label={t('Block publication', 'نشر البلوك')} value="draft → published → archived" />
          <InfoRow label={t('BUOD reference', 'مرجع BUOD')} value="Backend managed" />
          <InfoRow label={t('Asset storage', 'تخزين الملفات')} value="Private buckets + short-lived signed reads" />
          <InfoRow label={t('Admin writes', 'كتابات المدير')} value="Strict admin RPCs" />
        </section>

        {/* Role matrix */}
        <section className="bg-white rounded-2xl border border-sand p-5">
          <h2 className="font-bold text-dark-brown mb-4">{t('Role Permissions', 'صلاحيات الأدوار')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-sand">
                  {['Role', 'Admin Panel', 'Block Data', 'Users', 'Suppliers', 'Categories'].map(h => (
                    <th key={h} className="text-left pb-2 font-semibold text-medium-brown pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {[
                  ['super_admin', '✓', '✓', '✓ (all)', '✓', '✓'],
                  ['admin',       '✓', '✓', '✓ (limited)', '✓', '✓'],
                  ['reviewer',    '✗', '✗', '✗', '✗', '✗'],
                  ['user',        '✗', '✗', '✗', '✗', '✗'],
                ].map(([role, ...perms]) => (
                  <tr key={role}>
                    <td className="py-2 font-semibold text-dark-brown pr-4">{role}</td>
                    {perms.map((p, i) => (
                      <td key={i} className={`py-2 pr-4 ${p === '✗' ? 'text-red-400' : 'text-green-600'}`}>{p}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs">
          <Info size={16} className="flex-shrink-0 mt-0.5" />
          <p>
            {t(
              'This page is read-only. Backend authorization, storage, and environment configuration are managed outside this screen.',
              'هذه الصفحة للقراءة فقط. تتم إدارة صلاحيات الخلفية والتخزين وإعدادات البيئة خارج هذه الشاشة.'
            )}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
