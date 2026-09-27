import { useLanguage } from '../../context/LanguageContext';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function WorkspaceSyncStatus({ compact = false }) {
  const { t } = useLanguage();
  const { sync, retrySync, keepBoth, chooseCloud, exportProjects } = useWorkspace();
  const messages = {
    local: t('Saved on this browser only. Sign in to use private cloud projects.', 'الحفظ في هذا المتصفح فقط. سجّل الدخول لاستخدام مشاريع حسابك السحابية.'),
    loading: t('Checking your cloud projects…', 'جارٍ التحقق من مشاريع حسابك…'),
    queued: t('Changes waiting to sync. Keep this page open.', 'تعديلات بانتظار المزامنة. أبقِ الصفحة مفتوحة.'),
    saving: t('Saving to your account…', 'جارٍ الحفظ في حسابك…'),
    saved: t('Projects synced to your private account.', 'تمت مزامنة المشاريع مع حسابك الخاص.'),
    error: t('Cloud sync failed. Your draft has not been confirmed in the cloud. Retry or export it.', 'تعذرت المزامنة. لم يتأكد حفظ مسودتك سحابياً. أعد المحاولة أو صدّر نسخة.'),
    conflict: t('Another device changed these projects. Neither copy was overwritten. Keep both as separate projects or export your draft.', 'يوجد تعديل من جهاز آخر. لم نكتب فوق أي نسخة. احتفظ بالنسختين كمشاريع منفصلة أو صدّر مسودتك.'),
  };
  return <div className={`${compact ? 'mb-3 text-xs' : 'digital-panel mb-6 rounded-xl p-4 text-sm'} text-sand/80`}>
    <p role="status" aria-live="polite" data-testid="workspace-sync-status">{messages[sync.status]}</p>
    {sync.storageError && <p role="alert" className="mt-2 text-red-300">{t('Browser storage is unavailable. Export a copy before leaving; unsynced changes may be lost.', 'التخزين المحلي غير متاح. صدّر نسخة قبل المغادرة؛ قد تفقد التعديلات غير المتزامنة.')}</p>}
    {sync.limitError && <p role="alert" className="mt-2 text-red-300">{t('Workspace limit reached: 50 projects, 250 products per project, or total data size. This change was not applied.', 'تم بلوغ حد مساحة العمل: 50 مشروعاً، أو 250 منتجاً للمشروع، أو حجم البيانات. لم يُطبّق التعديل.')}</p>}
    <div className="mt-2 flex flex-wrap gap-3">
      {sync.status === 'error' && <button type="button" onClick={retrySync} className="underline">{t('Retry sync', 'إعادة المزامنة')}</button>}
      {sync.status === 'conflict' && <button type="button" onClick={keepBoth} className="underline">{t('Keep both copies', 'الاحتفاظ بالنسختين')}</button>}
      {sync.status === 'conflict' && <button type="button" onClick={() => {
        if (window.confirm(t('Use the cloud version? Your local draft will be backed up in this browser. Export it first if you need a portable copy.', 'استخدام النسخة السحابية؟ ستُحفظ مسودتك احتياطياً في هذا المتصفح. صدّرها أولاً إن احتجت نسخة خارجية.'))) void chooseCloud();
      }} className="underline">{t('Use cloud version', 'استخدام النسخة السحابية')}</button>}
      {!compact && <button type="button" onClick={exportProjects} className="underline">{t('Export project backup', 'تصدير نسخة من المشاريع')}</button>}
      {!compact && sync.backupAvailable && <button type="button" onClick={() => exportProjects(true)} className="underline">{t('Export previous conflict draft', 'تصدير مسودة التعارض السابقة')}</button>}
    </div>
  </div>;
}
