const MAX_AGE = 10 * 60 * 1000;
export function recoverySessionId(session) {
  try {
    const claims = JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof claims.session_id === 'string' ? claims.session_id : null;
  } catch { return null; }
}
export function validRecoveryIntent(intent, session, now = Date.now()) {
  return Boolean(intent && session?.user?.id && intent.userId === session.user.id
    && intent.sessionId && intent.sessionId === recoverySessionId(session)
    && Number.isFinite(intent.startedAt) && now >= intent.startedAt && now - intent.startedAt < MAX_AGE);
}
export function recoveryIntentForEvent(event, session, previous, now = Date.now()) {
  const sessionId = recoverySessionId(session);
  if (event === 'PASSWORD_RECOVERY' && session?.user?.id && sessionId) return { userId: session.user.id, sessionId, startedAt: now };
  // The SDK also emits SIGNED_IN on reload/focus. Preserve only the exact recovery session.
  if (event === 'SIGNED_OUT' || !validRecoveryIntent(previous, session, now)) return null;
  return previous;
}
