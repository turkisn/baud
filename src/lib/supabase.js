import { recoveryIntentForEvent, validRecoveryIntent } from '../utils/recoveryIntent';
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

// Subscribe at client creation, before lazy routes/AuthProvider can miss recovery events.
const RECOVERY_KEY = 'buod-password-recovery';
let recoveryIntent = null;
try { recoveryIntent = JSON.parse(sessionStorage.getItem(RECOVERY_KEY)); } catch { /* unavailable */ }
export function clearRecoveryIntent() {
  recoveryIntent = null;
  try { sessionStorage.removeItem(RECOVERY_KEY); } catch { /* unavailable */ }
}
export function isRecoverySession(session) { return validRecoveryIntent(recoveryIntent, session); }
supabase?.auth.onAuthStateChange((event, session) => {
  recoveryIntent = recoveryIntentForEvent(event, session, recoveryIntent);
  try {
    if (recoveryIntent) sessionStorage.setItem(RECOVERY_KEY, JSON.stringify(recoveryIntent));
    else sessionStorage.removeItem(RECOVERY_KEY);
  } catch { /* In-memory intent remains available until navigation/reload. */ }
});
