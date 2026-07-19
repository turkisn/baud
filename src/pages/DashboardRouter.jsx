import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES    = ['super_admin', 'admin', 'reviewer'];
const SUPPLIER_ROLES = ['supplier', 'manufacturer'];

export default function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F4EF]">
        <div className="w-8 h-8 border-4 border-[#B68D57] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (ADMIN_ROLES.includes(user.role))    return <Navigate to="/admin/dashboard"    replace />;
  if (SUPPLIER_ROLES.includes(user.role)) return <Navigate to="/supplier/dashboard" replace />;
  return <Navigate to="/user/dashboard" replace />;
}
