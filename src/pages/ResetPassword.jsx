import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Globe, Loader2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { SUPABASE_CONFIGURED, supabase } from '../lib/supabase';
import { authService } from '../services/authService';

export default function ResetPassword() {
  const { lang, t, toggleLang } = useLanguage();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) { setChecking(false); return undefined; }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setHasSession(Boolean(data.session));
        setChecking(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || session) setHasSession(true);
      setChecking(false);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError(t('Password must be at least 8 characters.', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('Passwords do not match.', 'كلمتا المرور غير متطابقتين.'));
      return;
    }
    setLoading(true);
    try {
      await authService.updatePassword(password);
      try { await authService.signOut(); } catch { /* Password update already succeeded. */ }
      setUpdated(true);
    } catch {
      setError(t('This reset link is invalid or expired. Request a new one.', 'رابط الاستعادة غير صالح أو منتهي. اطلب رابطاً جديداً.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white px-6 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-12 flex items-center justify-between">
          <Link to="/" className="font-black tracking-[0.14em] text-dark-brown">BUOD</Link>
          <button type="button" onClick={toggleLang} aria-label={t('Switch language', 'تغيير اللغة')} className="flex items-center gap-2 text-sm text-medium-brown hover:text-dark-brown"><Globe size={16}/>{lang === 'ar' ? 'EN' : 'عربي'}</button>
        </div>
        <div className="rounded-3xl border border-sand bg-white p-7 shadow-card sm:p-9">
          {checking ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gold" size={30}/><span className="sr-only">{t('Checking reset link', 'جارٍ التحقق من رابط الاستعادة')}</span></div> : updated ? (
            <div role="status" className="text-center"><CheckCircle2 className="mx-auto mb-5 text-green-600" size={44}/><h1 className="text-2xl font-bold text-dark-brown">{t('Password updated', 'تم تحديث كلمة المرور')}</h1><p className="mt-3 text-light-brown">{t('You can now sign in with your new password.', 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.')}</p><Link to="/login" className="btn-primary mt-7 justify-center">{t('Sign in', 'تسجيل الدخول')}</Link></div>
          ) : !hasSession ? (
            <div className="text-center"><h1 className="text-2xl font-bold text-dark-brown">{t('Reset link unavailable', 'رابط الاستعادة غير متاح')}</h1><p role="alert" className="mt-3 leading-7 text-light-brown">{t('This link is invalid or expired. Request a new password reset email.', 'هذا الرابط غير صالح أو منتهي. اطلب رسالة استعادة جديدة.')}</p><Link to="/forgot-password" className="btn-primary mt-7 justify-center">{t('Request a new link', 'طلب رابط جديد')}</Link></div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-dark-brown">{t('Choose a new password', 'اختر كلمة مرور جديدة')}</h1>
              <p className="mt-2 text-sm text-light-brown">{t('Use at least 8 characters.', 'استخدم 8 أحرف على الأقل.')}</p>
              <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
                <div><label htmlFor="new-password" className="label">{t('New password', 'كلمة المرور الجديدة')}</label><div className="relative"><Lock aria-hidden="true" size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-light-brown"/><input id="new-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} autoComplete="new-password" minLength={8} disabled={loading} aria-invalid={Boolean(error)} aria-describedby={error ? 'reset-error' : undefined} className="input-field ps-10 pe-10"/><button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? t('Hide password', 'إخفاء كلمة المرور') : t('Show password', 'إظهار كلمة المرور')} aria-pressed={showPassword} className="absolute end-3.5 top-1/2 -translate-y-1/2 text-light-brown hover:text-dark-brown">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></div>
                <div><label htmlFor="confirm-password" className="label">{t('Confirm password', 'تأكيد كلمة المرور')}</label><input id="confirm-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError(''); }} autoComplete="new-password" disabled={loading} aria-invalid={Boolean(error)} aria-describedby={error ? 'reset-error' : undefined} className="input-field"/></div>
                {error && <p id="reset-error" role="alert" className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={18}/> : null}{t(loading ? 'Updating…' : 'Update password', loading ? 'جارٍ التحديث…' : 'تحديث كلمة المرور')}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
