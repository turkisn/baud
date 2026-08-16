import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

const AuthContext = createContext();

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
      setLoading(false);
      return;
    }

    // Single source of truth: onAuthStateChange fires INITIAL_SESSION immediately
    // on subscription (reads from localStorage, no network), then SIGNED_IN / SIGNED_OUT
    // as the session changes. No need for a separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (import.meta.env.DEV) console.debug('[BUOD:auth]', event);

      if (session?.user) {
        try {
          const profile = await fetchProfile(session.user.id);
          setUser(mergeProfile(session.user, profile));
        } catch {
          // Profile table not accessible — use auth data only; user is still authenticated
          setUser(mergeProfile(session.user, null));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────
  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && import.meta.env.DEV) console.debug('[BUOD:auth] Profile unavailable:', error.code);
    return data ?? null;
  }

  function mergeProfile(authUser, profile) {
    return {
      id: authUser.id,
      email: authUser.email,
      name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email,
      nameAr: profile?.full_name || authUser.email,
      role: profile?.role || 'user',
      avatar_url: profile?.avatar_url || null,
      user_type: profile?.user_type || authUser.user_metadata?.user_type || 'general_user',
      company_name: profile?.company_name || authUser.user_metadata?.company_name || null,
    };
  }

  // ── Login ─────────────────────────────────────────────────────
  const login = async (email, password) => {
    if (!SUPABASE_CONFIGURED) {
      throw new Error('Authentication is not configured in this environment.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Invalid login credentials');
    // Do NOT call setUser here. onAuthStateChange SIGNED_IN fires next and calls
    // fetchProfile, so user state is only committed once the real role is known.
    // This prevents DashboardRouter from seeing a stale role='user' fallback and
    // routing the user to /user/dashboard before the profile loads.
    // Login.jsx navigates only after onAuthStateChange commits the server profile.
    return data;
  };

  // ── Register ──────────────────────────────────────────────────
  const register = async ({ email, password, fullName, userType, companyName }) => {
    if (!SUPABASE_CONFIGURED) {
      throw new Error('Account registration is unavailable.');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, user_type: userType, company_name: companyName || null },
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
