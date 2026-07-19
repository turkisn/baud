import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, Mail, Lock, User, Building,
  ArrowRight, CheckCircle, Globe, Loader2, AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { SUPABASE_CONFIGURED } from '../lib/supabase';
import { fadeInUp, stagger } from '../utils/animations';

// Roles that match the DB enum exactly
const userTypes = [
  { id: 'designer',     icon: '🎨', en: 'Designer',     ar: 'مصمم'    },
  { id: 'designer',     icon: '🏛️', en: 'Architect',    ar: 'معماري'  },
  { id: 'user',         icon: '🔨', en: 'Contractor',   ar: 'مقاول'   },
  { id: 'supplier',     icon: '📦', en: 'Supplier',     ar: 'مورد'    },
  { id: 'user',         icon: '🎓', en: 'Student',      ar: 'طالب'    },
].map((u, i) => ({ ...u, key: i })); // unique key per item

// Map Arabic Supabase errors to readable Arabic messages
function mapError(err) {
  if (!err) return null;
  const msg = err.message || String(err);
  if (msg.includes('Invalid login credentials'))    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if (msg.includes('Email not confirmed'))          return 'يرجى تأكيد بريدك الإلكتروني أولاً. تحقق من صندوق الوارد.';
  if (msg.includes('User already registered'))      return 'هذا البريد الإلكتروني مسجّل مسبقاً. جرّب تسجيل الدخول.';
  if (msg.includes('Password should be'))           return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
  if (msg.includes('Unable to validate email'))     return 'صيغة البريد الإلكتروني غير صحيحة.';
  if (msg.includes('rate limit'))                   return 'عدد كبير من المحاولات. انتظر دقيقة وحاول مجدداً.';
  if (msg.includes('Supabase not configured'))      return 'التسجيل غير مفعّل في هذه البيئة. أضف متغيرات VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في Vercel ثم أعد النشر.';
  return msg;
}

export default function Login() {
  const { t, lang, toggleLang } = useLanguage();
  const { login, register, user } = useAuth();
  const navigate                  = useNavigate();

  // If user is already authenticated (e.g. arrived here after clicking the
  // email confirmation link — Supabase appends #access_token=… to the URL,
  // the JS client processes it via onAuthStateChange, and AuthContext sets user),
  // redirect them away from the login page immediately.
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const [mode, setMode]         = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [userTypeIdx, setUserTypeIdx] = useState(0); // index into userTypes
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess]   = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', company: '', password: '',
  });

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [field]: null }));
    setError(null);
  };

  // ── Validation ────────────────────────────────────────────────
  function validate() {
    const errs = {};
    if (mode === 'signup' && !form.name.trim())
      errs.name = lang === 'ar' ? 'الاسم مطلوب.' : 'Name is required.';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      errs.email = lang === 'ar' ? 'بريد إلكتروني صحيح مطلوب.' : 'Valid email required.';
    if (!form.password || form.password.length < 6)
      errs.password = lang === 'ar' ? 'كلمة المرور 6 أحرف على الأقل.' : 'Password must be at least 6 characters.';
    return errs;
  }

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        // login() triggers onAuthStateChange SIGNED_IN → setUser() → useEffect navigates to '/'.
        // Do NOT call navigate('/') here — it would race with setUser() in concurrent React 18,
        // causing Navbar to mount before user state is committed (shows "Sign in" flash).
        await login(form.email, form.password);
        // navigation is handled by the useEffect below that watches user
      } else {
        // authService.signUp() includes role in user_metadata for the DB trigger
        const role = userTypes[userTypeIdx].id;
        await authService.signUp({
          email:    form.email,
          password: form.password,
          fullName: form.name,
          role,
        });
        setSuccess(true);
      }
    } catch (err) {
      console.error('[BUAD auth error]', err);
      setError(mapError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center p-6">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-md w-full text-center">
          <motion.div variants={fadeInUp} className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-2xl font-bold text-dark-brown mb-3">
            {t('Account created!', 'تم إنشاء الحساب!')}
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-medium-brown mb-2">
            {t(
              'We sent a confirmation email to',
              'أرسلنا رسالة تأكيد إلى'
            )}
          </motion.p>
          <motion.p variants={fadeInUp} className="font-semibold text-dark-brown mb-6">{form.email}</motion.p>
          <motion.p variants={fadeInUp} className="text-sm text-light-brown mb-8">
            {t(
              'Open your email and click the confirmation link, then come back to sign in.',
              'افتح بريدك الإلكتروني واضغط رابط التأكيد، ثم عُد وسجّل الدخول.'
            )}
          </motion.p>
          <motion.button
            variants={fadeInUp}
            onClick={() => { setSuccess(false); setMode('login'); setForm({ name:'', email: form.email, company:'', password:'' }); }}
            className="btn-primary justify-center py-3 text-sm"
          >
            {t('Go to Sign In', 'الذهاب لتسجيل الدخول')}
            <ArrowRight size={16} />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-brown relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div className="absolute top-20 right-10 w-64 h-64 opacity-[0.05] animate-spin-slow">
          <svg viewBox="0 0 200 200">
            <polygon points="100,0 200,100 100,200 0,100" fill="none" stroke="#C9A84C" strokeWidth="1"/>
            <polygon points="100,20 180,100 100,180 20,100" fill="none" stroke="#C9A84C" strokeWidth="0.7"/>
          </svg>
        </div>

        <div className="relative">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dark-brown rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl" style={{ fontFamily: 'Tajawal' }}>ب</span>
            </div>
            <span className="text-warm-white font-bold text-2xl">{lang === 'ar' ? 'بُعد' : 'Buad'}</span>
          </Link>
        </div>

        <div className="relative">
          <span className="badge-gold mb-6 inline-flex">🇸🇦 {t('Saudi Architecture Platform', 'منصة العمارة السعودية')}</span>
          <h2 className="text-4xl font-bold text-warm-white mb-4 leading-tight">
            {t('Design with real\nSaudi products', 'صمّم بمنتجات\nسعودية حقيقية')}
          </h2>
          <p className="text-light-brown text-lg leading-relaxed mb-8">
            {t(
              'Join 15,000+ architects and designers who use Buad to find, download, and specify real Saudi products.',
              'انضم إلى أكثر من 15,000 معماري ومصمم يستخدمون بُعد للعثور على منتجات سعودية حقيقية وتحميلها.'
            )}
          </p>
          <div className="space-y-3">
            {[
              t('2,400+ 3D blocks from real Saudi products', 'أكثر من 2,400 كتلة ثلاثية الأبعاد من منتجات سعودية حقيقية'),
              t('180+ verified Saudi suppliers', 'أكثر من 180 مورد سعودي موثق'),
              t('DWG, RVT, SKP and all major formats', 'DWG, RVT, SKP وجميع الصيغ الرئيسية'),
              t('Free for students and small firms', 'مجاني للطلاب والشركات الصغيرة'),
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 text-light-brown text-sm">
                <CheckCircle size={15} className="text-gold flex-shrink-0" /> {feat}
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-medium-brown flex items-center gap-2">
          <span>🇸🇦</span> {t('Aligned with Saudi Vision 2030', 'متوافق مع رؤية السعودية 2030')}
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-warm-white overflow-y-auto">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="w-full max-w-md">

          {/* Language toggle */}
          <motion.div variants={fadeInUp} className="flex justify-between items-center mb-8">
            <Link to="/" className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-dark-brown rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm" style={{ fontFamily: 'Tajawal' }}>ب</span>
              </div>
              <span className="font-bold text-dark-brown">{lang === 'ar' ? 'بُعد' : 'Buad'}</span>
            </Link>
            <button onClick={toggleLang} className="flex items-center gap-1.5 text-sm text-medium-brown hover:text-dark-brown ml-auto">
              <Globe size={15} /> {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
          </motion.div>

          {/* Mode tabs */}
          <motion.div variants={fadeInUp} className="flex bg-sand rounded-xl p-1 mb-8">
            {[
              { id: 'login',  en: 'Sign In',       ar: 'تسجيل الدخول' },
              { id: 'signup', en: 'Create Account', ar: 'إنشاء حساب'   },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setMode(tab.id); setError(null); setFieldErrors({}); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === tab.id
                    ? 'bg-white text-dark-brown shadow-sm'
                    : 'text-medium-brown hover:text-dark-brown'
                }`}
              >
                {lang === 'ar' ? tab.ar : tab.en}
              </button>
            ))}
          </motion.div>

          <motion.div variants={fadeInUp}>
            <h1 className="text-2xl font-bold text-dark-brown mb-1">
              {mode === 'login' ? t('Welcome back', 'أهلاً بعودتك') : t('Get started', 'ابدأ الآن')}
            </h1>
            <p className="text-light-brown text-sm mb-7">
              {mode === 'login'
                ? t('Sign in to your Buad account', 'سجّل الدخول إلى حسابك في بُعد')
                : t('Create your free Buad account', 'أنشئ حسابك المجاني في بُعد')}
            </p>
          </motion.div>

          {/* Demo accounts notice (login mode, no Supabase) */}
          {!SUPABASE_CONFIGURED && mode === 'login' && (
            <motion.div variants={fadeInUp} className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <p className="font-semibold">{t('Demo accounts:', 'حسابات تجريبية:')}</p>
              <p>admin@buad.com / admin123</p>
              <p>supplier@buad.com / sup123</p>
            </motion.div>
          )}

          {/* Supabase not configured warning (signup mode) */}
          {!SUPABASE_CONFIGURED && mode === 'signup' && (
            <motion.div variants={fadeInUp} className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
              <p className="font-semibold mb-1">
                {t('Registration unavailable', 'التسجيل غير مفعّل')}
              </p>
              <p>
                {t(
                  'Supabase environment variables are not configured in Vercel. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables, then redeploy.',
                  'متغيرات Supabase غير موجودة في Vercel. أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في Vercel → Settings → Environment Variables ثم أعد النشر.'
                )}
              </p>
            </motion.div>
          )}

          {/* Form */}
          <motion.form variants={fadeInUp} className="space-y-4" onSubmit={handleSubmit} noValidate>

            {/* Full Name */}
            {mode === 'signup' && (
              <div>
                <label className="label">{t('Full Name', 'الاسم الكامل')}</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-brown" />
                  <input
                    className={`input-field pl-10 ${fieldErrors.name ? 'border-red-400' : ''}`}
                    placeholder={t('Your full name', 'اسمك الكامل')}
                    value={form.name}
                    onChange={set('name')}
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="label">{t('Email Address', 'البريد الإلكتروني')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-brown" />
                <input
                  type="email"
                  className={`input-field pl-10 ${fieldErrors.email ? 'border-red-400' : ''}`}
                  placeholder="email@company.com"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Company */}
            {mode === 'signup' && (
              <div>
                <label className="label">{t('Company / University', 'الشركة / الجامعة')}</label>
                <div className="relative">
                  <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-brown" />
                  <input
                    className="input-field pl-10"
                    placeholder={t('Where you work or study', 'جهة عملك أو دراستك')}
                    value={form.company}
                    onChange={set('company')}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="label">{t('Password', 'كلمة المرور')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-brown" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input-field pl-10 pr-10 ${fieldErrors.password ? 'border-red-400' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-light-brown hover:text-dark-brown"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
              {mode === 'signup' && !fieldErrors.password && (
                <p className="mt-1 text-xs text-light-brown">
                  {t('Minimum 6 characters', 'الحد الأدنى 6 أحرف')}
                </p>
              )}
            </div>

            {/* Role selector */}
            {mode === 'signup' && (
              <div>
                <label className="label">{t('I am a…', 'أنا…')}</label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {userTypes.map((ut, i) => (
                    <button
                      key={ut.key}
                      type="button"
                      onClick={() => setUserTypeIdx(i)}
                      disabled={loading}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all ${
                        userTypeIdx === i
                          ? 'border-dark-brown bg-gold/5 text-gold'
                          : 'border-sand text-medium-brown hover:border-dark-brown/40'
                      }`}
                    >
                      <span className="text-xl">{ut.icon}</span>
                      {lang === 'ar' ? ut.ar : ut.en}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Forgot password */}
            {mode === 'login' && (
              <div className="flex justify-end">
                <a href="#" className="text-sm text-gold hover:underline">
                  {t('Forgot password?', 'نسيت كلمة المرور؟')}
                </a>
              </div>
            )}

            {/* Error banner — placed here so it's always visible above the submit button */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-700"
              >
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {mode === 'login'
                    ? t('Signing in…', 'جارٍ الدخول…')
                    : t('Creating account…', 'جارٍ الإنشاء…')}
                </>
              ) : (
                <>
                  {mode === 'login'
                    ? t('Sign In', 'تسجيل الدخول')
                    : t('Create Account', 'إنشاء حساب')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </motion.form>

          {mode === 'signup' && (
            <p className="text-xs text-light-brown text-center mt-4">
              {t('By signing up, you agree to our', 'بالتسجيل توافق على')}{' '}
              <a href="#" className="text-gold hover:underline">{t('Terms', 'الشروط')}</a>
              {' & '}
              <a href="#" className="text-gold hover:underline">{t('Privacy Policy', 'الخصوصية')}</a>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
