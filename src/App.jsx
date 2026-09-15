import { lazy, Suspense, useEffect } from 'react';
import { BadgeCheck, Box, Boxes, Building2, Database, FileBox, GitBranch, Layers3, PackageCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppErrorBoundary from './components/AppErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import { AuthProvider } from './context/AuthProvider';
import { LanguageProvider } from './context/LanguageProvider';
import { useLanguage } from './context/LanguageContext';
import { WorkspaceProvider } from './context/WorkspaceContext';

const BlockDetail = lazy(() => import('./pages/BlockDetail'));
const Blocks = lazy(() => import('./pages/Blocks'));
const Compare = lazy(() => import('./pages/Compare'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Projects = lazy(() => import('./pages/Projects'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const SupplierDetail = lazy(() => import('./pages/SupplierDetail'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Terms = lazy(() => import('./pages/Terms'));
const AdminBlocks = lazy(() => import('./pages/admin/AdminBlocks'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminSuppliers = lazy(() => import('./pages/admin/AdminSuppliers'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const ATMOSPHERE_ICONS = [
  Box, Database, Building2, FileBox, Sparkles, Layers3,
  GitBranch, PackageCheck, ShieldCheck, Boxes, BadgeCheck, Database,
  Building2, FileBox, Sparkles, Box, Layers3, GitBranch,
];
const ATMOSPHERE_TRAILS = Array.from({ length: 8 }, (_, index) => index + 1);
const ATMOSPHERE_DATA_LABELS = [
  'BIM', 'IFC', 'RVT', '3D', 'PDF', 'BOQ',
  'BUOD.ID', 'DATA', 'SUPPLIER', 'CATALOG', 'SPECS', 'FILE',
];

const PAGE_METADATA = {
  '/': {
    en: ['BUOD — Construction Product & BIM Library', 'Explore connected construction products, suppliers, BIM assets, 3D models and technical data through BUOD.'],
    ar: ['بُعد — مكتبة منتجات البناء وملفات BIM', 'استكشف منتجات البناء والموردين وملفات BIM والنماذج ثلاثية الأبعاد والبيانات الفنية عبر بُعد.'],
  },
  '/blocks': {
    en: ['Construction Products & BIM Blocks — BUOD', 'Search construction products and access their specifications, supplier data, BIM files and 3D resources.'],
    ar: ['منتجات البناء وبلوكات BIM — بُعد', 'ابحث في منتجات البناء واطلع على المواصفات وبيانات المورد وملفات BIM والموارد ثلاثية الأبعاد.'],
  },
  '/suppliers': {
    en: ['Construction Product Suppliers — BUOD', 'Explore verified construction suppliers and their published product libraries.'],
    ar: ['موردو منتجات البناء — بُعد', 'استكشف موردي منتجات البناء ومكتبات منتجاتهم المنشورة.'],
  },
  '/projects': {
    en: ['My Projects — BUOD', 'Organise selected construction products into private project collections in your browser.'],
    ar: ['مشاريعي — بُعد', 'نظّم منتجات البناء المختارة في مجموعات مشاريع خاصة داخل متصفحك.'],
  },
  '/compare': {
    en: ['Compare Construction Products — BUOD', 'Compare construction product specifications side by side.'],
    ar: ['مقارنة منتجات البناء — بُعد', 'قارن مواصفات منتجات البناء جنباً إلى جنب.'],
  },
  '/login': {
    en: ['Sign In or Create an Account — BUOD', 'Sign in to BUOD or create an account to access available product resources.'],
    ar: ['تسجيل الدخول أو إنشاء حساب — بُعد', 'سجّل الدخول إلى بُعد أو أنشئ حساباً للوصول إلى موارد المنتجات المتاحة.'],
  },
  '/forgot-password': {
    en: ['Reset Password — BUOD', 'Request a secure password reset link for your BUOD account.'],
    ar: ['استعادة كلمة المرور — بُعد', 'اطلب رابطاً آمناً لإعادة تعيين كلمة مرور حسابك في بُعد.'],
  },
  '/reset-password': {
    en: ['Choose a New Password — BUOD', 'Securely choose a new password for your BUOD account.'],
    ar: ['اختيار كلمة مرور جديدة — بُعد', 'اختر كلمة مرور جديدة وآمنة لحسابك في بُعد.'],
  },
  '/terms': {
    en: ['Terms of Use — BUOD', 'Read the terms governing use of the BUOD platform and its product resources.'],
    ar: ['شروط الاستخدام — بُعد', 'اطلع على الشروط المنظمة لاستخدام منصة بُعد وموارد المنتجات.'],
  },
  '/privacy': {
    en: ['Privacy Policy — BUOD', 'Learn how BUOD handles account and platform data.'],
    ar: ['سياسة الخصوصية — بُعد', 'تعرّف على كيفية تعامل بُعد مع بيانات الحساب والمنصة.'],
  },
};

function getPageMetadata(pathname, lang) {
  let metadata = PAGE_METADATA[pathname];
  if (!metadata && pathname.startsWith('/blocks/')) {
    metadata = {
      en: ['Construction Product Details — BUOD', 'Review product specifications, supplier data, usage rights and available design files.'],
      ar: ['تفاصيل منتج البناء — بُعد', 'اطلع على مواصفات المنتج وبيانات المورد وحقوق الاستخدام وملفات التصميم المتاحة.'],
    };
  }
  if (!metadata && pathname.startsWith('/suppliers/')) {
    metadata = {
      en: ['Supplier Profile — BUOD', 'Review a construction supplier profile and its published product library.'],
      ar: ['ملف المورد — بُعد', 'اطلع على ملف مورد منتجات البناء ومكتبة منتجاته المنشورة.'],
    };
  }
  if (!metadata && pathname.startsWith('/admin')) {
    metadata = {
      en: ['Administration — BUOD', 'Secure BUOD administration workspace.'],
      ar: ['الإدارة — بُعد', 'مساحة إدارة بُعد الآمنة.'],
    };
  }
  return (metadata || {
    en: ['Page Not Found — BUOD', 'The requested BUOD page could not be found.'],
    ar: ['الصفحة غير موجودة — بُعد', 'تعذّر العثور على صفحة بُعد المطلوبة.'],
  })[lang];
}

function RouteEffects() {
  const { pathname } = useLocation();
  const { lang } = useLanguage();

  useEffect(() => {
    const [title, description] = getPageMetadata(pathname, lang);
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', lang === 'ar' ? 'ar_SA' : 'en_US');
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);

    const canonical = document.querySelector('link[rel="canonical"]');
    canonical?.setAttribute('href', new URL(pathname, window.location.origin).toString());
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', new URL(pathname, window.location.origin).toString());
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', new URL('/hero.jpg', window.location.origin).toString());

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [lang, pathname]);

  return null;
}

function RouteLoading() {
  return <div className="grid min-h-[50vh] place-items-center" role="status"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent"/><span className="sr-only">Loading</span></div>;
}

function PublicAtmosphere() {
  return (
    <div className="public-atmosphere" aria-hidden="true">
      <div className="public-atmosphere-stars" />
      <div className="public-atmosphere-mesh" />
      <div className="public-atmosphere-scan" />
      <div className="public-atmosphere-icons">
        {ATMOSPHERE_ICONS.map((Icon, index) => <span key={index} className={`atmosphere-icon atmosphere-icon-${index + 1}`}><Icon /></span>)}
      </div>
      <div className="public-atmosphere-trails">
        {ATMOSPHERE_TRAILS.map((trail) => <span key={trail} className={`atmosphere-trail atmosphere-trail-${trail}`} />)}
      </div>
      <div className="public-atmosphere-data">
        {ATMOSPHERE_DATA_LABELS.map((label, index) => <span key={label} className={`atmosphere-data-tag atmosphere-data-tag-${index + 1}`}>{label}</span>)}
      </div>
    </div>
  );
}

function Layout() {
  const location = useLocation();
  const authPages = ['/login', '/forgot-password', '/reset-password'];
  const bare = authPages.includes(location.pathname) || location.pathname.startsWith('/admin');
  return <div className={`flex min-h-screen flex-col ${bare ? '' : 'public-shell'}`}><RouteEffects/><a href="#main-content" className="sr-only z-[100] rounded-lg bg-gold px-4 py-3 font-bold text-dark-brown focus:not-sr-only focus:fixed focus:start-4 focus:top-4">Skip to content / تخطَ إلى المحتوى</a>{!bare && <PublicAtmosphere/>}{!bare && <Navbar/>}<main id="main-content" className="flex-1" tabIndex="-1"><Suspense fallback={<RouteLoading/>}><Routes>
    <Route path="/" element={<Home/>}/><Route path="/blocks" element={<Blocks/>}/><Route path="/blocks/:slug" element={<BlockDetail/>}/><Route path="/suppliers" element={<Suppliers/>}/><Route path="/suppliers/:slug" element={<SupplierDetail/>}/><Route path="/projects" element={<Projects/>}/><Route path="/compare" element={<Compare/>}/><Route path="/login" element={<Login/>}/><Route path="/forgot-password" element={<ForgotPassword/>}/><Route path="/reset-password" element={<ResetPassword/>}/><Route path="/terms" element={<Terms/>}/><Route path="/privacy" element={<Privacy/>}/>
    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace/>}/><Route path="/admin/dashboard" element={<ProtectedRoute requireStrictAdmin><AdminDashboard/></ProtectedRoute>}/><Route path="/admin/products" element={<ProtectedRoute requireStrictAdmin><AdminBlocks/></ProtectedRoute>}/><Route path="/admin/users" element={<ProtectedRoute requireStrictAdmin><AdminUsers/></ProtectedRoute>}/><Route path="/admin/suppliers" element={<ProtectedRoute requireStrictAdmin><AdminSuppliers/></ProtectedRoute>}/><Route path="/admin/categories" element={<ProtectedRoute requireStrictAdmin><AdminCategories/></ProtectedRoute>}/><Route path="/admin/settings" element={<ProtectedRoute requireStrictAdmin><AdminSettings/></ProtectedRoute>}/>
    <Route path="*" element={<NotFound/>}/>
  </Routes></Suspense></main>{!bare && <Footer/>}</div>;
}
export default function App() { return <AppErrorBoundary><BrowserRouter><LanguageProvider><AuthProvider><WorkspaceProvider><Layout/></WorkspaceProvider></AuthProvider></LanguageProvider></BrowserRouter></AppErrorBoundary>; }
