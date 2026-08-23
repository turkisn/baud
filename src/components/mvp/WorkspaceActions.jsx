import { useState } from 'react';
import { Check, FolderPlus, GitCompareArrows, Plus, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function WorkspaceActions({ product, compact = false }) {
  const { t } = useLanguage();
  const { projects, comparison, maxComparison, toggleComparison, createProject, addToProject } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const selected = comparison.some((item) => item.id === (product.id || product.product_id));
  const full = !selected && comparison.length >= maxComparison;
  const stop = (event) => { event.preventDefault(); event.stopPropagation(); };

  function add(projectId, event) {
    stop(event);
    addToProject(projectId, product);
    setOpen(false);
  }

  function create(event) {
    stop(event);
    const projectId = createProject(name);
    if (projectId) { addToProject(projectId, product); setName(''); setOpen(false); }
  }

  return <div className={`relative flex items-center gap-2 ${compact ? '' : 'flex-wrap'}`} onClick={stop}>
    <button type="button" onClick={(event) => { stop(event); if (!full) toggleComparison(product); }} disabled={full} aria-pressed={selected} title={full ? t('Compare up to three products', 'قارن حتى ثلاثة منتجات') : t('Compare product', 'مقارنة المنتج')} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${selected ? 'border-gold/70 bg-gold/20 text-light-gold' : 'border-gold/20 bg-black/80 text-sand hover:border-gold/60'}`}><GitCompareArrows size={15}/>{!compact && (selected ? t('In comparison', 'ضمن المقارنة') : t('Compare', 'مقارنة'))}</button>
    <button type="button" onClick={(event) => { stop(event); setOpen(!open); }} aria-expanded={open} title={t('Save to project', 'حفظ في مشروع')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/20 bg-black/80 px-3 py-2 text-xs font-semibold text-sand transition hover:border-gold/60"><FolderPlus size={15}/>{!compact && t('Save to project', 'حفظ بمشروع')}</button>
    {open && <div className="absolute end-0 top-full z-30 mt-2 w-72 rounded-2xl border border-gold/25 bg-[#0d0b08] p-4 shadow-2xl" onClick={stop}><div className="mb-3 flex items-center justify-between"><strong className="text-sm text-warm-white">{t('Add to a project', 'إضافة لمشروع')}</strong><button type="button" onClick={() => setOpen(false)} aria-label={t('Close', 'إغلاق')} className="text-sand/60"><X size={16}/></button></div>{projects.length > 0 && <div className="mb-3 max-h-40 space-y-1 overflow-auto">{projects.map((project) => { const saved = project.products.some((item) => item.id === (product.id || product.product_id)); return <button key={project.id} type="button" onClick={(event) => add(project.id, event)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-xs text-sand hover:bg-gold/10">{project.name}{saved && <Check size={14} className="text-gold"/>}</button>; })}</div>}<form onSubmit={create} className="flex gap-2"><input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder={t('New project name', 'اسم مشروع جديد')} className="min-w-0 flex-1 rounded-lg border border-gold/20 bg-black px-2 py-2 text-xs text-warm-white"/><button type="submit" aria-label={t('Create project', 'إنشاء مشروع')} className="rounded-lg bg-gold px-2 text-black"><Plus size={16}/></button></form></div>}
  </div>;
}
