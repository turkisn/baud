import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
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
import Dashboard from './pages/Dashboard';
import BlockDetails from './pages/BlockDetails';
import Library from './pages/Library';
import LibraryDetail from './pages/LibraryDetail';
import LibraryAdmin from './pages/LibraryAdmin';
import AddProduct from './pages/products/AddProduct';
import MyProducts from './pages/products/MyProducts';
import ProductReview from './pages/admin/ProductReview';

// Pages that should NOT show the shared Navbar/Footer
const BARE_ROUTES = ['/login', '/dashboard', '/library-admin', '/products/add', '/my-products', '/admin'];

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/block/:id" element={<BlockDetails />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:id" element={<LibraryDetail />} />
          <Route path="/library-admin" element={<LibraryAdmin />} />
          <Route path="/products/add" element={<AddProduct />} />
          <Route path="/my-products" element={<MyProducts />} />
          <Route path="/admin/products" element={<ProductReview />} />
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
