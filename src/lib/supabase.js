import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// Support both old anon key (eyJ...) and new publishable key (sb_publishable_...)
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_CONFIGURED =
  !!(supabaseUrl && supabaseKey &&
     supabaseUrl !== 'https://your-project-id.supabase.co');

export const supabase = SUPABASE_CONFIGURED
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
