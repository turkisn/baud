import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useAuth } from './AuthContext';
import { workspaceService } from '../services/workspaceService';
import { WorkspaceSync } from '../utils/workspaceSync';
import { MAX_COMPARISON, readStorage, snapshot, uniqueProducts } from '../utils/workspaceModel';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const owner = user?.id || 'guest';
  return <WorkspaceStore key={owner} owner={owner} cloud={Boolean(user?.id && !user.isAnonymous)}>{children}</WorkspaceStore>;
}

function WorkspaceStore({ children, owner, cloud }) {
  const store = useMemo(() => new WorkspaceSync({ owner, storage: {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  }, service: cloud ? workspaceService(owner) : null }), [owner, cloud]);
  const sync = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const comparisonKey = `buod-comparison:${owner}`;
  const [comparison, setComparison] = useState(() => readStorage(comparisonKey, value => uniqueProducts(value, MAX_COMPARISON)));

  useEffect(() => {
    store.start();
    const retry = () => { if (store.getSnapshot().status !== 'conflict') void store.refresh(); };
    const unload = event => {
      if (!store.pending && !store.getSnapshot().storageError) return;
      event.preventDefault();
      event.returnValue = '';
    };
    const hide = () => { if (document.visibilityState === 'hidden') void store.flush(); };
    window.addEventListener('online', retry);
    window.addEventListener('focus', retry);
    window.addEventListener('beforeunload', unload);
    document.addEventListener('visibilitychange', hide);
    return () => {
      store.stop();
      window.removeEventListener('online', retry);
      window.removeEventListener('focus', retry);
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('visibilitychange', hide);
    };
  }, [store]);

  useEffect(() => {
    try { window.localStorage.setItem(comparisonKey, JSON.stringify(comparison)); }
    catch { /* Comparison is optional; project persistence reports its own errors. */ }
  }, [comparisonKey, comparison]);

  const value = useMemo(() => ({
    projects: sync.projects, comparison, sync, canEditProjects: store.canEdit(),
    retrySync: () => store.refresh(),
    keepBoth: () => store.keepBoth(),
    chooseCloud: () => store.chooseCloud(),
    exportProjects(backup = false) {
      let projects = store.getSnapshot().projects;
      if (backup === true) {
        try { projects = JSON.parse(window.localStorage.getItem(`buod-workspace-backup:v1:${owner}`)).projects; }
        catch { store.emit({ storageError: true }); return; }
      }
      const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), projects }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup === true ? 'buod-conflict-backup.json' : 'buod-projects.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    createProject(name) {
      const clean = name.trim().slice(0, 100);
      if (!clean) return null;
      const project = { id: crypto.randomUUID(), name: clean, products: [], createdAt: new Date().toISOString() };
      return store.change(current => [project, ...current]) ? project.id : null;
    },
    removeProject(id) { return store.change(current => current.filter(project => project.id !== id)); },
    addToProject(projectId, product) {
      const item = snapshot(product);
      if (!item) return false;
      return store.change(current => current.map(project => project.id !== projectId || project.products.some(saved => saved.id === item.id)
        ? project : { ...project, products: [...project.products, item] }));
    },
    removeFromProject(projectId, productId) {
      return store.change(current => current.map(project => project.id === projectId
        ? { ...project, products: project.products.filter(product => product.id !== productId) } : project));
    },
    toggleComparison(product) {
      const item = snapshot(product);
      if (!item) return;
      setComparison(current => current.some(saved => saved.id === item.id)
        ? current.filter(saved => saved.id !== item.id)
        : current.length < MAX_COMPARISON ? [...current, item] : current);
    },
    clearComparison() { setComparison([]); },
    maxComparison: MAX_COMPARISON,
  }), [sync, comparison, store, owner]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace() { return useContext(WorkspaceContext); }
