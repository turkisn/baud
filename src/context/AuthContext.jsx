import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
  const authVersion = useRef(0);
  const mounted = useRef(false);
  const nextAuthVersion = useCallback(() => {
    authVersion.current += 1;
    return authVersion.current;
  }, []);

  // ── Supabase mode: listen to auth state ──────────────────────
  useEffect(() => {
    mounted.current = true;
    if (!SUPABASE_CONFIGURED) {
      setLoading(false);
      return () => { mounted.current = false; };
    }

    let currentSessionUserId = null;
    const deferredHydrations = new Set();

    const hydrateSession = async (authUser, version) => {
      let profile = null;
      try {
        profile = await fetchProfile(authUser.id);
      } catch {
        // Authentication still succeeds, but authorization fails closed to role=user.
      }

      if (!mounted.current || version !== authVersion.current) return;
      setUser(mergeProfile(authUser, profile));
      setLoading(false);
    };

    // Keep this callback synchronous. Supabase API calls made while the auth callback
    // lock is held can deadlock sign-in, sign-out, and initial-session restoration.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted.current) return;
      const version = nextAuthVersion();

      for (const timer of deferredHydrations) window.clearTimeout(timer);
      deferredHydrations.clear();

      if (!session?.user) {
        currentSessionUserId = null;
        setUser(null);
        setLoading(false);
        return;
      }

      const nextUserId = session.user.id;
      if (currentSessionUserId !== nextUserId) {
        currentSessionUserId = nextUserId;
        setUser(null);
        setLoading(true);
      }

      const timer = window.setTimeout(() => {
        deferredHydrations.delete(timer);
        void hydrateSession(session.user, version);
      }, 0);
      deferredHydrations.add(timer);
    });

    return () => {
      mounted.current = false;
      nextAuthVersion();
      for (const timer of deferredHydrations) window.clearTimeout(timer);
      deferredHydrations.clear();
      subscription.unsubscribe();
    };
  }, [nextAuthVersion]);

  // ── Helpers ───────────────────────────────────────────────────
  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,full_name,role,avatar_url,user_type,company_name')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
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
    // The synchronous auth listener schedules profile hydration after its callback
    // returns. Login navigation waits for that guarded server-profile result.
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
    nextAuthVersion();
    setUser(null);
    setLoading(false);
    if (!SUPABASE_CONFIGURED) {
      localStorage.removeItem('buod_session');
      return;
    }
    await supabase.auth.signOut();
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
