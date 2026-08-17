import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Globe, Loader2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { SUPABASE_CONFIGURED } from '../lib/supabase';
import { authService } from '../services/authService';

export default function ForgotPassword() {
  const { lang, t, toggleLang } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError(t('Enter a valid email address.', 'أدخل بريداً إلكترونياً صحيحاً.'));
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email.trim());
      setSent(true);
    } catch {
      setError(t('We could not send the reset email. Wait a moment and try again.', 'تعذّر إرسال رسالة الاستعادة. انتظر قليلاً ثم حاول مجدداً.'));
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
          {sent ? (
            <div role="status" className="text-center">
              <CheckCircle2 className="mx-auto mb-5 text-green-600" size={44}/>
              <h1 className="text-2xl font-bold text-dark-brown">{t('Check your email', 'تحقق من بريدك')}</h1>
              <p className="mt-3 leading-7 text-light-brown">{t('If an account exists for that address, we sent a secure password reset link.', 'إذا كان هناك حساب بهذا البريد، فقد أرسلنا رابطاً آمناً لإعادة تعيين كلمة المرور.')}</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-dark-brown">{t('Reset your password', 'استعادة كلمة المرور')}</h1>
              <p className="mt-2 text-sm leading-6 text-light-brown">{t('Enter your account email and we will send you a secure reset link.', 'أدخل بريد حسابك وسنرسل لك رابطاً آمناً لإعادة التعيين.')}</p>
              {!SUPABASE_CONFIGURED && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{t('Password recovery is unavailable in this environment.', 'استعادة كلمة المرور غير متاحة في هذه البيئة.')}</p>}
              <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
                <label htmlFor="recovery-email" className="label">{t('Email Address', 'البريد الإلكتروني')}</label>
                <div className="relative">
                  <Mail aria-hidden="true" size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-light-brown"/>
                  <input id="recovery-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} autoComplete="email" disabled={loading || !SUPABASE_CONFIGURED} aria-invalid={Boolean(error)} aria-describedby={error ? 'recovery-error' : undefined} className="input-field ps-10" placeholder="email@company.com"/>
                </div>
                {error && <p id="recovery-error" role="alert" className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading || !SUPABASE_CONFIGURED} className="btn-primary w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={18}/> : null}{t(loading ? 'Sending…' : 'Send reset link', loading ? 'جارٍ الإرسال…' : 'إرسال رابط الاستعادة')}</button>
              </form>
            </>
          )}
          <Link to="/login" className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-medium-brown hover:text-gold"><ArrowLeft className={lang === 'ar' ? 'rotate-180' : ''} size={15}/>{t('Back to sign in', 'العودة لتسجيل الدخول')}</Link>
        </div>
      </div>
    </div>
  );
}
