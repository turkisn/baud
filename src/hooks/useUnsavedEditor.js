import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
export function useUnsavedEditor(dirty, busy, onClose, message) {
  const blocker = useBlocker(dirty || busy);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (!busy && window.confirm(message)) blocker.proceed();
    else blocker.reset();
  }, [blocker, busy, message]);
  useEffect(() => {
    if (!dirty && !busy) return undefined;
    const unload = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', unload);
    return () => window.removeEventListener('beforeunload', unload);
  }, [dirty, busy]);
  return () => { if (!busy && (!dirty || window.confirm(message))) onClose(); };
}
