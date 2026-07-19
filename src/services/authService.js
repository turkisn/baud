import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

export const authService = {
  async signUp({ email, password, fullName, role = 'user' }) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        // Always redirect back to this domain, regardless of Supabase Site URL setting.
        // The hash fragment (#access_token=…) is processed automatically by the Supabase
        // JS client on the /login page, which then fires onAuthStateChange.
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw error;
    // Profile is created automatically by the handle_new_user DB trigger,
    // which reads role from raw_user_meta_data. No manual upsert needed —
    // a direct upsert would bypass the trigger and fail RLS (no session
    // while email confirmation is pending).
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
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(updates) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  onAuthStateChange(callback) {
    if (!SUPABASE_CONFIGURED) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
  },
};
