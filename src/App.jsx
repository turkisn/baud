import { lazy, Suspense } from 'react';
import { BadgeCheck, Box, Boxes, Building2, Database, FileBox, GitBranch, Layers3, PackageCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import BlockDetail from './pages/BlockDetail';
import Blocks from './pages/Blocks';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Privacy from './pages/Privacy';
import ResetPassword from './pages/ResetPassword';
import SupplierDetail from './pages/SupplierDetail';
import Suppliers from './pages/Suppliers';
import Terms from './pages/Terms';

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
    </div>
  );
}

function Layout() {
  const location = useLocation();
  const authPages = ['/login', '/forgot-password', '/reset-password'];
  const bare = authPages.includes(location.pathname) || location.pathname.startsWith('/admin');
  return <div className={`flex min-h-screen flex-col ${bare ? '' : 'public-shell'}`}>{!bare && <PublicAtmosphere/>}{!bare && <Navbar/>}<main className="flex-1"><Suspense fallback={<RouteLoading/>}><Routes>
    <Route path="/" element={<Home/>}/><Route path="/blocks" element={<Blocks/>}/><Route path="/blocks/:slug" element={<BlockDetail/>}/><Route path="/suppliers" element={<Suppliers/>}/><Route path="/suppliers/:slug" element={<SupplierDetail/>}/><Route path="/login" element={<Login/>}/><Route path="/forgot-password" element={<ForgotPassword/>}/><Route path="/reset-password" element={<ResetPassword/>}/><Route path="/terms" element={<Terms/>}/><Route path="/privacy" element={<Privacy/>}/>
    <Route path="/admin/dashboard" element={<ProtectedRoute requireStrictAdmin><AdminDashboard/></ProtectedRoute>}/><Route path="/admin/products" element={<ProtectedRoute requireStrictAdmin><AdminBlocks/></ProtectedRoute>}/><Route path="/admin/users" element={<ProtectedRoute requireStrictAdmin><AdminUsers/></ProtectedRoute>}/><Route path="/admin/suppliers" element={<ProtectedRoute requireStrictAdmin><AdminSuppliers/></ProtectedRoute>}/><Route path="/admin/categories" element={<ProtectedRoute requireStrictAdmin><AdminCategories/></ProtectedRoute>}/><Route path="/admin/settings" element={<ProtectedRoute requireStrictAdmin><AdminSettings/></ProtectedRoute>}/>
    <Route path="*" element={<NotFound/>}/>
  </Routes></Suspense></main>{!bare && <Footer/>}</div>;
}
export default function App() { return <BrowserRouter><LanguageProvider><AuthProvider><Layout/></AuthProvider></LanguageProvider></BrowserRouter>; }
