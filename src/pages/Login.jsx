import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Building, ArrowRight, CheckCircle, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fadeInUp, stagger } from '../utils/animations';

const userTypes = [
  { id: 'designer', icon: '🎨', en: 'Designer', ar: 'مصمم' },
  { id: 'architect', icon: '🏛️', en: 'Architect', ar: 'معماري' },
  { id: 'contractor', icon: '🔨', en: 'Contractor', ar: 'مقاول' },
  { id: 'supplier', icon: '📦', en: 'Supplier', ar: 'مورد' },
  { id: 'student', icon: '🎓', en: 'Student', ar: 'طالب' },
];

export default function Login() {
  const { t, lang, toggleLang } = useLanguage();
  const [mode, setMode] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [userType, setUserType] = useState('designer');
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' });

  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-brown relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        <div className="absolute top-20 right-10 w-64 h-64 opacity-[0.05] animate-spin-slow">
          <svg viewBox="0 0 200 200"><polygon points="100,0 200,100 100,200 0,100" fill="none" stroke="#C9A84C" strokeWidth="1"/><polygon points="100,20 180,100 100,180 20,100" fill="none" stroke="#C9A84C" strokeWidth="0.7"/></svg>
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
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-warm-white">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="w-full max-w-md">

          {/* Language toggle (mobile) */}
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

          {/* Tab toggle */}
          <motion.div variants={fadeInUp} className="flex bg-sand rounded-xl p-1 mb-8">
            {[{ id: 'login', en: 'Sign In', ar: 'تسجيل الدخول' }, { id: 'signup', en: 'Create Account', ar: 'إنشاء حساب' }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === tab.id ? 'bg-white text-dark-brown shadow-sm' : 'text-medium-brown hover:text-dark-brown'}`}
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
              {mode === 'login' ? t('Sign in to your Buad account', 'سجّل الدخول إلى حسابك في بُعد') : t('Create your free Buad account', 'أنشئ حسابك المجاني في بُعد')}
            </p>
          </motion.div>

          {/* Social auth */}
          <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Google', svg: <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>, svg2: <><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></> },
            ].map(item => (
              <button key={item.label} className="flex items-center justify-center gap-2 border border-sand rounded-xl py-3 text-sm text-medium-brown hover:bg-sand transition-all">
                <svg className="w-4 h-4" viewBox="0 0 24 24">{item.svg}{item.svg2}</svg>
                {item.label}
              </button>
            ))}
            <button className="flex items-center justify-center gap-2 border border-sand rounded-xl py-3 text-sm text-medium-brown hover:bg-sand transition-all">
              <svg className="w-4 h-4" fill="#0077B5" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </button>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-sand" />
            <span className="text-xs text-light-brown">{t('or continue with email', 'أو تابع بالبريد')}</span>
            <div className="flex-1 h-px bg-sand" />
          </motion.div>

          {/* Form */}
          <motion.form variants={fadeInUp} className="space-y-4" onSubmit={e => e.preventDefault()}>
            {mode === 'signup' && (
              <div>
                <label className="label">{t('Full Name', 'الاسم الكامل')}</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-brown" />
                  <input className="input-field pl-10" placeholder={t('Your full name', 'اسمك الكامل')} />
                </div>
              </div>
            )}
            <div>
              <label className="label">{t('Email Address', 'البريد الإلكتروني')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-brown" />
                <input type="email" className="input-field pl-10" placeholder="email@company.com" />
              </div>
            </div>
            {mode === 'signup' && (
              <div>
                <label className="label">{t('Company / University', 'الشركة / الجامعة')}</label>
                <div className="relative">
                  <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-brown" />
                  <input className="input-field pl-10" placeholder={t('Where you work or study', 'جهة عملك أو دراستك')} />
                </div>
              </div>
            )}
            <div>
              <label className="label">{t('Password', 'كلمة المرور')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-brown" />
                <input type={showPass ? 'text' : 'password'} className="input-field pl-10 pr-10" placeholder={t('••••••••', '••••••••')} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-light-brown hover:text-dark-brown">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {mode === 'signup' && (
              <div>
                <label className="label">{t('I am a…', 'أنا…')}</label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {userTypes.map(ut => (
                    <button
                      key={ut.id}
                      type="button"
                      onClick={() => setUserType(ut.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all ${userType === ut.id ? 'border-dark-brown bg-gold/5 text-gold' : 'border-sand text-medium-brown hover:border-dark-brown/40'}`}
                    >
                      <span className="text-xl">{ut.icon}</span>
                      {lang === 'ar' ? ut.ar : ut.en}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {mode === 'login' && (
              <div className="flex justify-end">
                <a href="#" className="text-sm text-gold hover:underline">{t('Forgot password?', 'نسيت كلمة المرور؟')}</a>
              </div>
            )}
            <button type="submit" className="w-full btn-primary justify-center py-4 text-base">
              {mode === 'login' ? t('Sign In', 'تسجيل الدخول') : t('Create Account', 'إنشاء حساب')}
              <ArrowRight size={18} />
            </button>
          </motion.form>

          {mode === 'signup' && (
            <p className="text-xs text-light-brown text-center mt-4">
              {t('By signing up, you agree to our', 'بالتسجيل توافق على')}{' '}
              <a href="#" className="text-gold hover:underline">{t('Terms', 'الشروط')}</a>{' & '}
              <a href="#" className="text-gold hover:underline">{t('Privacy Policy', 'الخصوصية')}</a>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
