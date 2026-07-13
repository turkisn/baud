// Supabase client — reads env vars when available
// When VITE_SUPABASE_URL is not set, the app uses the localStorage mock service instead.
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_CONFIGURED = !!(supabaseUrl && supabaseKey
  && supabaseUrl !== 'https://your-project-id.supabase.co');

// Lazy-load the real client only when configured
let _client = null;
export async function getSupabaseClient() {
  if (!SUPABASE_CONFIGURED) return null;
  if (_client) return _client;
  const { createClient } = await import('@supabase/supabase-js');
  _client = createClient(supabaseUrl, supabaseKey);
  return _client;
}
