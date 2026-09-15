import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);
const MAX_COMPARISON = 3;

function textValue(value, maxLength = 500) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).trim();
  return text ? text.slice(0, maxLength) : null;
}

function normalizeDetails(value, fields) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const normalized = Object.fromEntries(fields.map((field) => [field, textValue(item[field])]).filter(([, fieldValue]) => fieldValue !== null));
    return Object.keys(normalized).length ? [normalized] : [];
  });
}

function uniqueProducts(value, limit = Infinity) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.slice(0, limit).flatMap((item) => {
    const normalized = snapshot(item);
    if (!normalized || seen.has(normalized.id)) return [];
    seen.add(normalized.id);
    return [normalized];
  });
}

function normalizeProjects(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.flatMap((project) => {
    if (!project || typeof project !== 'object' || Array.isArray(project)) return [];
    const id = textValue(project.id, 128);
    const name = textValue(project.name, 100);
    if (!id || !name || seen.has(id)) return [];
    seen.add(id);
    return [{
      id,
      name,
      products: uniqueProducts(project.products),
      createdAt: textValue(project.createdAt, 64) || new Date(0).toISOString(),
    }];
  });
}

function readStorage(key, normalize) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || 'null');
    return normalize(value);
  } catch {
    return [];
  }
}

function snapshot(product) {
  if (!product || typeof product !== 'object' || Array.isArray(product)) return null;
  const id = textValue(product.id || product.product_id, 128);
  if (!id) return null;
  return {
    id,
    slug: textValue(product.slug, 300) || id,
    product_name_ar: textValue(product.product_name_ar || product.name_ar),
    product_name_en: textValue(product.product_name_en || product.name_en),
    category_name_ar: textValue(product.category_name_ar || product.category_ar),
    category_name_en: textValue(product.category_name_en || product.category_en),
    supplier_name_ar: textValue(product.supplier_name_ar || product.company_name_ar),
    supplier_name_en: textValue(product.supplier_name_en || product.company_name_en),
    signed_image_url: typeof product.signed_image_url === 'string' && product.signed_image_url.startsWith('/demo/') ? product.signed_image_url : null,
    buod_reference: textValue(product.buod_reference, 128),
    price: product.price !== null && product.price !== undefined && product.price !== '' && Number.isFinite(Number(product.price)) ? Number(product.price) : null,
    currency: textValue(product.currency, 16),
    available_formats: Array.isArray(product.available_formats)
      ? product.available_formats.slice(0, 20).map((format) => textValue(format, 32)).filter(Boolean)
      : [],
    available_file_count: Math.max(0, Math.min(10_000, Number.parseInt(product.available_file_count ?? product.product_files?.length ?? 0, 10) || 0)),
    product_specifications: normalizeDetails(product.product_specifications, [
      'specification_name_ar', 'specification_name_en', 'specification_code', 'value', 'unit',
    ]),
    product_materials: normalizeDetails(product.product_materials, [
      'material_name_ar', 'material_name_en', 'material_code', 'material_type', 'finish', 'color',
    ]),
    brand_name: textValue(product.brand_name),
    country_of_origin: textValue(product.country_of_origin),
    in_stock: typeof product.in_stock === 'boolean' ? product.in_stock : null,
    verification_status: textValue(product.verification_status, 64),
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
  const [projects, setProjects] = useState(() => readStorage(projectsKey, normalizeProjects));
  const [comparison, setComparison] = useState(() => readStorage(
    comparisonKey,
    (value) => uniqueProducts(value, MAX_COMPARISON)
  ));

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
      if (!item) return;
      setProjects((current) => current.map((project) => project.id !== projectId || project.products.some((saved) => saved.id === item.id)
        ? project : { ...project, products: [...project.products, item] }));
    },
    removeFromProject(projectId, productId) {
      setProjects((current) => current.map((project) => project.id === projectId
        ? { ...project, products: project.products.filter((product) => product.id !== productId) } : project));
    },
    toggleComparison(product) {
      const item = snapshot(product);
      if (!item) return;
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
