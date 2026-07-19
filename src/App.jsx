import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Marketplace from './pages/Marketplace';
import Suppliers from './pages/Suppliers';
import Designers from './pages/Designers';
import AIBQO from './pages/AIBQO';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import Login from './pages/Login';
import DashboardRouter from './pages/DashboardRouter';
import AdminDashboard from './pages/admin/AdminDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import UserDashboard from './pages/UserDashboard';
import BlockDetails from './pages/BlockDetails';
import Library from './pages/Library';
import LibraryDetail from './pages/LibraryDetail';
import LibraryAdmin from './pages/LibraryAdmin';
import AddProduct from './pages/products/AddProduct';
import MyProducts from './pages/products/MyProducts';
import ProductReview from './pages/admin/ProductReview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSuppliers from './pages/admin/AdminSuppliers';
import AdminManufacturers from './pages/admin/AdminManufacturers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminSettings from './pages/admin/AdminSettings';

// Pages that should NOT show the shared Navbar/Footer
const BARE_ROUTES = [
  '/login',
  '/dashboard',
  '/admin/dashboard',
  '/supplier/dashboard',
  '/library-admin',
  '/products/add',
  '/my-products',
  '/admin',
];

function Layout() {
  const location = useLocation();
  const isBare = BARE_ROUTES.some(r => location.pathname.startsWith(r));

  return (
    <div className="min-h-screen flex flex-col">
      {!isBare && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/designers" element={<Designers />} />
          <Route path="/ai-boq" element={<AIBQO />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />

          {/* Dashboard routing — role-based redirect */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/supplier/dashboard" element={<ProtectedRoute requireSupplier><SupplierDashboard /></ProtectedRoute>} />
          <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />

          <Route path="/block/:id" element={<BlockDetails />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:id" element={<LibraryDetail />} />
          <Route path="/library-admin" element={<LibraryAdmin />} />
          <Route path="/products/add" element={<ProtectedRoute requireSupplier><AddProduct /></ProtectedRoute>} />
          <Route path="/my-products" element={<ProtectedRoute requireSupplier><MyProducts /></ProtectedRoute>} />
          <Route path="/admin/products"       element={<ProtectedRoute requireAdmin><ProductReview /></ProtectedRoute>} />
          <Route path="/admin/users"          element={<ProtectedRoute requireStrictAdmin><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/suppliers"      element={<ProtectedRoute requireStrictAdmin><AdminSuppliers /></ProtectedRoute>} />
          <Route path="/admin/manufacturers"  element={<ProtectedRoute requireStrictAdmin><AdminManufacturers /></ProtectedRoute>} />
          <Route path="/admin/categories"     element={<ProtectedRoute requireStrictAdmin><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/settings"       element={<ProtectedRoute requireStrictAdmin><AdminSettings /></ProtectedRoute>} />
        </Routes>
      </main>
      {!isBare && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
