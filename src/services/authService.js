import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

const SELF_PROFILE_FIELDS = 'id,full_name,email,role,avatar_url,user_type,company_name,phone,created_at,updated_at';
const SELF_PROFILE_UPDATE_FIELDS = new Set(['full_name', 'avatar_url', 'user_type', 'company_name', 'phone']);

export const authService = {
  async signUp({ email, password, fullName, userType, companyName }) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, user_type: userType, company_name: companyName || null },
        // Always redirect back to this domain, regardless of Supabase Site URL setting.
        // The hash fragment (#access_token=…) is processed automatically by the Supabase
        // JS client on the /login page, which then fires onAuthStateChange.
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw error;
    // Profile creation and the authorization role remain backend-controlled.
    // Registration metadata contains profile classification only; no direct
    // profile upsert is attempted while email confirmation is pending.
    return data;
  },

  async signIn({ email, password }) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  async updatePassword(password) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return data;
  },

  async getCurrentUser() {
    if (!SUPABASE_CONFIGURED) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getCurrentSession() {
    if (!SUPABASE_CONFIGURED) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async getCurrentProfile() {
    if (!SUPABASE_CONFIGURED) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select(SELF_PROFILE_FIELDS)
      .eq('id', user.id)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(updates) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const safeUpdates = Object.fromEntries(
      Object.entries(updates || {}).filter(([field, value]) => SELF_PROFILE_UPDATE_FIELDS.has(field) && value !== undefined)
    );
    if (!Object.keys(safeUpdates).length) throw new Error('No supported profile fields were provided.');
    const { data, error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', user.id)
      .select(SELF_PROFILE_FIELDS)
      .single();
    if (error) throw error;
    return data;
  },

  onAuthStateChange(callback) {
    if (!SUPABASE_CONFIGURED) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
  },
};
