import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// requireAdmin       → reviewer + admin + super_admin
// requireStrictAdmin → admin + super_admin only (no reviewer)
// requireSuperAdmin  → super_admin only
// requireSupplier    → supplier + manufacturer + all admin roles

export default function ProtectedRoute({
  children,
  requireAdmin       = false,
  requireStrictAdmin = false,
  requireSuperAdmin  = false,
  requireSupplier    = false,
}) {
  const { user, loading, isAdmin, isSupplier } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F4EF]">
        <div className="w-8 h-8 border-4 border-[#B68D57] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireSuperAdmin && user.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  if (requireStrictAdmin && !['admin', 'super_admin'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  if (requireSupplier && !isSupplier()) {
    return <Navigate to="/" replace />;
  }

  return children;
}
