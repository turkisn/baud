import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

const AuthContext = createContext();

// ── Demo accounts (used when Supabase is not yet configured) ──
const DEMO_USERS = {
  'admin@buad.com':    { id: 'u-admin',    name: 'Admin BUAD',     nameAr: 'مدير بُعد',      role: 'admin',    email: 'admin@buad.com',    password: 'admin123' },
  'supplier@buad.com': { id: 'u-supplier', name: 'Saudi Supplier',  nameAr: 'مورد سعودي',    role: 'supplier', email: 'supplier@buad.com', password: 'sup123' },
  'designer@buad.com': { id: 'u-designer', name: 'Ali Designer',    nameAr: 'علي المصمم',    role: 'designer', email: 'designer@buad.com', password: 'des123' },
  'user@buad.com':     { id: 'u-user',     name: 'Test User',       nameAr: 'مستخدم تجريبي', role: 'user',     email: 'user@buad.com',     password: 'user123' },
};

export const ROLES = {
  USER:         'user',
  DESIGNER:     'designer',
  SUPPLIER:     'supplier',
  MANUFACTURER: 'manufacturer',
  REVIEWER:     'reviewer',
  ADMIN:        'admin',
  SUPER_ADMIN:  'super_admin',
};

const ADMIN_ROLES    = ['admin', 'super_admin', 'reviewer'];
const SUPPLIER_ROLES = ['supplier', 'manufacturer', ...ADMIN_ROLES];

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null); // profile-shaped object
  const [loading, setLoading] = useState(true);

  // ── Supabase mode: listen to auth state ──────────────────────
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      const saved = localStorage.getItem('buad_session');
      if (saved) {
        try { setUser(JSON.parse(saved)); } catch {}
      }
      setLoading(false);
      return;
    }

    // Check existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(mergeProfile(session.user, profile));
      }
      setLoading(false);
    });

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(mergeProfile(session.user, profile));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────
  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  }

  function mergeProfile(authUser, profile) {
    return {
      id: authUser.id,
      email: authUser.email,
      name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email,
      nameAr: profile?.full_name || authUser.email,
      role: profile?.role || 'user',
      avatar_url: profile?.avatar_url || null,
      company_name: profile?.company_name || null,
    };
  }

  // ── Login ─────────────────────────────────────────────────────
  const login = async (email, password) => {
    if (!SUPABASE_CONFIGURED) {
      const found = DEMO_USERS[email];
      if (!found || found.password !== password) {
        throw new Error('بريد إلكتروني أو كلمة مرور غير صحيحة');
      }
      const { password: _, ...safeUser } = found;
      localStorage.setItem('buad_session', JSON.stringify(safeUser));
      setUser(safeUser);
      return safeUser;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('بريد إلكتروني أو كلمة مرور غير صحيحة');
    return data;
  };

  // ── Register ──────────────────────────────────────────────────
  const register = async ({ email, password, fullName, role = 'user' }) => {
    if (!SUPABASE_CONFIGURED) {
      throw new Error('التسجيل غير متاح في وضع التجريبي');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw error;
    // Profile created by handle_new_user DB trigger — no manual upsert.
    return data;
  };

  // ── Logout ────────────────────────────────────────────────────
  const logout = async () => {
    if (!SUPABASE_CONFIGURED) {
      localStorage.removeItem('buad_session');
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  // ── Role helpers ──────────────────────────────────────────────
  const isAdmin    = () => ADMIN_ROLES.includes(user?.role);
  const isSupplier = () => SUPPLIER_ROLES.includes(user?.role);
  const canEdit    = (product) => isAdmin() || product?.created_by === user?.id;

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, logout, register,
      isAdmin, isSupplier, canEdit,
      SUPABASE_CONFIGURED,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
