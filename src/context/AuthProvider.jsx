import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';
import { AuthContext } from './AuthContext';
import { ROLES } from './roles';

const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN];

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,full_name,role,avatar_url,user_type,company_name')
    .eq('id', userId)
    .maybeSingle().abortSignal(AbortSignal.timeout(10_000));
  if (error) throw error;
  return data ?? null;
}

function mergeProfile(authUser, profile) {
  return {
    id: authUser.id,
    isAnonymous: Boolean(authUser.is_anonymous),
    email: authUser.email,
    name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email,
    nameAr: profile?.full_name || authUser.email,
    role: profile?.role || ROLES.USER,
    avatar_url: profile?.avatar_url || null,
    user_type: profile?.user_type || authUser.user_metadata?.user_type || 'general_user',
    company_name: profile?.company_name || authUser.user_metadata?.company_name || null,
  };
}

function AuthLoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#070604]" role="status" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [profileRetry, setProfileRetry] = useState(0);
  const authVersion = useRef(0);
  const mounted = useRef(false);

  const nextAuthVersion = useCallback(() => {
    authVersion.current += 1;
    return authVersion.current;
  }, []);

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
      let failed = false;
      try {
        profile = await fetchProfile(authUser.id);
      } catch {
        failed = true; // Authorization fails closed, with a visible recovery path.
      }

      if (!mounted.current || version !== authVersion.current) return;
      setProfileError(failed);
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
        setProfileError(false);
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

    const refreshOnFocus = () => {
      const version = authVersion.current;
      void supabase.auth.getSession().then(({ data }) => {
        if (!mounted.current || version !== authVersion.current || !data.session?.user) return;
        void hydrateSession(data.session.user, nextAuthVersion());
      }).catch(() => {});
    };
    window.addEventListener('focus', refreshOnFocus);

    return () => {
      mounted.current = false;
      nextAuthVersion();
      for (const timer of deferredHydrations) window.clearTimeout(timer);
      deferredHydrations.clear();
      subscription.unsubscribe();
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [nextAuthVersion, profileRetry]);

  const login = useCallback(async (email, password) => {
    if (!SUPABASE_CONFIGURED) {
      throw new Error('Authentication is not configured in this environment.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    // Preserve the SDK error so the UI can distinguish unconfirmed email,
    // rate limiting and outages. Login renders only allowlisted messages.
    if (error) throw error;
    return data;
  }, []);

  const register = useCallback(async ({ email, password, fullName, userType, companyName }) => {
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
    return data;
  }, []);

  const logout = useCallback(async () => {
    if (SUPABASE_CONFIGURED) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      try { localStorage.removeItem('buod_session'); } catch { /* Storage may be disabled. */ }
    }
    nextAuthVersion();
    setUser(null);
    setLoading(false);
  }, [nextAuthVersion]);

  const isAdmin = useCallback(() => ADMIN_ROLES.includes(user?.role), [user?.role]);
  const canEdit = useCallback(
    (product) => isAdmin() || product?.created_by === user?.id,
    [isAdmin, user?.id],
  );

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    register,
    isAdmin,
    canEdit,
    SUPABASE_CONFIGURED,
  }), [canEdit, isAdmin, loading, login, logout, register, user]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? <AuthLoadingScreen /> : <>{profileError && <div role="alert" className="fixed bottom-4 start-4 z-[100] max-w-sm rounded-xl bg-red-50 p-4 text-sm text-red-900">Account permissions could not be loaded. تعذّر تحميل صلاحيات الحساب. <button type="button" className="underline" onClick={() => setProfileRetry(v => v + 1)}>Retry profile / إعادة المحاولة</button></div>}{children}</>}
    </AuthContext.Provider>
  );
}
