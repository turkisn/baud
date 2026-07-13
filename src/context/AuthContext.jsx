import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Demo accounts — replace with real Supabase auth later
const DEMO_USERS = {
  'admin@buad.com':    { id: 'u-admin',    name: 'Admin BUAD',    nameAr: 'مدير بُعد',     role: 'admin',    email: 'admin@buad.com',    password: 'admin123' },
  'supplier@buad.com': { id: 'u-supplier', name: 'Saudi Supplier', nameAr: 'مورد سعودي',   role: 'supplier', email: 'supplier@buad.com', password: 'sup123' },
  'designer@buad.com': { id: 'u-designer', name: 'Ali Designer',   nameAr: 'علي المصمم',   role: 'designer', email: 'designer@buad.com', password: 'des123' },
  'user@buad.com':     { id: 'u-user',     name: 'Test User',      nameAr: 'مستخدم تجريبي', role: 'user',     email: 'user@buad.com',     password: 'user123' },
};

export const ROLES = {
  USER:        'user',
  DESIGNER:    'designer',
  SUPPLIER:    'supplier',
  MANUFACTURER:'manufacturer',
  REVIEWER:    'reviewer',
  ADMIN:       'admin',
  SUPER_ADMIN: 'super_admin',
};

const ADMIN_ROLES = ['admin', 'super_admin', 'reviewer'];

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('buad_session');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const found = DEMO_USERS[email];
    if (!found || found.password !== password) {
      throw new Error('بريد إلكتروني أو كلمة مرور غير صحيحة');
    }
    const { password: _, ...safeUser } = found;
    localStorage.setItem('buad_session', JSON.stringify(safeUser));
    setUser(safeUser);
    return safeUser;
  };

  const logout = () => {
    localStorage.removeItem('buad_session');
    setUser(null);
  };

  const isAdmin    = () => ADMIN_ROLES.includes(user?.role);
  const isSupplier = () => ['supplier', 'manufacturer', ...ADMIN_ROLES].includes(user?.role);
  const canEdit    = (product) => isAdmin() || product?.created_by === user?.id;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isSupplier, canEdit }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
