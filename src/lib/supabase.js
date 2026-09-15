import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// Support both old anon key (eyJ...) and new publishable key (sb_publishable_...)
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

function isValidSupabaseUrl(value) {
  if (!value || value === 'https://your-project-id.supabase.co') return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

function isUsableSupabaseKey(value) {
  return Boolean(value && value !== '[SENSITIVE]' && !value.includes('your-'));
}

export const SUPABASE_CONFIGURED =
  isValidSupabaseUrl(supabaseUrl) && isUsableSupabaseKey(supabaseKey);

export const supabase = SUPABASE_CONFIGURED
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
