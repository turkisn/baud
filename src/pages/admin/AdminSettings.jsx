import { Settings, Info } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { SUPABASE_CONFIGURED } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';

const ALLOWED_FORMATS = ['RFA', 'RVT', 'MAX', 'FBX', 'OBJ', 'SKP', 'DWG', 'IFC', 'PDF', 'ZIP'];
const ALLOWED_IMAGE_FORMATS = ['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'];

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
          <InfoRow label="Platform"     value="BUAD — Building Unified Asset Database" />
          <InfoRow label="Stack"        value="React 18 + Vite + Supabase + Vercel" />
          <InfoRow label="Supabase"     value={SUPABASE_CONFIGURED ? '✓ Connected' : '✗ Not configured'} />
          <InfoRow label="Environment"  value={import.meta.env.MODE} />
        </section>

        {/* Upload limits */}
        <section className="bg-white rounded-2xl border border-sand p-5">
          <h2 className="font-bold text-dark-brown mb-4">{t('File Upload Limits', 'حدود رفع الملفات')}</h2>
          <InfoRow label={t('3D File formats', 'صيغ الملفات ثلاثية الأبعاد')} value={ALLOWED_FORMATS.join(', ')} />
          <InfoRow label={t('Image formats', 'صيغ الصور')}   value={ALLOWED_IMAGE_FORMATS.join(', ')} />
          <InfoRow label={t('Max file size', 'الحجم الأقصى')} value="50 MB per file" />
        </section>

        {/* Review workflow */}
        <section className="bg-white rounded-2xl border border-sand p-5">
          <h2 className="font-bold text-dark-brown mb-4">{t('Review Workflow', 'سير عمل المراجعة')}</h2>
          <InfoRow label={t('Submit flow', 'مسار الإرسال')}     value="draft → pending_review → approved / rejected / revision_required" />
          <InfoRow label={t('BUOD ref generated', 'BUOD Ref')}   value="On first pending_review submission" />
          <InfoRow label={t('Public visibility', 'الظهور العام')} value="Only approved + visibility=public" />
          <InfoRow label={t('Who can approve', 'من يعتمد')}      value="admin, super_admin, reviewer" />
        </section>

        {/* Role matrix */}
        <section className="bg-white rounded-2xl border border-sand p-5">
          <h2 className="font-bold text-dark-brown mb-4">{t('Role Permissions', 'صلاحيات الأدوار')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-sand">
                  {['Role', 'Admin Panel', 'Product Review', 'Users', 'Suppliers', 'Categories'].map(h => (
                    <th key={h} className="text-left pb-2 font-semibold text-medium-brown pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {[
                  ['super_admin', '✓', '✓', '✓ (all)', '✓', '✓'],
                  ['admin',       '✓', '✓', '✓ (limited)', '✓', '✓'],
                  ['reviewer',    '✓ (limited)', '✓', '✗', '✗', '✗'],
                  ['supplier',    '✗', '✗', '✗', '✗', '✗'],
                  ['designer',    '✗', '✗', '✗', '✗', '✗'],
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
              'To change platform settings that are not shown here, contact the super_admin or update environment variables in Vercel.',
              'لتغيير الإعدادات التي لا تظهر هنا، تواصل مع super_admin أو حدّث متغيرات البيئة في Vercel.'
            )}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
