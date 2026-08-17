import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import BlockDetail from './pages/BlockDetail';
import Blocks from './pages/Blocks';
import Home from './pages/Home';
import Login from './pages/Login';
import SupplierDetail from './pages/SupplierDetail';
import Suppliers from './pages/Suppliers';
import AdminBlocks from './pages/admin/AdminBlocks';
import AdminCategories from './pages/admin/AdminCategories';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSuppliers from './pages/admin/AdminSuppliers';
import AdminUsers from './pages/admin/AdminUsers';

function Layout() {
  const location = useLocation();
  const bare = location.pathname === '/login' || location.pathname.startsWith('/admin');
  return <div className="flex min-h-screen flex-col">{!bare && <Navbar/>}<main className="flex-1"><Routes>
    <Route path="/" element={<Home/>}/><Route path="/blocks" element={<Blocks/>}/><Route path="/blocks/:slug" element={<BlockDetail/>}/><Route path="/suppliers" element={<Suppliers/>}/><Route path="/suppliers/:slug" element={<SupplierDetail/>}/><Route path="/login" element={<Login/>}/>
    <Route path="/admin/dashboard" element={<ProtectedRoute requireStrictAdmin><AdminDashboard/></ProtectedRoute>}/><Route path="/admin/products" element={<ProtectedRoute requireStrictAdmin><AdminBlocks/></ProtectedRoute>}/><Route path="/admin/users" element={<ProtectedRoute requireStrictAdmin><AdminUsers/></ProtectedRoute>}/><Route path="/admin/suppliers" element={<ProtectedRoute requireStrictAdmin><AdminSuppliers/></ProtectedRoute>}/><Route path="/admin/categories" element={<ProtectedRoute requireStrictAdmin><AdminCategories/></ProtectedRoute>}/><Route path="/admin/settings" element={<ProtectedRoute requireStrictAdmin><AdminSettings/></ProtectedRoute>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></main>{!bare && <Footer/>}</div>;
}
export default function App() { return <BrowserRouter><LanguageProvider><AuthProvider><Layout/></AuthProvider></LanguageProvider></BrowserRouter>; }
