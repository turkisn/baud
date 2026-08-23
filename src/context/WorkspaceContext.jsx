import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);
const MAX_COMPARISON = 3;

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || 'null');
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function snapshot(product) {
  return {
    id: product.id || product.product_id,
    slug: product.slug,
    product_name_ar: product.product_name_ar || product.name_ar,
    product_name_en: product.product_name_en || product.name_en,
    category_name_ar: product.category_name_ar || product.category_ar,
    category_name_en: product.category_name_en || product.category_en,
    supplier_name_ar: product.supplier_name_ar || product.company_name_ar,
    supplier_name_en: product.supplier_name_en || product.company_name_en,
    signed_image_url: product.signed_image_url?.startsWith('/demo/') ? product.signed_image_url : null,
    buod_reference: product.buod_reference,
    price: product.price,
    currency: product.currency,
    available_formats: product.available_formats || [],
    available_file_count: product.available_file_count || product.product_files?.length || 0,
    product_specifications: product.product_specifications || [],
    product_materials: product.product_materials || [],
    brand_name: product.brand_name,
    country_of_origin: product.country_of_origin,
    in_stock: product.in_stock,
    verification_status: product.verification_status,
  };
}

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const owner = user?.id || 'guest';
  return <WorkspaceStore key={owner} owner={owner}>{children}</WorkspaceStore>;
}

function WorkspaceStore({ children, owner }) {
  const projectsKey = `buod-projects:${owner}`;
  const comparisonKey = `buod-comparison:${owner}`;
  const [projects, setProjects] = useState(() => readStorage(projectsKey, []));
  const [comparison, setComparison] = useState(() => readStorage(comparisonKey, []));

  useEffect(() => {
    try { window.localStorage.setItem(projectsKey, JSON.stringify(projects)); } catch { /* Storage may be disabled. */ }
  }, [projectsKey, projects]);

  useEffect(() => {
    try { window.localStorage.setItem(comparisonKey, JSON.stringify(comparison)); } catch { /* Storage may be disabled. */ }
  }, [comparisonKey, comparison]);

  const value = useMemo(() => ({
    projects,
    comparison,
    createProject(name) {
      const clean = name.trim().slice(0, 100);
      if (!clean) return null;
      const project = { id: window.crypto?.randomUUID?.() || String(Date.now()), name: clean, products: [], createdAt: new Date().toISOString() };
      setProjects((current) => [project, ...current]);
      return project.id;
    },
    removeProject(id) { setProjects((current) => current.filter((project) => project.id !== id)); },
    addToProject(projectId, product) {
      const item = snapshot(product);
      setProjects((current) => current.map((project) => project.id !== projectId || project.products.some((saved) => saved.id === item.id)
        ? project : { ...project, products: [...project.products, item] }));
    },
    removeFromProject(projectId, productId) {
      setProjects((current) => current.map((project) => project.id === projectId
        ? { ...project, products: project.products.filter((product) => product.id !== productId) } : project));
    },
    toggleComparison(product) {
      const item = snapshot(product);
      setComparison((current) => current.some((saved) => saved.id === item.id)
        ? current.filter((saved) => saved.id !== item.id)
        : current.length < MAX_COMPARISON ? [...current, item] : current);
    },
    clearComparison() { setComparison([]); },
    maxComparison: MAX_COMPARISON,
  }), [projects, comparison]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace() { return useContext(WorkspaceContext); }
