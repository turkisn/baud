export function validateReleaseConfig(env, production = false) {
  const errors = [];
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '';
  if (key.startsWith('sb_secret_')) errors.push('A secret Supabase key must never be bundled.');
  if (key.startsWith('eyJ')) {
    try {
      const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'anon') errors.push('The browser JWT key must have role=anon.');
    } catch { errors.push('The Supabase browser key is malformed.'); }
  }
  if (!production) return errors;
  if (env.VITE_DEMO_MODE === 'true') errors.push('Production must disable demo mode.');
  if (!key || key.includes('your-') || key.includes('fixture')) errors.push('Production needs a real public Supabase key.');
  try {
    const url = new URL(env.VITE_SUPABASE_URL);
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co') || /uhcvfwajowdszxteanlx|fixture|your-project/.test(url.hostname)) {
      errors.push('Production must use its approved Supabase project, separate from BUOD Staging.');
    }
  } catch { errors.push('Production needs a valid Supabase URL.'); }
  try {
    const url = new URL(env.VITE_APP_URL);
    if (url.protocol !== 'https:' || /localhost|staging|\.invalid$|\.example$/.test(url.hostname)) errors.push('Production needs its approved HTTPS application URL.');
  } catch { errors.push('Production needs an application URL.'); }
  return errors;
}
